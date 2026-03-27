import { Router } from 'express';
import { query, pool } from '../db.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createProjetoSchema, updateProjetoSchema } from '../schemas/index.js';
import { logAudit } from '../utils/audit.js';
import crypto from 'crypto';
import Decimal from 'decimal.js';
import type { Projeto, Meta } from '../types/index.js';

export const projetosRouter = Router();
projetosRouter.use(authenticate);

async function recalcularPesos(metaId: string | null) {
  if (!metaId) return;
  const result = await query(
    'SELECT id, "contribuicaoEsperadaCentavos" FROM projetos WHERE "metaId" = $1 AND "deletedAt" IS NULL AND status != $2',
    [metaId, 'CANCELADO']
  );
  const projetos = result.rows;
  const somaTotal = projetos.reduce((acc: Decimal, p: any) => acc.plus(p.contribuicaoEsperadaCentavos), new Decimal(0));
  if (somaTotal.isZero()) return;

  const now = new Date().toISOString();
  for (const p of projetos) {
    const peso = new Decimal(p.contribuicaoEsperadaCentavos).dividedBy(somaTotal).toNumber();
    await query('UPDATE projetos SET "pesoAutomatico" = $1, "atualizadoEm" = $2 WHERE id = $3', [peso, now, p.id]);
  }
}

