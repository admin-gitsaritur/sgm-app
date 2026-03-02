import { Router } from 'express';
import { db } from '../db.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';
import crypto from 'crypto';
import Decimal from 'decimal.js';

export const metasRouter = Router();

metasRouter.use(authenticate);

metasRouter.get('/', (req: AuthRequest, res) => {
  const metas = db.prepare('SELECT * FROM metas WHERE status != "CANCELADA"').all();
  
  // Parse JSON arrays
  metas.forEach((m: any) => {
    if (m.curvaPersonalizada) {
      m.curvaPersonalizada = JSON.parse(m.curvaPersonalizada);
    }
  });

  res.json({ success: true, data: metas });
});

metasRouter.post('/', authorize(['ADMIN']), (req: AuthRequest, res) => {
  const { nome, valorMeta, ano, periodoInicio, periodoFim, indicadorMacro, periodicidadeAtualizacao, tipoCurva, curvaPersonalizada } = req.body;

  if (tipoCurva === 'PERSONALIZADA') {
    if (!curvaPersonalizada || curvaPersonalizada.length !== 12) {
      return res.status(400).json({ success: false, error: 'Curva personalizada deve conter 12 valores' });
    }
    
    const soma = curvaPersonalizada.reduce((acc: number, val: number) => new Decimal(acc).plus(val).toNumber(), 0);
    if (new Decimal(soma).toNumber() !== new Decimal(valorMeta).toNumber()) {
      return res.status(400).json({ success: false, error: 'Soma da curva personalizada deve ser exatamente igual ao valor da meta' });
    }
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(\`
    INSERT INTO metas (id, nome, valorMeta, ano, periodoInicio, periodoFim, indicadorMacro, periodicidadeAtualizacao, tipoCurva, curvaPersonalizada, status, criadoPor, criadoEm, atualizadoEm)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  \`).run(
    id, nome, valorMeta, ano, periodoInicio, periodoFim, indicadorMacro, periodicidadeAtualizacao, tipoCurva, 
    tipoCurva === 'PERSONALIZADA' ? JSON.stringify(curvaPersonalizada) : null,
    'ATIVA', req.user!.id, now, now
  );

  logAudit(req.user!.id, 'CREATE', 'Meta', id, null, req.body, req.ip, req.headers['user-agent']);

  res.json({ success: true, data: { id } });
});

metasRouter.get('/:id', (req: AuthRequest, res) => {
  const meta = db.prepare('SELECT * FROM metas WHERE id = ?').get(req.params.id) as any;
  if (!meta) return res.status(404).json({ success: false, error: 'Meta não encontrada' });
  
  if (meta.curvaPersonalizada) {
    meta.curvaPersonalizada = JSON.parse(meta.curvaPersonalizada);
  }

  res.json({ success: true, data: meta });
});
