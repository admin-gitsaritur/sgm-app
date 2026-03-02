import { Router } from 'express';
import { db } from '../db.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createIndicadorSchema, updateIndicadorSchema, updateRealizadoSchema } from '../schemas/index.js';
import { logAudit } from '../utils/audit.js';
import crypto from 'crypto';
import Decimal from 'decimal.js';
import type { Indicador, Projeto, HistoricoIndicador } from '../types/index.js';

export const indicadoresRouter = Router();
indicadoresRouter.use(authenticate);

// ── GET / — List with pagination ──────────────────────────
indicadoresRouter.get('/', (req: AuthRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const offset = (page - 1) * limit;
  const projetoId = req.query.projetoId as string;
  const metaId = req.query.metaId as string;

  let where = 'i.deletedAt IS NULL';
  const params: unknown[] = [];
  if (projetoId) { where += ' AND i.projetoId = ?'; params.push(projetoId); }
  if (metaId) { where += ' AND p.metaId = ?'; params.push(metaId); }

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM indicadores i LEFT JOIN projetos p ON p.id = i.projetoId WHERE ${where}
  `).get(...params) as { count: number };

  const indicadores = db.prepare(`
    SELECT i.*, p.nome as projetoNome, m.nome as metaNome
    FROM indicadores i
    LEFT JOIN projetos p ON p.id = i.projetoId
    LEFT JOIN metas m ON m.id = p.metaId
    WHERE ${where} ORDER BY i.criadoEm DESC LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  res.json({
    success: true,
    data: indicadores,
    meta: { page, limit, total: total.count, totalPages: Math.ceil(total.count / limit) },
  });
});

// ── GET /:id ──────────────────────────────────────────────
indicadoresRouter.get('/:id', (req: AuthRequest, res) => {
  const indicador = db.prepare('SELECT * FROM indicadores WHERE id = ? AND deletedAt IS NULL').get(req.params.id) as Indicador | undefined;
  if (!indicador) return res.status(404).json({ success: false, error: 'Indicador não encontrado' });

  const historico = db.prepare(
    'SELECT * FROM historico_indicadores WHERE indicadorId = ? ORDER BY data DESC'
  ).all(indicador.id) as HistoricoIndicador[];

  res.json({ success: true, data: { ...indicador, historico } });
});

