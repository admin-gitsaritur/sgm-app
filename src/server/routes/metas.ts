import { Router } from 'express';
import { db } from '../db.js';
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
metasRouter.get('/', (req: AuthRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const offset = (page - 1) * limit;
  const status = req.query.status as string;

  let where = 'deletedAt IS NULL';
  const params: unknown[] = [];
  if (status) { where += ' AND status = ?'; params.push(status); }

  const total = db.prepare(`SELECT COUNT(*) as count FROM metas WHERE ${where}`).get(...params) as { count: number };
  const metas = db.prepare(`SELECT * FROM metas WHERE ${where} ORDER BY criadoEm DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as Meta[];

  const parsed = metas.map(m => ({
    ...m,
    curvaPersonalizada: m.curvaPersonalizada ? JSON.parse(m.curvaPersonalizada) : null,
  }));

  res.json({
    success: true,
    data: parsed,
    meta: { page, limit, total: total.count, totalPages: Math.ceil(total.count / limit) },
  });
});

// ── GET /:id ──────────────────────────────────────────────
metasRouter.get('/:id', (req: AuthRequest, res) => {
  const meta = db.prepare('SELECT * FROM metas WHERE id = ? AND deletedAt IS NULL').get(req.params.id) as Meta | undefined;
  if (!meta) return res.status(404).json({ success: false, error: 'Meta não encontrada' });

  res.json({
    success: true,
    data: { ...meta, curvaPersonalizada: meta.curvaPersonalizada ? JSON.parse(meta.curvaPersonalizada) : null },
  });
});

// ── POST / — Create ──────────────────────────────────────
metasRouter.post('/', authorize(['ADMIN']), validate(createMetaSchema), (req: AuthRequest, res) => {
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

  db.prepare(`
    INSERT INTO metas (id, nome, valorMetaCentavos, ano, periodoInicio, periodoFim, indicadorMacro, periodicidadeAtualizacao, tipoCurva, curvaPersonalizada, status, criadoPor, criadoEm, atualizadoEm)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, nome, valorMetaCentavos, ano, periodoInicio, periodoFim, indicadorMacro, periodicidadeAtualizacao, tipoCurva, curvaJson, 'ATIVA', req.user!.id, now, now);

  logAudit(req.user!.id, 'CREATE', 'Meta', id, null, req.body, req.ip, req.headers['user-agent']);

  res.json({ success: true, data: { id } });
});

// ── PUT /:id — Update ─────────────────────────────────────
metasRouter.put('/:id', authorize(['ADMIN']), validate(updateMetaSchema), (req: AuthRequest, res) => {
  const meta = db.prepare('SELECT * FROM metas WHERE id = ? AND deletedAt IS NULL').get(req.params.id) as Meta | undefined;
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

  db.prepare(`
    UPDATE metas SET nome = ?, valorMetaCentavos = ?, ano = ?, periodoInicio = ?, periodoFim = ?,
    indicadorMacro = ?, periodicidadeAtualizacao = ?, tipoCurva = ?, curvaPersonalizada = ?,
    status = ?, atualizadoEm = ? WHERE id = ?
  `).run(
    nome || meta.nome, newValorCentavos, ano || meta.ano,
    periodoInicio || meta.periodoInicio, periodoFim || meta.periodoFim,
    indicadorMacro || meta.indicadorMacro, periodicidadeAtualizacao || meta.periodicidadeAtualizacao,
    newTipoCurva, curvaJson, status || meta.status, now, meta.id
  );

  logAudit(req.user!.id, 'UPDATE', 'Meta', meta.id, meta, req.body, req.ip, req.headers['user-agent']);

  res.json({ success: true, data: { id: meta.id } });
});

// ── DELETE /:id — Soft delete ─────────────────────────────
metasRouter.delete('/:id', authorize(['ADMIN']), (req: AuthRequest, res) => {
  const meta = db.prepare('SELECT * FROM metas WHERE id = ? AND deletedAt IS NULL').get(req.params.id) as Meta | undefined;
  if (!meta) return res.status(404).json({ success: false, error: 'Meta não encontrada' });

  const projetosAtivos = db.prepare('SELECT COUNT(*) as count FROM projetos WHERE metaId = ? AND deletedAt IS NULL AND status != ?').get(meta.id, 'CANCELADO') as { count: number };
  if (projetosAtivos.count > 0) {
    return res.status(400).json({ success: false, error: `Não é possível excluir: ${projetosAtivos.count} projeto(s) ativo(s) vinculado(s)` });
  }

  const now = new Date().toISOString();
  db.prepare('UPDATE metas SET status = ?, deletedAt = ?, atualizadoEm = ? WHERE id = ?')
    .run('CANCELADA', now, now, meta.id);

  logAudit(req.user!.id, 'DELETE', 'Meta', meta.id, meta, null, req.ip, req.headers['user-agent']);

  res.json({ success: true, data: { id: meta.id } });
});
