import { Router } from 'express';
import { db } from '../db.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import type { AuditLog } from '../types/index.js';

export const auditoriaRouter = Router();
auditoriaRouter.use(authenticate);

// ── GET / — List with pagination and filters ──────────────
auditoriaRouter.get('/', authorize(['ADMIN']), (req: AuthRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const offset = (page - 1) * limit;
  const { userId, entidade, acao, dataInicio, dataFim } = req.query;

  let where = '1=1';
  const params: unknown[] = [];

  if (userId) { where += ' AND a.userId = ?'; params.push(userId); }
  if (entidade) { where += ' AND a.entidade = ?'; params.push(entidade); }
  if (acao) { where += ' AND a.acao = ?'; params.push(acao); }
  if (dataInicio) { where += ' AND a.timestamp >= ?'; params.push(dataInicio); }
  if (dataFim) { where += ' AND a.timestamp <= ?'; params.push(dataFim); }

  const total = db.prepare(`SELECT COUNT(*) as count FROM auditoria a WHERE ${where}`).get(...params) as { count: number };

  const logs = db.prepare(`
    SELECT a.*, u.nome as userName
    FROM auditoria a
    LEFT JOIN users u ON u.id = a.userId
    WHERE ${where}
    ORDER BY a.timestamp DESC LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as (AuditLog & { userName: string })[];

  const parsed = logs.map(l => ({
    ...l,
    dadosAnteriores: l.dadosAnteriores ? JSON.parse(l.dadosAnteriores) : null,
    dadosNovos: l.dadosNovos ? JSON.parse(l.dadosNovos) : null,
  }));

  res.json({
    success: true,
    data: parsed,
    meta: { page, limit, total: total.count, totalPages: Math.ceil(total.count / limit) },
  });
});