// ── POST / — Create ──────────────────────────────────────
indicadoresRouter.post('/', authorize(['ADMIN', 'GESTOR']), validate(createIndicadorSchema), (req: AuthRequest, res) => {
  const { projetoId, nome, metaIndicador, unidade, peso, frequenciaAtualizacao, responsavel } = req.body;

  const projeto = db.prepare('SELECT * FROM projetos WHERE id = ? AND deletedAt IS NULL').get(projetoId) as Projeto | undefined;
  if (!projeto) return res.status(404).json({ success: false, error: 'Projeto não encontrado' });

  // Validate weight sum
  const indicadoresDoProjeto = db.prepare('SELECT peso FROM indicadores WHERE projetoId = ? AND deletedAt IS NULL').all(projetoId) as { peso: number }[];
  let somaPesos = new Decimal(peso);
  for (const i of indicadoresDoProjeto) {
    somaPesos = somaPesos.plus(i.peso);
  }

  if (somaPesos.greaterThan(1)) {
    return res.status(400).json({ success: false, error: `Soma dos pesos excede 1.0 (seria ${somaPesos.toFixed(2)})` });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const metaIndicadorCentavos = Math.round(metaIndicador * 100);

  db.prepare(`
    INSERT INTO indicadores (id, projetoId, nome, metaIndicadorCentavos, realizadoCentavos, unidade, peso, frequenciaAtualizacao, responsavel, dataUltimaAtualizacao, statusAtualizacao, criadoEm, atualizadoEm)
    VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, 'PENDENTE', ?, ?)
  `).run(id, projetoId, nome, metaIndicadorCentavos, unidade, peso, frequenciaAtualizacao, responsavel, now, now, now);

  logAudit(req.user!.id, 'CREATE', 'Indicador', id, null, req.body, req.ip, req.headers['user-agent']);

  res.json({ success: true, data: { id } });
});

// ── PUT /:id — Update ─────────────────────────────────────
indicadoresRouter.put('/:id', authorize(['ADMIN', 'GESTOR']), validate(updateIndicadorSchema), (req: AuthRequest, res) => {
  const indicador = db.prepare('SELECT * FROM indicadores WHERE id = ? AND deletedAt IS NULL').get(req.params.id) as Indicador | undefined;
  if (!indicador) return res.status(404).json({ success: false, error: 'Indicador não encontrado' });

  const { nome, metaIndicador, unidade, peso, frequenciaAtualizacao, responsavel } = req.body;
  const now = new Date().toISOString();

  // Validate weight if changed
  if (peso !== undefined && peso !== indicador.peso) {
    const outros = db.prepare('SELECT peso FROM indicadores WHERE projetoId = ? AND id != ? AND deletedAt IS NULL').all(indicador.projetoId, indicador.id) as { peso: number }[];
    let soma = new Decimal(peso);
    for (const i of outros) soma = soma.plus(i.peso);
    if (soma.greaterThan(1)) {
      return res.status(400).json({ success: false, error: `Soma dos pesos excederia 1.0 (${soma.toFixed(2)})` });
    }
  }

  const metaCentavos = metaIndicador !== undefined ? Math.round(metaIndicador * 100) : indicador.metaIndicadorCentavos;

  db.prepare(`
    UPDATE indicadores SET nome = ?, metaIndicadorCentavos = ?, unidade = ?, peso = ?,
    frequenciaAtualizacao = ?, responsavel = ?, atualizadoEm = ? WHERE id = ?
  `).run(
    nome || indicador.nome, metaCentavos, unidade || indicador.unidade,
    peso ?? indicador.peso, frequenciaAtualizacao || indicador.frequenciaAtualizacao,
    responsavel || indicador.responsavel, now, indicador.id
  );

  logAudit(req.user!.id, 'UPDATE', 'Indicador', indicador.id, indicador, req.body, req.ip, req.headers['user-agent']);

  res.json({ success: true, data: { id: indicador.id } });
});

// ── POST /:id/atualizar — Update realizado ────────────────
indicadoresRouter.post('/:id/atualizar', authorize(['ADMIN', 'GESTOR', 'OPERADOR']), validate(updateRealizadoSchema), (req: AuthRequest, res) => {
  const { realizado } = req.body;
  const indicador = db.prepare('SELECT * FROM indicadores WHERE id = ? AND deletedAt IS NULL').get(req.params.id) as Indicador | undefined;
  if (!indicador) return res.status(404).json({ success: false, error: 'Indicador não encontrado' });

  if (req.user!.role === 'OPERADOR' && indicador.responsavel !== req.user!.id) {
    return res.status(403).json({ success: false, error: 'Acesso negado' });
  }

  const realizadoCentavos = Math.round(realizado * 100);
  const now = new Date().toISOString();

  db.transaction(() => {
    // Insert history record
    db.prepare(`
      INSERT INTO historico_indicadores (id, indicadorId, data, valorCentavos, atualizadoPor)
      VALUES (?, ?, ?, ?, ?)
    `).run(crypto.randomUUID(), indicador.id, now, realizadoCentavos, req.user!.id);

    // Update current value
    db.prepare(`
      UPDATE indicadores SET realizadoCentavos = ?, dataUltimaAtualizacao = ?, statusAtualizacao = 'ATUALIZADO', atualizadoEm = ?
      WHERE id = ?
    `).run(realizadoCentavos, now, now, indicador.id);
  })();

  logAudit(req.user!.id, 'UPDATE', 'Indicador', indicador.id, { realizado: indicador.realizadoCentavos }, { realizado: realizadoCentavos }, req.ip, req.headers['user-agent']);

  res.json({ success: true, data: { id: indicador.id } });
});

// ── DELETE /:id — Soft delete ─────────────────────────────
indicadoresRouter.delete('/:id', authorize(['ADMIN', 'GESTOR']), (req: AuthRequest, res) => {
  const indicador = db.prepare('SELECT * FROM indicadores WHERE id = ? AND deletedAt IS NULL').get(req.params.id) as Indicador | undefined;
  if (!indicador) return res.status(404).json({ success: false, error: 'Indicador não encontrado' });

  const now = new Date().toISOString();
  db.prepare('UPDATE indicadores SET deletedAt = ?, atualizadoEm = ? WHERE id = ?')
    .run(now, now, indicador.id);

  logAudit(req.user!.id, 'DELETE', 'Indicador', indicador.id, indicador, null, req.ip, req.headers['user-agent']);

  res.json({ success: true, data: { id: indicador.id } });
});
