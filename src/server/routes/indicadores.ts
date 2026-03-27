import { Router } from 'express';
import { query, pool } from '../db.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createIndicadorSchema, updateIndicadorSchema, updateRealizadoSchema } from '../schemas/index.js';
import { logAudit } from '../utils/audit.js';
import crypto from 'crypto';
import Decimal from 'decimal.js';
import type { Indicador, Projeto, HistoricoIndicador } from '../types/index.js';

export const indicadoresRouter = Router();
indicadoresRouter.use(authenticate);

// ── GET / ─────────────────────────────────────────────────
indicadoresRouter.get('/', async (req: AuthRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const offset = (page - 1) * limit;
  const projetoId = req.query.projetoId as string;
  const metaId = req.query.metaId as string;
  const avulsos = req.query.avulsos as string;
  const mes = req.query.mes as string; // format: YYYY-MM

  let where = 'i."deletedAt" IS NULL';
  const params: unknown[] = [];
  let idx = 1;
  if (projetoId) { where += ` AND i."projetoId" = $${idx++}`; params.push(projetoId); }
  if (metaId) { where += ` AND (p."metaId" = $${idx} OR i."metaId" = $${idx})`; params.push(metaId); idx++; }
  if (avulsos === 'true') { where += ` AND i."projetoId" IS NULL AND i."metaId" IS NULL`; }

  // Month-specific subquery for realizado
  let mesJoin = '';
  let mesSelect = '';
  if (mes && /^\d{4}-\d{2}$/.test(mes)) {
    const [year, month] = mes.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, month - 1, 1)).toISOString();
    const endDate = new Date(Date.UTC(year, month, 1)).toISOString();
    mesSelect = `, COALESCE(hm."totalMes", 0) as "realizadoMesCentavos"`;
    mesJoin = ` LEFT JOIN (
      SELECT "indicadorId", SUM("valorCentavos") as "totalMes"
      FROM historico_indicadores
      WHERE data >= $${idx} AND data < $${idx + 1}
      GROUP BY "indicadorId"
    ) hm ON hm."indicadorId" = i.id`;
    params.push(startDate, endDate);
    idx += 2;
  }

  try {
    const totalResult = await query(
      `SELECT COUNT(*) as count FROM indicadores i LEFT JOIN projetos p ON p.id = i."projetoId" WHERE ${where}`,
      params.slice(0, mes ? params.length - 2 : params.length) // count doesn't need mes params
    );
    const total = parseInt(totalResult.rows[0].count);

    const result = await query(`
      SELECT i.*, p.nome as "projetoNome",
             COALESCE(m.nome, md.nome) as "metaNome"${mesSelect}
      FROM indicadores i
      LEFT JOIN projetos p ON p.id = i."projetoId"
      LEFT JOIN metas m ON m.id = p."metaId"
      LEFT JOIN metas md ON md.id = i."metaId"${mesJoin}
      WHERE ${where} ORDER BY i.nome ASC LIMIT $${idx++} OFFSET $${idx++}
    `, [...params, limit, offset]);

    res.json({
      success: true,
      data: result.rows,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('Erro ao listar indicadores:', err);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// ── GET /:id ──────────────────────────────────────────────
indicadoresRouter.get('/:id', async (req: AuthRequest, res) => {
  try {
    const result = await query(`
      SELECT i.*, p.nome as "projetoNome",
             COALESCE(m.nome, md.nome) as "metaNome"
      FROM indicadores i
      LEFT JOIN projetos p ON p.id = i."projetoId"
      LEFT JOIN metas m ON m.id = p."metaId"
      LEFT JOIN metas md ON md.id = i."metaId"
      WHERE i.id = $1 AND i."deletedAt" IS NULL
    `, [req.params.id]);
    const indicador = result.rows[0];
    if (!indicador) return res.status(404).json({ success: false, error: 'Indicador não encontrado' });

    const historicoResult = await query(
      'SELECT * FROM historico_indicadores WHERE "indicadorId" = $1 ORDER BY data DESC',
      [indicador.id]
    );

    res.json({ success: true, data: { ...indicador, historico: historicoResult.rows } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// ── POST / — Create ──────────────────────────────────────
indicadoresRouter.post('/', authorize(['ADMIN', 'GESTOR']), validate(createIndicadorSchema), async (req: AuthRequest, res) => {
  const { projetoId, metaId, nome, metaIndicador, unidade, peso, frequenciaAtualizacao, responsavel } = req.body;

  try {
    if (projetoId) {
      const projetoResult = await query('SELECT * FROM projetos WHERE id = $1 AND "deletedAt" IS NULL', [projetoId]);
      if (projetoResult.rows.length === 0) return res.status(404).json({ success: false, error: 'Projeto não encontrado' });

      // Validação de soma de pesos (apenas quando existe vínculo com projeto)
      const pesosResult = await query('SELECT peso FROM indicadores WHERE "projetoId" = $1 AND "deletedAt" IS NULL', [projetoId]);
      let somaPesos = new Decimal(peso);
      for (const i of pesosResult.rows) somaPesos = somaPesos.plus(i.peso);

      if (somaPesos.greaterThan(1)) {
        return res.status(400).json({ success: false, error: `Soma dos pesos excede 1.0 (seria ${somaPesos.toFixed(2)})` });
      }
    }

    if (metaId && !projetoId) {
      const metaResult = await query('SELECT * FROM metas WHERE id = $1 AND "deletedAt" IS NULL', [metaId]);
      if (metaResult.rows.length === 0) return res.status(404).json({ success: false, error: 'Meta não encontrada' });
    }

    let resolvedMetaId = metaId || null;
    if (projetoId && !metaId) {
       const projMeta = await query('SELECT "metaId" FROM projetos WHERE id = $1', [projetoId]);
       if (projMeta.rows.length > 0) resolvedMetaId = projMeta.rows[0].metaId;
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const metaIndicadorCentavos = Math.round(metaIndicador * 100);

    await query(`
      INSERT INTO indicadores (id, "projetoId", "metaId", nome, "metaIndicadorCentavos", "realizadoCentavos", unidade, peso, "frequenciaAtualizacao", responsavel, "dataUltimaAtualizacao", "statusAtualizacao", "criadoEm", "atualizadoEm")
      VALUES ($1, $2, $3, $4, $5, 0, $6, $7, $8, $9, $10, 'PENDENTE', $11, $12)
    `, [id, projetoId || null, resolvedMetaId, nome, metaIndicadorCentavos, unidade, peso, frequenciaAtualizacao, responsavel, now, now, now]);

    await logAudit(req.user!.id, 'CREATE', 'Indicador', id, null, req.body, req.ip, req.headers['user-agent']);
    res.json({ success: true, data: { id } });
  } catch (err) {
    console.error('Erro ao criar indicador:', err);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// ── PUT /:id — Update ─────────────────────────────────────
indicadoresRouter.put('/:id', authorize(['ADMIN', 'GESTOR']), validate(updateIndicadorSchema), async (req: AuthRequest, res) => {
  try {
    const result = await query('SELECT * FROM indicadores WHERE id = $1 AND "deletedAt" IS NULL', [req.params.id]);
    const indicador = result.rows[0];
    if (!indicador) return res.status(404).json({ success: false, error: 'Indicador não encontrado' });

    const { projetoId, metaId, nome, metaIndicador, unidade, peso, frequenciaAtualizacao, responsavel } = req.body;
    const now = new Date().toISOString();

    const novoProjetoId = projetoId !== undefined ? (projetoId || null) : indicador.projetoId;
    let resolvedMetaId = metaId !== undefined ? (metaId || null) : indicador.metaId;

    if (novoProjetoId && (projetoId !== undefined || metaId === undefined)) {
       const projMeta = await query('SELECT "metaId" FROM projetos WHERE id = $1', [novoProjetoId]);
       if (projMeta.rows.length > 0) resolvedMetaId = projMeta.rows[0].metaId;
    }

    if (novoProjetoId && (novoProjetoId !== indicador.projetoId || (peso !== undefined && peso !== indicador.peso))) {
      const p = peso ?? indicador.peso;
      const outrosResult = await query(
        'SELECT peso FROM indicadores WHERE "projetoId" = $1 AND id != $2 AND "deletedAt" IS NULL',
        [novoProjetoId, indicador.id]
      );
      let soma = new Decimal(p);
      for (const i of outrosResult.rows) soma = soma.plus(i.peso);
      if (soma.greaterThan(1)) {
        return res.status(400).json({ success: false, error: `Soma dos pesos excederia 1.0 (${soma.toFixed(2)})` });
      }
    }

    const metaCentavos = metaIndicador !== undefined ? Math.round(metaIndicador * 100) : indicador.metaIndicadorCentavos;

    await query(`
      UPDATE indicadores SET "projetoId" = $1, "metaId" = $2, nome = $3, "metaIndicadorCentavos" = $4, unidade = $5, peso = $6,
      "frequenciaAtualizacao" = $7, responsavel = $8, "atualizadoEm" = $9 WHERE id = $10
    `, [
      novoProjetoId, resolvedMetaId, nome || indicador.nome, metaCentavos, unidade || indicador.unidade,
      peso ?? indicador.peso, frequenciaAtualizacao || indicador.frequenciaAtualizacao,
      responsavel || indicador.responsavel, now, indicador.id,
    ]);

    await logAudit(req.user!.id, 'UPDATE', 'Indicador', indicador.id, indicador, req.body, req.ip, req.headers['user-agent']);
    res.json({ success: true, data: { id: indicador.id } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// ── POST /:id/atualizar — Update realizado (with optional retroactive date) ──
indicadoresRouter.post('/:id/atualizar', authorize(['ADMIN', 'GESTOR', 'OPERADOR']), validate(updateRealizadoSchema), async (req: AuthRequest, res) => {
  const { realizado, data: dataRef } = req.body;

  try {
    const result = await query('SELECT * FROM indicadores WHERE id = $1 AND "deletedAt" IS NULL', [req.params.id]);
    const indicador = result.rows[0];
    if (!indicador) return res.status(404).json({ success: false, error: 'Indicador não encontrado' });

    if (req.user!.role === 'OPERADOR' && indicador.responsavel !== req.user!.id) {
      return res.status(403).json({ success: false, error: 'Acesso negado' });
    }

    const realizadoCentavos = Math.round(realizado * 100);
    const dataLancamento = dataRef || new Date().toISOString();
    const now = new Date().toISOString();

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        'INSERT INTO historico_indicadores (id, "indicadorId", data, "valorCentavos", "atualizadoPor") VALUES ($1, $2, $3, $4, $5)',
        [crypto.randomUUID(), indicador.id, dataLancamento, realizadoCentavos, req.user!.id]
      );

      // Recalcula realizado como soma de todo o histórico
      const somaResult = await client.query(
        'SELECT COALESCE(SUM("valorCentavos"), 0) as total FROM historico_indicadores WHERE "indicadorId" = $1',
        [indicador.id]
      );
      const totalRealizado = parseInt(somaResult.rows[0].total);

      await client.query(
        `UPDATE indicadores SET "realizadoCentavos" = $1, "dataUltimaAtualizacao" = $2, "statusAtualizacao" = 'ATUALIZADO', "atualizadoEm" = $3 WHERE id = $4`,
        [totalRealizado, now, now, indicador.id]
      );
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    await logAudit(req.user!.id, 'UPDATE', 'Indicador', indicador.id, { realizado: indicador.realizadoCentavos }, { realizado: realizadoCentavos, data: dataLancamento }, req.ip, req.headers['user-agent']);
    res.json({ success: true, data: { id: indicador.id } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// ── GET /:id/historico — List history entries ───────────────
indicadoresRouter.get('/:id/historico', async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT h.*, u.nome as "atualizadoPorNome"
       FROM historico_indicadores h
       LEFT JOIN users u ON u.id = h."atualizadoPor"
       WHERE h."indicadorId" = $1
       ORDER BY h.data DESC`,
      [req.params.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Erro ao listar histórico:', err);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// ── PUT /historico/:histId — Edit a history entry ───────────
indicadoresRouter.put('/historico/:histId', authorize(['ADMIN', 'GESTOR']), async (req: AuthRequest, res) => {
  const { realizado, data: dataRef } = req.body;
  try {
    const histResult = await query('SELECT * FROM historico_indicadores WHERE id = $1', [req.params.histId]);
    const hist = histResult.rows[0];
    if (!hist) return res.status(404).json({ success: false, error: 'Registro não encontrado' });

    const valorCentavos = realizado !== undefined ? Math.round(realizado * 100) : hist.valorCentavos;
    const dataFinal = dataRef || hist.data;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        'UPDATE historico_indicadores SET "valorCentavos" = $1, data = $2 WHERE id = $3',
        [valorCentavos, dataFinal, hist.id]
      );

      // Recalcula realizado do indicador
      const somaResult = await client.query(
        'SELECT COALESCE(SUM("valorCentavos"), 0) as total FROM historico_indicadores WHERE "indicadorId" = $1',
        [hist.indicadorId]
      );
      const totalRealizado = parseInt(somaResult.rows[0].total);
      const now = new Date().toISOString();
      await client.query(
        'UPDATE indicadores SET "realizadoCentavos" = $1, "atualizadoEm" = $2 WHERE id = $3',
        [totalRealizado, now, hist.indicadorId]
      );
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    await logAudit(req.user!.id, 'UPDATE', 'HistoricoIndicador', hist.id, hist, { valorCentavos, data: dataFinal }, req.ip, req.headers['user-agent']);
    res.json({ success: true, data: { id: hist.id } });
  } catch (err) {
    console.error('Erro ao editar histórico:', err);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// ── DELETE /historico/:histId — Delete a history entry ──────
indicadoresRouter.delete('/historico/:histId', authorize(['ADMIN', 'GESTOR']), async (req: AuthRequest, res) => {
  try {
    const histResult = await query('SELECT * FROM historico_indicadores WHERE id = $1', [req.params.histId]);
    const hist = histResult.rows[0];
    if (!hist) return res.status(404).json({ success: false, error: 'Registro não encontrado' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM historico_indicadores WHERE id = $1', [hist.id]);

      // Recalcula realizado do indicador
      const somaResult = await client.query(
        'SELECT COALESCE(SUM("valorCentavos"), 0) as total FROM historico_indicadores WHERE "indicadorId" = $1',
        [hist.indicadorId]
      );
      const totalRealizado = parseInt(somaResult.rows[0].total);
      const now = new Date().toISOString();
      await client.query(
        'UPDATE indicadores SET "realizadoCentavos" = $1, "atualizadoEm" = $2 WHERE id = $3',
        [totalRealizado, now, hist.indicadorId]
      );
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    await logAudit(req.user!.id, 'DELETE', 'HistoricoIndicador', hist.id, hist, null, req.ip, req.headers['user-agent']);
    res.json({ success: true, data: { id: hist.id } });
  } catch (err) {
    console.error('Erro ao excluir histórico:', err);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// ── DELETE /:id ───────────────────────────────────────────
indicadoresRouter.delete('/:id', authorize(['ADMIN', 'GESTOR']), async (req: AuthRequest, res) => {
  try {
    const result = await query('SELECT * FROM indicadores WHERE id = $1 AND "deletedAt" IS NULL', [req.params.id]);
    const indicador = result.rows[0];
    if (!indicador) return res.status(404).json({ success: false, error: 'Indicador não encontrado' });

    const now = new Date().toISOString();
    await query('UPDATE indicadores SET "deletedAt" = $1, "atualizadoEm" = $2 WHERE id = $3', [now, now, indicador.id]);

    await logAudit(req.user!.id, 'DELETE', 'Indicador', indicador.id, indicador, null, req.ip, req.headers['user-agent']);
    res.json({ success: true, data: { id: indicador.id } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});
