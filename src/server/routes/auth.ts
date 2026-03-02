import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import crypto from 'crypto';

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-sgm-2025';

authRouter.post('/login', (req, res) => {
  const { email, password } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;

  if (!user) {
    return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
  }

  if (user.ativo === 0) {
    return res.status(403).json({ success: false, error: 'Conta inativa' });
  }

  if (user.bloqueadoAte && new Date(user.bloqueadoAte) > new Date()) {
    return res.status(403).json({ success: false, error: 'Conta temporariamente bloqueada' });
  }

  const validPassword = bcrypt.compareSync(password, user.senhaHash);

  if (!validPassword) {
    const tentativas = user.tentativasLoginFalhas + 1;
    let bloqueadoAte = null;
    
    if (tentativas >= 5) {
      bloqueadoAte = new Date(Date.now() + 30 * 60000).toISOString(); // 30 mins
    }

    db.prepare('UPDATE users SET tentativasLoginFalhas = ?, bloqueadoAte = ? WHERE id = ?')
      .run(tentativas, bloqueadoAte, user.id);

    return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
  }

  // Reset tentativas
  db.prepare('UPDATE users SET tentativasLoginFalhas = 0, bloqueadoAte = NULL, ultimoLogin = ? WHERE id = ?')
    .run(new Date().toISOString(), user.id);

  // Log audit
  db.prepare(\`
    INSERT INTO auditoria (id, timestamp, userId, acao, entidade, entidadeId, ip, userAgent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  \`).run(
    crypto.randomUUID(),
    new Date().toISOString(),
    user.id,
    'LOGIN',
    'User',
    user.id,
    req.ip,
    req.headers['user-agent']
  );

  const token = jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const { senhaHash, ...userWithoutPassword } = user;

  res.json({
    success: true,
    data: {
      user: userWithoutPassword,
      token,
      refreshToken
    }
  });
});

authRouter.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, error: 'Não autorizado' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.prepare('SELECT id, nome, email, role, avatar, departamento, cargo FROM users WHERE id = ?').get(decoded.id);
    
    if (!user) return res.status(401).json({ success: false, error: 'Usuário não encontrado' });
    
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(401).json({ success: false, error: 'Token inválido' });
  }
});
