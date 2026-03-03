import { Router } from 'express';
import { query } from '../db.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import type { AuditLog } from '../types/index.js';

export const auditoriaRouter = Router();
auditoriaRouter.use(authenticate);

// ── GET / — List with pagination and filters ──────────────
auditoriaRouter.get('/', authorize(['ADMIN']), async (req: AuthRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const offset = (page - 1) * limit;
  const { userId, entidade, acao, dataInicio, dataFim } = req.query;

  let where = '1=1';
  const params: unknown[] = [];
  let idx = 1;

  if (userId) { where += ` AND a."userId" = $${idx++}`; params.push(userId); }
  if (entidade) { where += ` AND a.entidade = $${idx++}`; params.push(entidade); }
  if (acao) { where += ` AND a.acao = $${idx++}`; params.push(acao); }
  if (dataInicio) { where += ` AND a."timestamp" >= $${idx++}`; params.push(dataInicio); }
  if (dataFim) { where += ` AND a."timestamp" <= $${idx++}`; params.push(dataFim); }

  try {
    const totalResult = await query(`SELECT COUNT(*) as count FROM auditoria a WHERE ${where}`, params);
    const total = parseInt(totalResult.rows[0].count);

    const result = await query(`
      SELECT a.*, u.nome as "userName"
      FROM auditoria a
      LEFT JOIN users u ON u.id = a."userId"
      WHERE ${where}
      ORDER BY a."timestamp" DESC LIMIT $${idx++} OFFSET $${idx++}
    `, [...params, limit, offset]);

    res.json({
      success: true,
      data: result.rows,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('Erro ao listar auditoria:', err);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});
