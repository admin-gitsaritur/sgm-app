import { Router } from 'express';
import { query } from '../db.js';
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
usuariosRouter.get('/', authorize(['ADMIN']), async (req: AuthRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const offset = (page - 1) * limit;
  const role = req.query.role as string;
  const departamento = req.query.departamento as string;
  const ativo = req.query.ativo as string;
  const busca = req.query.busca as string;

  let where = '"deletedAt" IS NULL';
  const params: unknown[] = [];
  let idx = 1;
  if (role) { where += ` AND role = $${idx++}`; params.push(role); }
  if (departamento) { where += ` AND departamento = $${idx++}`; params.push(departamento); }
  if (ativo !== undefined && ativo !== '') { where += ` AND ativo = $${idx++}`; params.push(ativo === '1' || ativo === 'true'); }
  if (busca) { where += ` AND (nome ILIKE $${idx++} OR email ILIKE $${idx++})`; params.push(`%${busca}%`, `%${busca}%`); idx++; }

  try {
    const totalResult = await query(`SELECT COUNT(*) as count FROM users WHERE ${where}`, params);
    const total = parseInt(totalResult.rows[0].count);

    const result = await query(`
      SELECT id, nome, email, role, ativo, "ultimoLogin", "criadoEm", departamento, cargo, "deveTrocarSenha"
      FROM users WHERE ${where} ORDER BY "criadoEm" DESC LIMIT $${idx++} OFFSET $${idx++}
    `, [...params, limit, offset]);

    res.json({
      success: true,
      data: result.rows,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('Erro ao listar usuários:', err);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// ── GET /:id ──────────────────────────────────────────────
usuariosRouter.get('/:id', authorize(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT id, nome, email, role, ativo, "ultimoLogin", "criadoEm", departamento, cargo FROM users WHERE id = $1 AND "deletedAt" IS NULL',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// ── POST / — Create ──────────────────────────────────────
usuariosRouter.post('/', authorize(['ADMIN']), validate(createUsuarioSchema), async (req: AuthRequest, res) => {
  const { nome, email, role, departamento, cargo } = req.body;

  try {
    const existing = await query('SELECT 1 FROM users WHERE email = $1 AND "deletedAt" IS NULL', [email]);
    if (existing.rows.length > 0) return res.status(400).json({ success: false, error: 'Email já cadastrado' });

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const senhaTemporaria = gerarSenhaTemporaria();
    const hash = await bcrypt.hash(senhaTemporaria, config.bcryptRounds);

    await query(`
      INSERT INTO users (id, nome, email, "senhaHash", role, ativo, "criadoPor", "criadoEm", departamento, cargo, "deveTrocarSenha", "historicoSenhas")
      VALUES ($1, $2, $3, $4, $5, true, $6, $7, $8, $9, true, $10)
    `, [id, nome, email, hash, role, req.user!.id, now, departamento || null, cargo || null, JSON.stringify([hash])]);

    await logAudit(req.user!.id, 'CREATE', 'User', id, null, { nome, email, role }, req.ip, req.headers['user-agent']);

    res.json({ success: true, data: { id, senhaTemporaria } });
  } catch (err) {
    console.error('Erro ao criar usuário:', err);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// ── PUT /:id — Update ─────────────────────────────────────
usuariosRouter.put('/:id', authorize(['ADMIN']), validate(updateUsuarioSchema), async (req: AuthRequest, res) => {
  try {
    const result = await query('SELECT * FROM users WHERE id = $1 AND "deletedAt" IS NULL', [req.params.id]);
    const usuario = result.rows[0] as User | undefined;
    if (!usuario) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });

    const { nome, role, departamento, cargo, ativo } = req.body;

    await query(`
      UPDATE users SET nome = $1, role = $2, departamento = $3, cargo = $4, ativo = $5 WHERE id = $6
    `, [
      nome || usuario.nome, role || usuario.role,
      departamento !== undefined ? departamento : usuario.departamento,
      cargo !== undefined ? cargo : usuario.cargo,
      ativo !== undefined ? ativo : usuario.ativo,
      usuario.id,
    ]);

    await logAudit(req.user!.id, 'UPDATE', 'User', usuario.id, { nome: usuario.nome, role: usuario.role }, req.body, req.ip, req.headers['user-agent']);
    res.json({ success: true, data: { id: usuario.id } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// ── POST /:id/reset-senha — Reset password ────────────────
usuariosRouter.post('/:id/reset-senha', authorize(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const result = await query('SELECT * FROM users WHERE id = $1 AND "deletedAt" IS NULL', [req.params.id]);
    const usuario = result.rows[0] as User | undefined;
    if (!usuario) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });

    const novaSenha = gerarSenhaTemporaria();
    const hash = await bcrypt.hash(novaSenha, config.bcryptRounds);

    const historico: string[] = Array.isArray(usuario.historicoSenhas)
      ? usuario.historicoSenhas
      : JSON.parse(usuario.historicoSenhas || '[]');
    historico.push(hash);

    await query(
      `UPDATE users SET "senhaHash" = $1, "deveTrocarSenha" = true, "historicoSenhas" = $2, "senhaAlteradaEm" = $3 WHERE id = $4`,
      [hash, JSON.stringify(historico), new Date().toISOString(), usuario.id]
    );

    await logAudit(req.user!.id, 'RESET_SENHA', 'User', usuario.id, null, null, req.ip, req.headers['user-agent']);
    res.json({ success: true, data: { id: usuario.id, senhaTemporaria: novaSenha } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// ── DELETE /:id — Soft delete ─────────────────────────────
usuariosRouter.delete('/:id', authorize(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const result = await query('SELECT * FROM users WHERE id = $1 AND "deletedAt" IS NULL', [req.params.id]);
    const usuario = result.rows[0] as User | undefined;
    if (!usuario) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });

    if (usuario.id === req.user!.id) {
      return res.status(400).json({ success: false, error: 'Não é possível excluir seu próprio usuário' });
    }

    const now = new Date().toISOString();
    await query('UPDATE users SET "deletedAt" = $1, ativo = false WHERE id = $2', [now, usuario.id]);

    await logAudit(req.user!.id, 'DELETE', 'User', usuario.id, { nome: usuario.nome }, null, req.ip, req.headers['user-agent']);
    res.json({ success: true, data: { id: usuario.id } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});
