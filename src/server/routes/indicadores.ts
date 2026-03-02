import { Router } from 'express';
import { db } from '../db.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';
import crypto from 'crypto';
import Decimal from 'decimal.js';

export const indicadoresRouter = Router();

indicadoresRouter.use(authenticate);

indicadoresRouter.get('/', (req: AuthRequest, res) => {
  const indicadores = db.prepare('SELECT * FROM indicadores').all();
  
  indicadores.forEach((i: any) => {
    i.historicoRealizados = JSON.parse(i.historicoRealizados);
  });

  res.json({ success: true, data: indicadores });
});

indicadoresRouter.post('/', authorize(['ADMIN', 'GESTOR']), (req: AuthRequest, res) => {
  const { projetoId, nome, metaIndicador, unidade, peso, frequenciaAtualizacao, responsavel } = req.body;

  const projeto = db.prepare('SELECT * FROM projetos WHERE id = ?').get(projetoId);
  if (!projeto) return res.status(404).json({ success: false, error: 'Projeto não encontrado' });

  // Validar soma dos pesos dos indicadores do projeto
  const indicadoresDoProjeto = db.prepare('SELECT peso FROM indicadores WHERE projetoId = ?').all(projetoId);
  let somaPesos = new Decimal(peso);
  indicadoresDoProjeto.forEach((i: any) => {
    somaPesos = somaPesos.plus(i.peso);
  });

  if (somaPesos.toNumber() > 1.0) {
    return res.status(400).json({ success: false, error: 'A soma dos pesos dos indicadores do projeto não pode exceder 1.0' });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(\`
    INSERT INTO indicadores (id, projetoId, nome, metaIndicador, realizado, unidade, peso, frequenciaAtualizacao, responsavel, dataUltimaAtualizacao, statusAtualizacao, historicoRealizados)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  \`).run(
    id, projetoId, nome, metaIndicador, 0, unidade, peso, frequenciaAtualizacao, responsavel, now, 'ATUALIZADO', '[]'
  );

  logAudit(req.user!.id, 'CREATE', 'Indicador', id, null, req.body, req.ip, req.headers['user-agent']);

  res.json({ success: true, data: { id } });
});

indicadoresRouter.post('/:id/atualizar', authorize(['ADMIN', 'GESTOR', 'OPERADOR']), (req: AuthRequest, res) => {
  const { realizado } = req.body;
  const indicadorId = req.params.id;

  if (realizado < 0) {
    return res.status(400).json({ success: false, error: 'Valor realizado não pode ser negativo' });
  }

  const indicador = db.prepare('SELECT * FROM indicadores WHERE id = ?').get(indicadorId) as any;
  if (!indicador) return res.status(404).json({ success: false, error: 'Indicador não encontrado' });

  if (req.user!.role === 'OPERADOR' && indicador.responsavel !== req.user!.id) {
    return res.status(403).json({ success: false, error: 'Acesso negado' });
  }

  const historico = JSON.parse(indicador.historicoRealizados);
  const now = new Date().toISOString();
  
  historico.push({
    data: now,
    valor: realizado,
    atualizadoPor: req.user!.id
  });

  db.prepare(\`
    UPDATE indicadores 
    SET realizado = ?, dataUltimaAtualizacao = ?, statusAtualizacao = ?, historicoRealizados = ?
    WHERE id = ?
  \`).run(
    realizado, now, 'ATUALIZADO', JSON.stringify(historico), indicadorId
  );

  logAudit(req.user!.id, 'UPDATE', 'Indicador', indicadorId, { realizado: indicador.realizado }, { realizado }, req.ip, req.headers['user-agent']);

  res.json({ success: true, data: { id: indicadorId } });
});
