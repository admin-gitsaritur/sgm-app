import { Router } from 'express';
import { db } from '../db.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createProjetoSchema, updateProjetoSchema } from '../schemas/index.js';
import { logAudit } from '../utils/audit.js';
import crypto from 'crypto';
import Decimal from 'decimal.js';
import type { Projeto, Meta } from '../types/index.js';

export const projetosRouter = Router();
projetosRouter.use(authenticate);

function recalcularPesos(metaId: string) {
  const projetos = db.prepare(
    'SELECT id, contribuicaoEsperadaCentavos FROM projetos WHERE metaId = ? AND deletedAt IS NULL AND status != ?'
  ).all(metaId, 'CANCELADO') as { id: string; contribuicaoEsperadaCentavos: number }[];

  const somaTotal = projetos.reduce((acc, p) => acc.plus(p.contribuicaoEsperadaCentavos), new Decimal(0));

  if (somaTotal.isZero()) return;

  const now = new Date().toISOString();
  const stmt = db.prepare('UPDATE projetos SET pesoAutomatico = ?, atualizadoEm = ? WHERE id = ?');

  for (const p of projetos) {
    const peso = new Decimal(p.contribuicaoEsperadaCentavos).dividedBy(somaTotal).toNumber();
    stmt.run(peso, now, p.id);
  }
}

// ── GET / — List with pagination ──────────────────────────
projetosRouter.get('/', (req: AuthRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const offset = (page - 1) * limit;
  const metaId = req.query.metaId as string;

  let where = 'p.deletedAt IS NULL';
  const params: unknown[] = [];
  if (metaId) { where += ' AND p.metaId = ?'; params.push(metaId); }

  const total = db.prepare(`SELECT COUNT(*) as count FROM projetos p WHERE ${where}`).get(...params) as { count: number };
  const projetos = db.prepare(`
    SELECT p.*, m.nome as metaNome FROM projetos p
    LEFT JOIN metas m ON m.id = p.metaId
    WHERE ${where} ORDER BY p.criadoEm DESC LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as (Projeto & { metaNome: string })[];

  const parsed = projetos.map(p => ({
    ...p,
    responsaveis: JSON.parse(p.responsaveis),
  }));

  res.json({
    success: true,
    data: parsed,
    meta: { page, limit, total: total.count, totalPages: Math.ceil(total.count / limit) },
  });
});

// ── GET /:id ──────────────────────────────────────────────
projetosRouter.get('/:id', (req: AuthRequest, res) => {
  const projeto = db.prepare('SELECT * FROM projetos WHERE id = ? AND deletedAt IS NULL').get(req.params.id) as Projeto | undefined;
  if (!projeto) return res.status(404).json({ success: false, error: 'Projeto não encontrado' });

  res.json({ success: true, data: { ...projeto, responsaveis: JSON.parse(projeto.responsaveis) } });
});

// ── POST / — Create ──────────────────────────────────────
projetosRouter.post('/', authorize(['ADMIN', 'GESTOR']), validate(createProjetoSchema), (req: AuthRequest, res) => {
  const { metaId, nome, contribuicaoEsperada, prazoInicio, prazoFim, responsavelPrincipal, responsaveis } = req.body;

  const meta = db.prepare('SELECT * FROM metas WHERE id = ? AND deletedAt IS NULL').get(metaId) as Meta | undefined;
  if (!meta) return res.status(404).json({ success: false, error: 'Meta não encontrada' });

  const contribuicaoCentavos = Math.round(contribuicaoEsperada * 100);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.transaction(() => {
    db.prepare(`
      INSERT INTO projetos (id, metaId, nome, contribuicaoEsperadaCentavos, pesoAutomatico, prazoInicio, prazoFim, responsavelPrincipal, responsaveis, status, criadoPor, criadoEm, atualizadoEm)
      VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, metaId, nome, contribuicaoCentavos, prazoInicio, prazoFim, responsavelPrincipal, JSON.stringify(responsaveis), 'NAO_INICIADO', req.user!.id, now, now);

    recalcularPesos(metaId);
  })();

  logAudit(req.user!.id, 'CREATE', 'Projeto', id, null, req.body, req.ip, req.headers['user-agent']);

  res.json({ success: true, data: { id } });
});

// ── PUT /:id — Update ─────────────────────────────────────
projetosRouter.put('/:id', authorize(['ADMIN', 'GESTOR']), validate(updateProjetoSchema), (req: AuthRequest, res) => {
  const projeto = db.prepare('SELECT * FROM projetos WHERE id = ? AND deletedAt IS NULL').get(req.params.id) as Projeto | undefined;
  if (!projeto) return res.status(404).json({ success: false, error: 'Projeto não encontrado' });

  const { nome, contribuicaoEsperada, prazoInicio, prazoFim, responsavelPrincipal, responsaveis, status } = req.body;
  const now = new Date().toISOString();
  const contribuicaoCentavos = contribuicaoEsperada !== undefined ? Math.round(contribuicaoEsperada * 100) : projeto.contribuicaoEsperadaCentavos;

  db.transaction(() => {
    db.prepare(`
      UPDATE projetos SET nome = ?, contribuicaoEsperadaCentavos = ?, prazoInicio = ?, prazoFim = ?,
      responsavelPrincipal = ?, responsaveis = ?, status = ?, atualizadoEm = ? WHERE id = ?
    `).run(
      nome || projeto.nome, contribuicaoCentavos,
      prazoInicio || projeto.prazoInicio, prazoFim || projeto.prazoFim,
      responsavelPrincipal || projeto.responsavelPrincipal,
      responsaveis ? JSON.stringify(responsaveis) : projeto.responsaveis,
      status || projeto.status, now, projeto.id
    );

    if (contribuicaoEsperada !== undefined) {
      recalcularPesos(projeto.metaId);
    }
  })();

  logAudit(req.user!.id, 'UPDATE', 'Projeto', projeto.id, projeto, req.body, req.ip, req.headers['user-agent']);

  res.json({ success: true, data: { id: projeto.id } });
});

// ── DELETE /:id — Soft delete ─────────────────────────────
projetosRouter.delete('/:id', authorize(['ADMIN', 'GESTOR']), (req: AuthRequest, res) => {
  const projeto = db.prepare('SELECT * FROM projetos WHERE id = ? AND deletedAt IS NULL').get(req.params.id) as Projeto | undefined;
  if (!projeto) return res.status(404).json({ success: false, error: 'Projeto não encontrado' });

  const indicadoresAtivos = db.prepare('SELECT COUNT(*) as count FROM indicadores WHERE projetoId = ? AND deletedAt IS NULL').get(projeto.id) as { count: number };

  const now = new Date().toISOString();
  db.transaction(() => {
    db.prepare('UPDATE projetos SET status = ?, deletedAt = ?, atualizadoEm = ? WHERE id = ?')
      .run('CANCELADO', now, now, projeto.id);

    // Soft delete child indicadores
    if (indicadoresAtivos.count > 0) {
      db.prepare('UPDATE indicadores SET deletedAt = ?, atualizadoEm = ? WHERE projetoId = ? AND deletedAt IS NULL')
        .run(now, now, projeto.id);
    }

    recalcularPesos(projeto.metaId);
  })();

  logAudit(req.user!.id, 'DELETE', 'Projeto', projeto.id, projeto, null, req.ip, req.headers['user-agent']);

  res.json({ success: true, data: { id: projeto.id } });
});
