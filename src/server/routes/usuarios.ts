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
import { sendEmail, buildWelcomeEmailHtml, buildAdminResetEmailHtml } from '../services/email.js';
import { emailConfig } from '../services/email-config.js';

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
      SELECT id, cpf, nome, email, telefone, role, ativo, "ultimoLogin", "criadoEm", departamento, cargo, "deveTrocarSenha", avatar
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
      'SELECT id, cpf, nome, email, telefone, role, ativo, "ultimoLogin", "criadoEm", departamento, cargo, avatar, "loginProvider" FROM users WHERE id = $1 AND "deletedAt" IS NULL',
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
  const { nome, email, cpf, telefone, role, departamento, cargo } = req.body;

  try {
    const existing = await query('SELECT 1 FROM users WHERE email = $1 AND "deletedAt" IS NULL', [email]);
    if (existing.rows.length > 0) return res.status(400).json({ success: false, error: 'Email já cadastrado' });

    if (cpf) {
      const cpfExists = await query('SELECT 1 FROM users WHERE cpf = $1 AND "deletedAt" IS NULL', [cpf]);
      if (cpfExists.rows.length > 0) return res.status(400).json({ success: false, error: 'CPF já cadastrado' });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const senhaTemporaria = gerarSenhaTemporaria();
    const hash = await bcrypt.hash(senhaTemporaria, config.bcryptRounds);

    await query(`
      INSERT INTO users (id, cpf, nome, email, telefone, "senhaHash", role, ativo, "criadoPor", "criadoEm", departamento, cargo, "deveTrocarSenha", "historicoSenhas")
      VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, $9, $10, $11, true, $12)
    `, [id, cpf || null, nome, email, telefone || null, hash, role, req.user!.id, now, departamento || null, cargo || null, JSON.stringify([hash])]);

    await logAudit(req.user!.id, 'CREATE', 'User', id, null, JSON.stringify({ nome, email, cpf, telefone, role }), req.ip, req.headers['user-agent']);

    // ── Disparar email de boas-vindas ──
    const adminResult = await query('SELECT nome FROM users WHERE id = $1', [req.user!.id]);
    const adminNome = adminResult.rows[0]?.nome || 'Administrador';

    const welcomeHtml = buildWelcomeEmailHtml({
      nomeUsuario: nome,
      email,
      role,
      senhaTemporaria,
      criadoPorNome: adminNome,
    });

    sendEmail({
      to: email,
      subject: `${emailConfig.brand.system} ${emailConfig.brand.name} — Bem-vindo!`,
      html: welcomeHtml,
    }).catch(err => console.error('[Email] Falha ao enviar boas-vindas:', err));

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

    const { nome, role, telefone, departamento, cargo, ativo } = req.body;

    await query(`
      UPDATE users SET nome = $1, role = $2, telefone = $3, departamento = $4, cargo = $5, ativo = $6 WHERE id = $7
    `, [
      nome || usuario.nome, role || usuario.role,
      telefone !== undefined ? telefone : usuario.telefone,
      departamento !== undefined ? departamento : usuario.departamento,
      cargo !== undefined ? cargo : usuario.cargo,
      ativo !== undefined ? ativo : usuario.ativo,
      usuario.id,
    ]);

    await logAudit(req.user!.id, 'UPDATE', 'User', usuario.id, JSON.stringify({ nome: usuario.nome, role: usuario.role, telefone: usuario.telefone }), JSON.stringify(req.body), req.ip, req.headers['user-agent']);
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

    // ── Disparar email de reset ──
    const adminResult = await query('SELECT nome FROM users WHERE id = $1', [req.user!.id]);
    const adminNome = adminResult.rows[0]?.nome || 'Administrador';

    const resetHtml = buildAdminResetEmailHtml({
      nomeUsuario: usuario.nome,
      senhaTemporaria: novaSenha,
      resetadoPorNome: adminNome,
    });

    sendEmail({
      to: usuario.email,
      subject: `${emailConfig.brand.system} ${emailConfig.brand.name} — Senha Redefinida`,
      html: resetHtml,
    }).catch(err => console.error('[Email] Falha ao enviar reset:', err));

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
