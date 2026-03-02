import { Router } from 'express';
import { db } from '../db.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createUsuarioSchema, updateUsuarioSchema, gerarSenhaTemporaria } from '../schemas/index.js';
import { logAudit } from '../utils/audit.js';
import { config } from '../config.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import type { User } from '../types/index.js';

export const usuariosRouter = Router();
usuariosRouter.use(authenticate);

// ── GET / — List with pagination ──────────────────────────
usuariosRouter.get('/', authorize(['ADMIN']), (req: AuthRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const offset = (page - 1) * limit;
  const role = req.query.role as string;
  const departamento = req.query.departamento as string;
  const ativo = req.query.ativo as string;
  const busca = req.query.busca as string;

  let where = 'deletedAt IS NULL';
  const params: unknown[] = [];
  if (role) { where += ' AND role = ?'; params.push(role); }
  if (departamento) { where += ' AND departamento = ?'; params.push(departamento); }
  if (ativo !== undefined && ativo !== '') { where += ' AND ativo = ?'; params.push(parseInt(ativo)); }
  if (busca) { where += ' AND (nome LIKE ? OR email LIKE ?)'; params.push(`%${busca}%`, `%${busca}%`); }

  const total = db.prepare(`SELECT COUNT(*) as count FROM users WHERE ${where}`).get(...params) as { count: number };
  const usuarios = db.prepare(`
    SELECT id, nome, email, role, ativo, ultimoLogin, criadoEm, departamento, cargo, deveTrocarSenha
    FROM users WHERE ${where} ORDER BY criadoEm DESC LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  res.json({
    success: true,
    data: usuarios,
    meta: { page, limit, total: total.count, totalPages: Math.ceil(total.count / limit) },
  });
});

// ── GET /:id ──────────────────────────────────────────────
usuariosRouter.get('/:id', authorize(['ADMIN']), (req: AuthRequest, res) => {
  const usuario = db.prepare(
    'SELECT id, nome, email, role, ativo, ultimoLogin, criadoEm, departamento, cargo FROM users WHERE id = ? AND deletedAt IS NULL'
  ).get(req.params.id);
  if (!usuario) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });

  res.json({ success: true, data: usuario });
});

// ── POST / — Create ──────────────────────────────────────
usuariosRouter.post('/', authorize(['ADMIN']), validate(createUsuarioSchema), (req: AuthRequest, res) => {
  const { nome, email, role, departamento, cargo } = req.body;

  const userExists = db.prepare('SELECT 1 FROM users WHERE email = ? AND deletedAt IS NULL').get(email);
  if (userExists) return res.status(400).json({ success: false, error: 'Email já cadastrado' });

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const senhaTemporaria = gerarSenhaTemporaria();
  const hash = bcrypt.hashSync(senhaTemporaria, config.bcryptRounds);

  db.prepare(`
    INSERT INTO users (id, nome, email, senhaHash, role, ativo, criadoPor, criadoEm, departamento, cargo, deveTrocarSenha, historicoSenhas)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, 1, ?)
  `).run(id, nome, email, hash, role, req.user!.id, now, departamento || null, cargo || null, JSON.stringify([hash]));

  logAudit(req.user!.id, 'CREATE', 'User', id, null, { nome, email, role }, req.ip, req.headers['user-agent']);

  res.json({ success: true, data: { id, senhaTemporaria } });
});

// ── PUT /:id — Update ─────────────────────────────────────
usuariosRouter.put('/:id', authorize(['ADMIN']), validate(updateUsuarioSchema), (req: AuthRequest, res) => {
  const usuario = db.prepare('SELECT * FROM users WHERE id = ? AND deletedAt IS NULL').get(req.params.id) as User | undefined;
  if (!usuario) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });

  const { nome, role, departamento, cargo, ativo } = req.body;

  db.prepare(`
    UPDATE users SET nome = ?, role = ?, departamento = ?, cargo = ?, ativo = ? WHERE id = ?
  `).run(
    nome || usuario.nome, role || usuario.role,
    departamento !== undefined ? departamento : usuario.departamento,
    cargo !== undefined ? cargo : usuario.cargo,
    ativo !== undefined ? ativo : usuario.ativo,
    usuario.id
  );

  logAudit(req.user!.id, 'UPDATE', 'User', usuario.id, { nome: usuario.nome, role: usuario.role }, req.body, req.ip, req.headers['user-agent']);

  res.json({ success: true, data: { id: usuario.id } });
});

// ── POST /:id/reset-senha — Reset password ────────────────
usuariosRouter.post('/:id/reset-senha', authorize(['ADMIN']), (req: AuthRequest, res) => {
  const usuario = db.prepare('SELECT * FROM users WHERE id = ? AND deletedAt IS NULL').get(req.params.id) as User | undefined;
  if (!usuario) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });

  const novaSenha = gerarSenhaTemporaria();
  const hash = bcrypt.hashSync(novaSenha, config.bcryptRounds);

  const historico: string[] = JSON.parse(usuario.historicoSenhas || '[]');
  historico.push(hash);

  db.prepare(`
    UPDATE users SET senhaHash = ?, deveTrocarSenha = 1, historicoSenhas = ?, senhaAlteradaEm = ? WHERE id = ?
  `).run(hash, JSON.stringify(historico), new Date().toISOString(), usuario.id);

  logAudit(req.user!.id, 'RESET_SENHA', 'User', usuario.id, null, null, req.ip, req.headers['user-agent']);

  res.json({ success: true, data: { id: usuario.id, senhaTemporaria: novaSenha } });
});

// ── DELETE /:id — Soft delete ─────────────────────────────
usuariosRouter.delete('/:id', authorize(['ADMIN']), (req: AuthRequest, res) => {
  const usuario = db.prepare('SELECT * FROM users WHERE id = ? AND deletedAt IS NULL').get(req.params.id) as User | undefined;
  if (!usuario) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });

  if (usuario.id === req.user!.id) {
    return res.status(400).json({ success: false, error: 'Não é possível excluir seu próprio usuário' });
  }

  const now = new Date().toISOString();
  db.prepare('UPDATE users SET deletedAt = ?, ativo = 0 WHERE id = ?').run(now, usuario.id);

  logAudit(req.user!.id, 'DELETE', 'User', usuario.id, { nome: usuario.nome }, null, req.ip, req.headers['user-agent']);

  res.json({ success: true, data: { id: usuario.id } });
});