// ── GET / ─────────────────────────────────────────────────
projetosRouter.get('/', async (req: AuthRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const offset = (page - 1) * limit;
  const metaId = req.query.metaId as string;
  const avulsos = req.query.avulsos as string;

  let where = 'p."deletedAt" IS NULL';
  const params: unknown[] = [];
  let idx = 1;

  if (avulsos === 'true') {
    where += ` AND p."metaId" IS NULL`;
  } else if (metaId) { 
    where += ` AND p."metaId" = $${idx++}`; params.push(metaId); 
  }

  try {
    const totalResult = await query(`SELECT COUNT(*) as count FROM projetos p WHERE ${where}`, params);
    const total = parseInt(totalResult.rows[0].count);

    const result = await query(`
      SELECT p.*, m.nome as "metaNome" FROM projetos p
      LEFT JOIN metas m ON m.id = p."metaId"
      WHERE ${where} ORDER BY p."criadoEm" DESC LIMIT $${idx++} OFFSET $${idx++}
    `, [...params, limit, offset]);

    res.json({
      success: true,
      data: result.rows,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('Erro ao listar projetos:', err);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// ── GET /:id ──────────────────────────────────────────────
projetosRouter.get('/:id', async (req: AuthRequest, res) => {
  try {
    const result = await query('SELECT * FROM projetos WHERE id = $1 AND "deletedAt" IS NULL', [req.params.id]);
    const projeto = result.rows[0];
    if (!projeto) return res.status(404).json({ success: false, error: 'Projeto não encontrado' });
    res.json({ success: true, data: projeto });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// ── POST / — Create ──────────────────────────────────────
projetosRouter.post('/', authorize(['ADMIN', 'GESTOR']), validate(createProjetoSchema), async (req: AuthRequest, res) => {
  const { metaId, nome, contribuicaoEsperada, prazoInicio, prazoFim, responsavelPrincipal, responsaveis } = req.body;

  try {
    let meta = null;
    if (metaId) {
      const metaResult = await query('SELECT * FROM metas WHERE id = $1 AND "deletedAt" IS NULL', [metaId]);
      if (metaResult.rows.length === 0) return res.status(404).json({ success: false, error: 'Meta não encontrada' });
      meta = metaResult.rows[0] as Meta;
    }

    const contribuicaoCentavos = Math.round(contribuicaoEsperada * 100);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Se prazo não foi informado, usa o da meta (se existir)
    const pInicio = prazoInicio || (meta ? meta.periodoInicio : null);
    const pFim = prazoFim || (meta ? meta.periodoFim : null);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`
        INSERT INTO projetos (id, "metaId", nome, "contribuicaoEsperadaCentavos", "pesoAutomatico", "prazoInicio", "prazoFim", "responsavelPrincipal", responsaveis, status, "criadoPor", "criadoEm", "atualizadoEm")
        VALUES ($1, $2, $3, $4, 0, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [id, metaId || null, nome, contribuicaoCentavos, pInicio, pFim, responsavelPrincipal || null, JSON.stringify(responsaveis || []), 'NAO_INICIADO', req.user!.id, now, now]);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
    await recalcularPesos(metaId);
    await logAudit(req.user!.id, 'CREATE', 'Projeto', id, null, req.body, req.ip, req.headers['user-agent']);

    res.json({ success: true, data: { id } });
  } catch (err) {
    console.error('Erro ao criar projeto:', err);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// ── PUT /:id — Update ─────────────────────────────────────
projetosRouter.put('/:id', authorize(['ADMIN', 'GESTOR']), validate(updateProjetoSchema), async (req: AuthRequest, res) => {
  try {
    const result = await query('SELECT * FROM projetos WHERE id = $1 AND "deletedAt" IS NULL', [req.params.id]);
    const projeto = result.rows[0];
    if (!projeto) return res.status(404).json({ success: false, error: 'Projeto não encontrado' });

    const metaIdAtual = projeto.metaId;
    const { metaId, nome, contribuicaoEsperada, prazoInicio, prazoFim, responsavelPrincipal, responsaveis, status } = req.body;
    const now = new Date().toISOString();
    const contribuicaoCentavos = contribuicaoEsperada !== undefined ? Math.round(contribuicaoEsperada * 100) : projeto.contribuicaoEsperadaCentavos;
    const novoMetaId = metaId !== undefined ? (metaId || null) : projeto.metaId;

    await query(`
      UPDATE projetos SET "metaId" = $1, nome = $2, "contribuicaoEsperadaCentavos" = $3, "prazoInicio" = $4, "prazoFim" = $5,
      "responsavelPrincipal" = $6, responsaveis = $7, status = $8, "atualizadoEm" = $9 WHERE id = $10
    `, [
      novoMetaId, nome || projeto.nome, contribuicaoCentavos,
      prazoInicio !== undefined ? prazoInicio : projeto.prazoInicio,
      prazoFim !== undefined ? prazoFim : projeto.prazoFim,
      responsavelPrincipal !== undefined ? responsavelPrincipal : projeto.responsavelPrincipal,
      responsaveis ? JSON.stringify(responsaveis) : projeto.responsaveis,
      status || projeto.status, now, projeto.id,
    ]);

    if (metaIdAtual !== novoMetaId || contribuicaoEsperada !== undefined) {
      if (metaIdAtual) await recalcularPesos(metaIdAtual);
      if (novoMetaId && novoMetaId !== metaIdAtual) await recalcularPesos(novoMetaId);
    }

    await logAudit(req.user!.id, 'UPDATE', 'Projeto', projeto.id, projeto, req.body, req.ip, req.headers['user-agent']);
    res.json({ success: true, data: { id: projeto.id } });
  } catch (err) {
    console.error('Erro ao atualizar projeto:', err);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// ── DELETE /:id — Soft delete ─────────────────────────────
projetosRouter.delete('/:id', authorize(['ADMIN', 'GESTOR']), async (req: AuthRequest, res) => {
  try {
    const result = await query('SELECT * FROM projetos WHERE id = $1 AND "deletedAt" IS NULL', [req.params.id]);
    const projeto = result.rows[0];
    if (!projeto) return res.status(404).json({ success: false, error: 'Projeto não encontrado' });

    const now = new Date().toISOString();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE projetos SET status = $1, "deletedAt" = $2, "atualizadoEm" = $3 WHERE id = $4', ['CANCELADO', now, now, projeto.id]);
      await client.query('UPDATE indicadores SET "deletedAt" = $1, "atualizadoEm" = $2 WHERE "projetoId" = $3 AND "deletedAt" IS NULL', [now, now, projeto.id]);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    await recalcularPesos(projeto.metaId);
    await logAudit(req.user!.id, 'DELETE', 'Projeto', projeto.id, projeto, null, req.ip, req.headers['user-agent']);

    res.json({ success: true, data: { id: projeto.id } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});
