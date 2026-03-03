import { Router } from 'express';
import { query, pool } from '../db.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createMetaSchema, updateMetaSchema } from '../schemas/index.js';
import { logAudit } from '../utils/audit.js';
import crypto from 'crypto';
import Decimal from 'decimal.js';
import type { Meta } from '../types/index.js';

export const metasRouter = Router();
metasRouter.use(authenticate);

// ── GET / — List with pagination ──────────────────────────
metasRouter.get('/', async (req: AuthRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const offset = (page - 1) * limit;
  const status = req.query.status as string;

  let where = '"deletedAt" IS NULL';
  const params: unknown[] = [];
  let paramIdx = 1;
  if (status) { where += ` AND status = $${paramIdx++}`; params.push(status); }

  try {
    const totalResult = await query(`SELECT COUNT(*) as count FROM metas WHERE ${where}`, params);
    const total = parseInt(totalResult.rows[0].count);

    const metasResult = await query(
      `SELECT * FROM metas WHERE ${where} ORDER BY "criadoEm" DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      [...params, limit, offset]
    );

    const parsed = metasResult.rows.map((m: any) => ({
      ...m,
      curvaPersonalizada: typeof m.curvaPersonalizada === 'string'
        ? JSON.parse(m.curvaPersonalizada)
        : m.curvaPersonalizada,
    }));

    res.json({
      success: true,
      data: parsed,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('Erro ao listar metas:', err);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// ── GET /:id ──────────────────────────────────────────────
metasRouter.get('/:id', async (req: AuthRequest, res) => {
  try {
    const result = await query('SELECT * FROM metas WHERE id = $1 AND "deletedAt" IS NULL', [req.params.id]);
    const meta = result.rows[0];
    if (!meta) return res.status(404).json({ success: false, error: 'Meta não encontrada' });

    res.json({
      success: true,
      data: {
        ...meta,
        curvaPersonalizada: typeof meta.curvaPersonalizada === 'string'
          ? JSON.parse(meta.curvaPersonalizada)
          : meta.curvaPersonalizada,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// ── POST / — Create ──────────────────────────────────────
metasRouter.post('/', authorize(['ADMIN']), validate(createMetaSchema), async (req: AuthRequest, res) => {
  const { nome, valorMeta, ano, periodoInicio, periodoFim, indicadorMacro, periodicidadeAtualizacao, tipoCurva, curvaPersonalizada } = req.body;

  const valorMetaCentavos = Math.round(valorMeta * 100);

  if (tipoCurva === 'PERSONALIZADA') {
    if (!curvaPersonalizada || curvaPersonalizada.length !== 12) {
      return res.status(400).json({ success: false, error: 'Curva personalizada deve conter 12 valores' });
    }
    const soma = curvaPersonalizada.reduce(
      (acc: Decimal, val: number) => acc.plus(new Decimal(val)),
      new Decimal(0)
    );
    if (!soma.equals(new Decimal(valorMeta))) {
      return res.status(400).json({ success: false, error: 'Soma da curva personalizada deve ser exatamente igual ao valor da meta' });
    }
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const curvaJson = tipoCurva === 'PERSONALIZADA' && curvaPersonalizada
    ? JSON.stringify(curvaPersonalizada.map((v: number) => Math.round(v * 100)))
    : null;

  try {
    await query(`
      INSERT INTO metas (id, nome, "valorMetaCentavos", ano, "periodoInicio", "periodoFim", "indicadorMacro", "periodicidadeAtualizacao", "tipoCurva", "curvaPersonalizada", status, "criadoPor", "criadoEm", "atualizadoEm")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `, [id, nome, valorMetaCentavos, ano, periodoInicio, periodoFim, indicadorMacro, periodicidadeAtualizacao, tipoCurva, curvaJson, 'ATIVA', req.user!.id, now, now]);

    await logAudit(req.user!.id, 'CREATE', 'Meta', id, null, req.body, req.ip, req.headers['user-agent']);

    res.json({ success: true, data: { id } });
  } catch (err) {
    console.error('Erro ao criar meta:', err);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// ── PUT /:id — Update ─────────────────────────────────────
metasRouter.put('/:id', authorize(['ADMIN']), validate(updateMetaSchema), async (req: AuthRequest, res) => {
  try {
    const result = await query('SELECT * FROM metas WHERE id = $1 AND "deletedAt" IS NULL', [req.params.id]);
    const meta = result.rows[0];
    if (!meta) return res.status(404).json({ success: false, error: 'Meta não encontrada' });

    const { nome, valorMeta, ano, periodoInicio, periodoFim, indicadorMacro, periodicidadeAtualizacao, tipoCurva, curvaPersonalizada, status } = req.body;

    const newValorCentavos = valorMeta !== undefined ? Math.round(valorMeta * 100) : meta.valorMetaCentavos;
    const newTipoCurva = tipoCurva || meta.tipoCurva;

    if (newTipoCurva === 'PERSONALIZADA' && curvaPersonalizada) {
      const soma = curvaPersonalizada.reduce(
        (acc: Decimal, val: number) => acc.plus(new Decimal(val)),
        new Decimal(0)
      );
      const metaVal = valorMeta !== undefined ? new Decimal(valorMeta) : new Decimal(meta.valorMetaCentavos).dividedBy(100);
      if (!soma.equals(metaVal)) {
        return res.status(400).json({ success: false, error: 'Soma da curva diverge do valor da meta' });
      }
    }

    const now = new Date().toISOString();
    const curvaJson = curvaPersonalizada
      ? JSON.stringify(curvaPersonalizada.map((v: number) => Math.round(v * 100)))
      : (newTipoCurva === 'LINEAR' ? null : meta.curvaPersonalizada);

    await query(`
      UPDATE metas SET nome = $1, "valorMetaCentavos" = $2, ano = $3, "periodoInicio" = $4, "periodoFim" = $5,
      "indicadorMacro" = $6, "periodicidadeAtualizacao" = $7, "tipoCurva" = $8, "curvaPersonalizada" = $9,
      status = $10, "atualizadoEm" = $11 WHERE id = $12
    `, [
      nome || meta.nome, newValorCentavos, ano || meta.ano,
      periodoInicio || meta.periodoInicio, periodoFim || meta.periodoFim,
      indicadorMacro || meta.indicadorMacro, periodicidadeAtualizacao || meta.periodicidadeAtualizacao,
      newTipoCurva, curvaJson, status || meta.status, now, meta.id,
    ]);

    await logAudit(req.user!.id, 'UPDATE', 'Meta', meta.id, meta, req.body, req.ip, req.headers['user-agent']);

    res.json({ success: true, data: { id: meta.id } });
  } catch (err) {
    console.error('Erro ao atualizar meta:', err);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// ── DELETE /:id — Soft delete ─────────────────────────────
metasRouter.delete('/:id', authorize(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const result = await query('SELECT * FROM metas WHERE id = $1 AND "deletedAt" IS NULL', [req.params.id]);
    const meta = result.rows[0];
    if (!meta) return res.status(404).json({ success: false, error: 'Meta não encontrada' });

    const projetosAtivos = await query(
      'SELECT COUNT(*) as count FROM projetos WHERE "metaId" = $1 AND "deletedAt" IS NULL AND status != $2',
      [meta.id, 'CANCELADO']
    );
    if (parseInt(projetosAtivos.rows[0].count) > 0) {
      return res.status(400).json({ success: false, error: `Não é possível excluir: ${projetosAtivos.rows[0].count} projeto(s) ativo(s) vinculado(s)` });
    }

    const now = new Date().toISOString();
    await query('UPDATE metas SET status = $1, "deletedAt" = $2, "atualizadoEm" = $3 WHERE id = $4', ['CANCELADA', now, now, meta.id]);

    await logAudit(req.user!.id, 'DELETE', 'Meta', meta.id, meta, null, req.ip, req.headers['user-agent']);

    res.json({ success: true, data: { id: meta.id } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});
