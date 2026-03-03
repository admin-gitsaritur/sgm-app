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

  let where = 'i."deletedAt" IS NULL';
  const params: unknown[] = [];
  let idx = 1;
  if (projetoId) { where += ` AND i."projetoId" = $${idx++}`; params.push(projetoId); }
  if (metaId) { where += ` AND p."metaId" = $${idx++}`; params.push(metaId); }

  try {
    const totalResult = await query(
      `SELECT COUNT(*) as count FROM indicadores i LEFT JOIN projetos p ON p.id = i."projetoId" WHERE ${where}`,
      params
    );
    const total = parseInt(totalResult.rows[0].count);

    const result = await query(`
      SELECT i.*, p.nome as "projetoNome", m.nome as "metaNome"
      FROM indicadores i
      LEFT JOIN projetos p ON p.id = i."projetoId"
      LEFT JOIN metas m ON m.id = p."metaId"
      WHERE ${where} ORDER BY i."criadoEm" DESC LIMIT $${idx++} OFFSET $${idx++}
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
    const result = await query('SELECT * FROM indicadores WHERE id = $1 AND "deletedAt" IS NULL', [req.params.id]);
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
  const { projetoId, nome, metaIndicador, unidade, peso, frequenciaAtualizacao, responsavel } = req.body;

  try {
    const projetoResult = await query('SELECT * FROM projetos WHERE id = $1 AND "deletedAt" IS NULL', [projetoId]);
    if (projetoResult.rows.length === 0) return res.status(404).json({ success: false, error: 'Projeto não encontrado' });

    const pesosResult = await query('SELECT peso FROM indicadores WHERE "projetoId" = $1 AND "deletedAt" IS NULL', [projetoId]);
    let somaPesos = new Decimal(peso);
    for (const i of pesosResult.rows) somaPesos = somaPesos.plus(i.peso);

    if (somaPesos.greaterThan(1)) {
      return res.status(400).json({ success: false, error: `Soma dos pesos excede 1.0 (seria ${somaPesos.toFixed(2)})` });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const metaIndicadorCentavos = Math.round(metaIndicador * 100);

    await query(`
      INSERT INTO indicadores (id, "projetoId", nome, "metaIndicadorCentavos", "realizadoCentavos", unidade, peso, "frequenciaAtualizacao", responsavel, "dataUltimaAtualizacao", "statusAtualizacao", "criadoEm", "atualizadoEm")
      VALUES ($1, $2, $3, $4, 0, $5, $6, $7, $8, $9, 'PENDENTE', $10, $11)
    `, [id, projetoId, nome, metaIndicadorCentavos, unidade, peso, frequenciaAtualizacao, responsavel, now, now, now]);

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

    const { nome, metaIndicador, unidade, peso, frequenciaAtualizacao, responsavel } = req.body;
    const now = new Date().toISOString();

    if (peso !== undefined && peso !== indicador.peso) {
      const outrosResult = await query(
        'SELECT peso FROM indicadores WHERE "projetoId" = $1 AND id != $2 AND "deletedAt" IS NULL',
        [indicador.projetoId, indicador.id]
      );
      let soma = new Decimal(peso);
      for (const i of outrosResult.rows) soma = soma.plus(i.peso);
      if (soma.greaterThan(1)) {
        return res.status(400).json({ success: false, error: `Soma dos pesos excederia 1.0 (${soma.toFixed(2)})` });
      }
    }

    const metaCentavos = metaIndicador !== undefined ? Math.round(metaIndicador * 100) : indicador.metaIndicadorCentavos;

    await query(`
      UPDATE indicadores SET nome = $1, "metaIndicadorCentavos" = $2, unidade = $3, peso = $4,
      "frequenciaAtualizacao" = $5, responsavel = $6, "atualizadoEm" = $7 WHERE id = $8
    `, [
      nome || indicador.nome, metaCentavos, unidade || indicador.unidade,
      peso ?? indicador.peso, frequenciaAtualizacao || indicador.frequenciaAtualizacao,
      responsavel || indicador.responsavel, now, indicador.id,
    ]);

    await logAudit(req.user!.id, 'UPDATE', 'Indicador', indicador.id, indicador, req.body, req.ip, req.headers['user-agent']);
    res.json({ success: true, data: { id: indicador.id } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// ── POST /:id/atualizar — Update realizado ────────────────
indicadoresRouter.post('/:id/atualizar', authorize(['ADMIN', 'GESTOR', 'OPERADOR']), validate(updateRealizadoSchema), async (req: AuthRequest, res) => {
  const { realizado } = req.body;

  try {
    const result = await query('SELECT * FROM indicadores WHERE id = $1 AND "deletedAt" IS NULL', [req.params.id]);
    const indicador = result.rows[0];
    if (!indicador) return res.status(404).json({ success: false, error: 'Indicador não encontrado' });

    if (req.user!.role === 'OPERADOR' && indicador.responsavel !== req.user!.id) {
      return res.status(403).json({ success: false, error: 'Acesso negado' });
    }

    const realizadoCentavos = Math.round(realizado * 100);
    const now = new Date().toISOString();

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`
        INSERT INTO historico_indicadores (id, "indicadorId", data, "valorCentavos", "atualizadoPor")
        VALUES ($1, $2, $3, $4, $5)
      `, [crypto.randomUUID(), indicador.id, now, realizadoCentavos, req.user!.id]);

      await client.query(`
        UPDATE indicadores SET "realizadoCentavos" = $1, "dataUltimaAtualizacao" = $2, "statusAtualizacao" = 'ATUALIZADO', "atualizadoEm" = $3
        WHERE id = $4
      `, [realizadoCentavos, now, now, indicador.id]);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    await logAudit(req.user!.id, 'UPDATE', 'Indicador', indicador.id, { realizado: indicador.realizadoCentavos }, { realizado: realizadoCentavos }, req.ip, req.headers['user-agent']);
    res.json({ success: true, data: { id: indicador.id } });
  } catch (err) {
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
