import { Router } from 'express';
import { db } from '../db.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';

export const auditoriaRouter = Router();

auditoriaRouter.use(authenticate);

auditoriaRouter.get('/', authorize(['ADMIN']), (req: AuthRequest, res) => {
  const logs = db.prepare('SELECT * FROM auditoria ORDER BY timestamp DESC LIMIT 1000').all();
  
  logs.forEach((l: any) => {
    if (l.dadosAnteriores) l.dadosAnteriores = JSON.parse(l.dadosAnteriores);
    if (l.dadosNovos) l.dadosNovos = JSON.parse(l.dadosNovos);
  });

  res.json({ success: true, data: logs });
});
