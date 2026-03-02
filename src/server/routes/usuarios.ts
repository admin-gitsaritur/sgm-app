import { Router } from 'express';
import { db } from '../db.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export const usuariosRouter = Router();

usuariosRouter.use(authenticate);

usuariosRouter.get('/', authorize(['ADMIN']), (req: AuthRequest, res) => {
  const usuarios = db.prepare('SELECT id, nome, email, role, ativo, ultimoLogin, criadoEm, departamento, cargo FROM users').all();
  res.json({ success: true, data: usuarios });
});

usuariosRouter.post('/', authorize(['ADMIN']), (req: AuthRequest, res) => {
  const { nome, email, role, departamento, cargo } = req.body;

  const userExists = db.prepare('SELECT 1 FROM users WHERE email = ?').get(email);
  if (userExists) return res.status(400).json({ success: false, error: 'Email já cadastrado' });

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  // Senha temporária
  const salt = bcrypt.genSaltSync(12);
  const hash = bcrypt.hashSync('Mudar@123', salt);

  db.prepare(\`
    INSERT INTO users (id, nome, email, senhaHash, role, ativo, criadoPor, criadoEm, departamento, cargo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  \`).run(
    id, nome, email, hash, role, 1, req.user!.id, now, departamento, cargo
  );

  logAudit(req.user!.id, 'CREATE', 'User', id, null, req.body, req.ip, req.headers['user-agent']);

  res.json({ success: true, data: { id } });
});
