import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../db.js';
import { config } from '../config.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, trocarSenhaSchema, refreshTokenSchema, validarSenha } from '../schemas/index.js';
import { logAudit } from '../utils/audit.js';
import type { User } from '../types/index.js';

export const authRouter = Router();

// ── POST /login ───────────────────────────────────────────
authRouter.post('/login', validate(loginSchema), (req, res) => {
  const { email, password } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE email = ? AND deletedAt IS NULL').get(email) as User | undefined;

  if (!user) {
    return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
  }

  if (user.ativo === 0) {
    return res.status(403).json({ success: false, error: 'Conta inativa' });
  }

  if (user.bloqueadoAte && new Date(user.bloqueadoAte) > new Date()) {
    return res.status(403).json({ success: false, error: 'Conta temporariamente bloqueada. Tente novamente mais tarde.' });
  }

  const validPassword = bcrypt.compareSync(password, user.senhaHash);

  if (!validPassword) {
    const tentativas = user.tentativasLoginFalhas + 1;
    let bloqueadoAte: string | null = null;

    if (tentativas >= config.maxLoginAttempts) {
      bloqueadoAte = new Date(Date.now() + config.lockoutMinutes * 60000).toISOString();
    }

    db.prepare('UPDATE users SET tentativasLoginFalhas = ?, bloqueadoAte = ? WHERE id = ?')
      .run(tentativas, bloqueadoAte, user.id);

    return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
  }

  // Reset failed attempts
  db.prepare('UPDATE users SET tentativasLoginFalhas = 0, bloqueadoAte = NULL, ultimoLogin = ? WHERE id = ?')
    .run(new Date().toISOString(), user.id);

  logAudit(user.id, 'LOGIN', 'User', user.id, null, null, req.ip, req.headers['user-agent']);

  const token = jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    config.jwtSecret,
    { expiresIn: config.jwtAccessExpiry }
  );

  const refreshToken = jwt.sign(
    { id: user.id, type: 'refresh' },
    config.jwtSecret,
    { expiresIn: config.jwtRefreshExpiry }
  );

  const { senhaHash, historicoSenhas, ...userSafe } = user;

  res.json({
    success: true,
    data: {
      user: userSafe,
      token,
      refreshToken,
      deveTrocarSenha: user.deveTrocarSenha === 1,
    },
  });
});

// ── POST /refresh ─────────────────────────────────────────
authRouter.post('/refresh', validate(refreshTokenSchema), (req, res) => {
  const { refreshToken } = req.body;

  try {
    const decoded = jwt.verify(refreshToken, config.jwtSecret) as { id: string; type: string };

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ success: false, error: 'Token inválido' });
    }

    const user = db.prepare('SELECT id, role, email FROM users WHERE id = ? AND deletedAt IS NULL AND ativo = 1').get(decoded.id) as { id: string; role: string; email: string } | undefined;

    if (!user) {
      return res.status(401).json({ success: false, error: 'Usuário não encontrado' });
    }

    const newToken = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      config.jwtSecret,
      { expiresIn: config.jwtAccessExpiry }
    );

    res.json({ success: true, data: { token: newToken } });
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Refresh token inválido ou expirado' });
  }
});

// ── GET /me ───────────────────────────────────────────────
authRouter.get('/me', authenticate, (req: AuthRequest, res) => {
  const user = db.prepare(
    'SELECT id, nome, email, role, avatar, departamento, cargo, deveTrocarSenha FROM users WHERE id = ? AND deletedAt IS NULL'
  ).get(req.user!.id) as Omit<User, 'senhaHash' | 'historicoSenhas'> | undefined;

  if (!user) return res.status(401).json({ success: false, error: 'Usuário não encontrado' });

  res.json({ success: true, data: user });
});

// ── POST /trocar-senha ────────────────────────────────────
authRouter.post('/trocar-senha', authenticate, validate(trocarSenhaSchema), (req: AuthRequest, res) => {
  const { senhaAtual, senhaNova } = req.body;

  // Validate complexity
  const validacao = validarSenha(senhaNova);
  if (!validacao.valida) {
    return res.status(400).json({ success: false, error: 'Senha não atende requisitos', details: { senha: validacao.erros } });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as User | undefined;
  if (!user) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });

  if (!bcrypt.compareSync(senhaAtual, user.senhaHash)) {
    return res.status(400).json({ success: false, error: 'Senha atual incorreta' });
  }

  // Check password history (last 5)
  const historico: string[] = JSON.parse(user.historicoSenhas || '[]');
  for (const oldHash of historico.slice(-5)) {
    if (bcrypt.compareSync(senhaNova, oldHash)) {
      return res.status(400).json({ success: false, error: 'Senha já utilizada anteriormente. Escolha uma senha diferente.' });
    }
  }

  const newHash = bcrypt.hashSync(senhaNova, config.bcryptRounds);
  historico.push(newHash);

  db.prepare(`
    UPDATE users SET senhaHash = ?, deveTrocarSenha = 0, historicoSenhas = ?, senhaAlteradaEm = ? WHERE id = ?
  `).run(newHash, JSON.stringify(historico), new Date().toISOString(), user.id);

  logAudit(user.id, 'TROCAR_SENHA', 'User', user.id, null, null, req.ip, req.headers['user-agent']);

  res.json({ success: true, data: { message: 'Senha alterada com sucesso' } });
});
