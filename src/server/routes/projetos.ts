import { Router } from 'express';
import { db } from '../db.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';
import crypto from 'crypto';
import Decimal from 'decimal.js';

export const projetosRouter = Router();

projetosRouter.use(authenticate);

projetosRouter.get('/', (req: AuthRequest, res) => {
  const projetos = db.prepare('SELECT * FROM projetos WHERE status != "CANCELADO"').all();
  
  projetos.forEach((p: any) => {
    p.responsaveis = JSON.parse(p.responsaveis);
  });

  res.json({ success: true, data: projetos });
});

projetosRouter.post('/', authorize(['ADMIN', 'GESTOR']), (req: AuthRequest, res) => {
  const { metaId, nome, contribuicaoEsperada, prazoInicio, prazoFim, responsavelPrincipal, responsaveis } = req.body;

  if (contribuicaoEsperada <= 0) {
    return res.status(400).json({ success: false, error: 'Contribuição esperada deve ser maior que zero' });
  }

  const meta = db.prepare('SELECT * FROM metas WHERE id = ?').get(metaId);
  if (!meta) return res.status(404).json({ success: false, error: 'Meta não encontrada' });

  // Calcular peso automático
  const projetosDaMeta = db.prepare('SELECT contribuicaoEsperada FROM projetos WHERE metaId = ? AND status != "CANCELADO"').all();
  
  let somaContribuicoes = new Decimal(contribuicaoEsperada);
  projetosDaMeta.forEach((p: any) => {
    somaContribuicoes = somaContribuicoes.plus(p.contribuicaoEsperada);
  });

  const pesoAutomatico = new Decimal(contribuicaoEsperada).dividedBy(somaContribuicoes).toNumber();

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(\`
    INSERT INTO projetos (id, metaId, nome, contribuicaoEsperada, pesoAutomatico, prazoInicio, prazoFim, responsavelPrincipal, responsaveis, status, criadoPor, criadoEm, atualizadoEm)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  \`).run(
    id, metaId, nome, contribuicaoEsperada, pesoAutomatico, prazoInicio, prazoFim, responsavelPrincipal, JSON.stringify(responsaveis), 'NAO_INICIADO', req.user!.id, now, now
  );

  // Recalcular pesos dos outros projetos da mesma meta
  const projetosParaAtualizar = db.prepare('SELECT id, contribuicaoEsperada FROM projetos WHERE metaId = ? AND id != ? AND status != "CANCELADO"').all(metaId, id);
  
  const updateStmt = db.prepare('UPDATE projetos SET pesoAutomatico = ?, atualizadoEm = ? WHERE id = ?');
  
  db.transaction(() => {
    projetosParaAtualizar.forEach((p: any) => {
      const novoPeso = new Decimal(p.contribuicaoEsperada).dividedBy(somaContribuicoes).toNumber();
      updateStmt.run(novoPeso, now, p.id);
    });
  })();

  logAudit(req.user!.id, 'CREATE', 'Projeto', id, null, req.body, req.ip, req.headers['user-agent']);

  res.json({ success: true, data: { id } });
});
