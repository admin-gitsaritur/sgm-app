import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from '../db.js';
import { config } from '../config.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, trocarSenhaSchema, refreshTokenSchema, validarSenha, gerarSenhaTemporaria, updatePerfilSchema, updateAvatarSchema } from '../schemas/index.js';
import { logAudit } from '../utils/audit.js';
import { sendEmail, buildForgotPasswordEmailHtml } from '../services/email.js';
import { emailConfig } from '../services/email-config.js';
import type { User } from '../types/index.js';

export const authRouter = Router();

// ── POST /login ───────────────────────────────────────────
authRouter.post('/login', validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await query('SELECT * FROM users WHERE email = $1 AND "deletedAt" IS NULL', [email]);
    const user = result.rows[0] as User | undefined;

    if (!user) {
      return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
    }

    if (!user.ativo) {
      return res.status(403).json({ success: false, error: 'Conta inativa' });
    }

    if (user.bloqueadoAte && new Date(user.bloqueadoAte) > new Date()) {
      return res.status(403).json({ success: false, error: 'Conta temporariamente bloqueada. Tente novamente mais tarde.' });
    }

    const validPassword = await bcrypt.compare(password, user.senhaHash);

    if (!validPassword) {
      const tentativas = (user.tentativasLoginFalhas || 0) + 1;
      let bloqueadoAte: string | null = null;

      if (tentativas >= config.maxLoginAttempts) {
        bloqueadoAte = new Date(Date.now() + config.lockoutMinutes * 60000).toISOString();
      }

      await query('UPDATE users SET "tentativasLoginFalhas" = $1, "bloqueadoAte" = $2 WHERE id = $3', [tentativas, bloqueadoAte, user.id]);

      return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
    }

    // Reset failed attempts
    await query('UPDATE users SET "tentativasLoginFalhas" = 0, "bloqueadoAte" = NULL, "ultimoLogin" = $1 WHERE id = $2', [new Date().toISOString(), user.id]);

    await logAudit(user.id, 'LOGIN', 'User', user.id, null, null, req.ip, req.headers['user-agent']);

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      config.jwtSecret as string,
      { expiresIn: config.jwtAccessExpiry as any }
    );

    const refreshToken = jwt.sign(
      { id: user.id, type: 'refresh' },
      config.jwtSecret as string,
      { expiresIn: config.jwtRefreshExpiry as any }
    );

    const { senhaHash, historicoSenhas, ...userSafe } = user;

    res.json({
      success: true,
      data: {
        user: userSafe,
        token,
        refreshToken,
        deveTrocarSenha: !!user.deveTrocarSenha,
      },
    });
  } catch (err: any) {
    console.error('Erro no login:', err);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ── POST /google ──────────────────────────────────────────
authRouter.post('/google', async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ success: false, error: 'Token do Google não fornecido' });
  }

  if (!config.googleClientId) {
    return res.status(500).json({ success: false, error: 'Google OAuth não configurado no servidor' });
  }

  try {
    // Verificar token do Google
    const { OAuth2Client } = await import('google-auth-library');
    const client = new OAuth2Client(config.googleClientId);

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: config.googleClientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(401).json({ success: false, error: 'Token do Google inválido' });
    }

    const { email, name, sub: googleId, picture } = payload;

    // Buscar user por googleId ou email
    let result = await query('SELECT * FROM users WHERE "googleId" = $1 AND "deletedAt" IS NULL', [googleId]);
    let user = result.rows[0] as User | undefined;

    if (!user) {
      // Tentar por email
      result = await query('SELECT * FROM users WHERE email = $1 AND "deletedAt" IS NULL', [email]);
      user = result.rows[0] as User | undefined;

      if (user) {
        // Vincular Google ao user existente
        await query('UPDATE users SET "googleId" = $1, "loginProvider" = $2 WHERE id = $3', [googleId, 'google', user.id]);
      } else {
        // Criar novo user via Google
        const userId = crypto.randomUUID();
        const dummyHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), config.bcryptRounds);

        await query(`
          INSERT INTO users (id, nome, email, "senhaHash", role, ativo, "criadoEm", "googleId", "loginProvider", avatar, "deveTrocarSenha")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          userId,
          name || email!.split('@')[0],
          email,
          dummyHash,
          'VISUALIZADOR',
          true,
          new Date().toISOString(),
          googleId,
          'google',
          picture || null,
          false,
        ]);

        result = await query('SELECT * FROM users WHERE id = $1', [userId]);
        user = result.rows[0] as User;
      }
    }

    if (!user.ativo) {
      return res.status(403).json({ success: false, error: 'Conta inativa' });
    }

    // Atualizar último login
    await query('UPDATE users SET "ultimoLogin" = $1 WHERE id = $2', [new Date().toISOString(), user.id]);

    await logAudit(user.id, 'LOGIN_GOOGLE', 'User', user.id, null, null, req.ip, req.headers['user-agent']);

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      config.jwtSecret as string,
      { expiresIn: config.jwtAccessExpiry as any }
    );

    const refreshToken = jwt.sign(
      { id: user.id, type: 'refresh' },
      config.jwtSecret as string,
      { expiresIn: config.jwtRefreshExpiry as any }
    );

    const { senhaHash, historicoSenhas, ...userSafe } = user;

    res.json({
      success: true,
      data: {
        user: userSafe,
        token,
        refreshToken,
        deveTrocarSenha: false,
      },
    });
  } catch (err: any) {
    console.error('Erro no login Google:', err);
    res.status(401).json({ success: false, error: 'Falha na autenticação com Google' });
  }
});

// ── POST /refresh ─────────────────────────────────────────
authRouter.post('/refresh', validate(refreshTokenSchema), async (req, res) => {
  const { refreshToken } = req.body;

  try {
    const decoded = jwt.verify(refreshToken, config.jwtSecret) as { id: string; type: string };

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ success: false, error: 'Token inválido' });
    }

    const result = await query('SELECT id, role, email FROM users WHERE id = $1 AND "deletedAt" IS NULL AND ativo = true', [decoded.id]);
    const user = result.rows[0] as { id: string; role: string; email: string } | undefined;

    if (!user) {
      return res.status(401).json({ success: false, error: 'Usuário não encontrado' });
    }

    const newToken = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      config.jwtSecret as string,
      { expiresIn: config.jwtAccessExpiry as any }
    );

    res.json({ success: true, data: { token: newToken } });
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Refresh token inválido ou expirado' });
  }
});

// ── GET /me ───────────────────────────────────────────────
authRouter.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT id, cpf, nome, email, telefone, role, avatar, departamento, cargo, "deveTrocarSenha", "loginProvider" FROM users WHERE id = $1 AND "deletedAt" IS NULL',
      [req.user!.id]
    );
    const user = result.rows[0];

    if (!user) return res.status(401).json({ success: false, error: 'Usuário não encontrado' });

    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// ── PUT /perfil ───────────────────────────────────────────
authRouter.put('/perfil', authenticate, validate(updatePerfilSchema), async (req: AuthRequest, res) => {
  const { nome, email, telefone } = req.body;

  try {
    const result = await query('SELECT * FROM users WHERE id = $1 AND "deletedAt" IS NULL', [req.user!.id]);
    const user = result.rows[0] as User | undefined;
    if (!user) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });

    if (email && email !== user.email) {
      const existing = await query(
        'SELECT 1 FROM users WHERE email = $1 AND id != $2 AND "deletedAt" IS NULL',
        [email, user.id]
      );
      if (existing.rows.length > 0) {
        return res.status(400).json({ success: false, error: 'Email já cadastrado por outro usuário' });
      }
    }

    const updatedNome = nome || user.nome;
    const updatedEmail = email || user.email;
    const updatedTelefone = telefone !== undefined ? telefone : user.telefone;

    await query(
      `UPDATE users SET nome = $1, email = $2, telefone = $3 WHERE id = $4`,
      [updatedNome, updatedEmail, updatedTelefone, user.id]
    );

    await logAudit(user.id, 'UPDATE', 'User', user.id,
      JSON.stringify({ nome: user.nome, email: user.email, telefone: user.telefone }),
      JSON.stringify({ nome: updatedNome, email: updatedEmail, telefone: updatedTelefone }),
      req.ip, req.headers['user-agent']
    );

    const updated = await query(
      `SELECT id, cpf, nome, email, telefone, role, avatar, departamento, cargo, "deveTrocarSenha", "loginProvider" FROM users WHERE id = $1`,
      [user.id]
    );

    res.json({ success: true, data: updated.rows[0] });
  } catch (err) {
    console.error('Erro ao atualizar perfil:', err);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// ── PUT /perfil/avatar ────────────────────────────────────
authRouter.put('/perfil/avatar', authenticate, validate(updateAvatarSchema), async (req: AuthRequest, res) => {
  const { avatar } = req.body;

  try {
    await query('UPDATE users SET avatar = $1 WHERE id = $2', [avatar, req.user!.id]);

    await logAudit(req.user!.id, 'UPDATE_AVATAR', 'User', req.user!.id,
      null, null,
      req.ip, req.headers['user-agent']
    );

    res.json({ success: true, data: { avatar } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// ── DELETE /perfil/avatar ─────────────────────────────────
authRouter.delete('/perfil/avatar', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await query('SELECT "googleId" FROM users WHERE id = $1', [req.user!.id]);
    const user = result.rows[0];

    // O avatar do Google fica salvo na primeira autenticação. Setar null.
    const googleAvatar = null;

    await query('UPDATE users SET avatar = $1 WHERE id = $2', [googleAvatar, req.user!.id]);
    
    await logAudit(req.user!.id, 'UPDATE_AVATAR', 'User', req.user!.id,
      null, null,
      req.ip, req.headers['user-agent']
    );

    res.json({ success: true, data: { avatar: googleAvatar } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// ── POST /trocar-senha ────────────────────────────────────
authRouter.post('/trocar-senha', authenticate, validate(trocarSenhaSchema), async (req: AuthRequest, res) => {
  const { senhaAtual, senhaNova } = req.body;

  const validacao = validarSenha(senhaNova);
  if (!validacao.valida) {
    return res.status(400).json({ success: false, error: 'Senha não atende requisitos', details: { senha: validacao.erros } });
  }

  try {
    const result = await query('SELECT * FROM users WHERE id = $1', [req.user!.id]);
    const user = result.rows[0] as User | undefined;
    if (!user) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });

    const senhaCorreta = await bcrypt.compare(senhaAtual, user.senhaHash);
    if (!senhaCorreta) {
      return res.status(400).json({ success: false, error: 'Senha atual incorreta' });
    }

    // Check password history (last 5)
    const historico: string[] = Array.isArray(user.historicoSenhas)
      ? user.historicoSenhas
      : JSON.parse(user.historicoSenhas || '[]');

    for (const oldHash of historico.slice(-5)) {
      if (await bcrypt.compare(senhaNova, oldHash)) {
        return res.status(400).json({ success: false, error: 'Senha já utilizada anteriormente. Escolha uma senha diferente.' });
      }
    }

    const newHash = await bcrypt.hash(senhaNova, config.bcryptRounds);
    historico.push(newHash);

    await query(
      `UPDATE users SET "senhaHash" = $1, "deveTrocarSenha" = false, "historicoSenhas" = $2, "senhaAlteradaEm" = $3 WHERE id = $4`,
      [newHash, JSON.stringify(historico), new Date().toISOString(), user.id]
    );

    await logAudit(user.id, 'TROCAR_SENHA', 'User', user.id, null, null, req.ip, req.headers['user-agent']);

    res.json({ success: true, data: { message: 'Senha alterada com sucesso' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// ── POST /esqueci-senha ───────────────────────────────────
authRouter.post('/esqueci-senha', async (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ success: false, error: 'Email obrigatório' });
  }

  try {
    const result = await query('SELECT * FROM users WHERE email = $1 AND "deletedAt" IS NULL', [email.toLowerCase().trim()]);
    const user = result.rows[0] as User | undefined;

    // Sempre retornar sucesso para não expor existência de contas
    if (!user) {
      return res.json({ success: true, data: { message: 'Se o email estiver cadastrado, você receberá as instruções.' } });
    }

    // Gerar senha temporária
    const senhaTemp = gerarSenhaTemporaria();
    const newHash = await bcrypt.hash(senhaTemp, config.bcryptRounds);

    await query(
      `UPDATE users SET "senhaHash" = $1, "deveTrocarSenha" = true WHERE id = $2`,
      [newHash, user.id]
    );

    // Enviar email com template Saritur
    const html = buildForgotPasswordEmailHtml({
      nomeUsuario: user.nome,
      senhaTemporaria: senhaTemp,
    });

    await sendEmail({
      to: user.email,
      subject: `${emailConfig.brand.system} ${emailConfig.brand.name} — Redefinição de Senha`,
      html,
    });

    await logAudit(user.id, 'RESET_SENHA', 'User', user.id, null, null, req.ip, req.headers['user-agent']);

    res.json({ success: true, data: { message: 'Se o email estiver cadastrado, você receberá as instruções.' } });
  } catch (err) {
    console.error('Erro no esqueci-senha:', err);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});
