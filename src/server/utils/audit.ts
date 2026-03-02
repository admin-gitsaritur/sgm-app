import { db } from '../db.js';
import crypto from 'crypto';

export const logAudit = (
  userId: string,
  acao: string,
  entidade: string,
  entidadeId: string,
  dadosAnteriores: any = null,
  dadosNovos: any = null,
  ip: string = '',
  userAgent: string = ''
) => {
  db.prepare(\`
    INSERT INTO auditoria (id, timestamp, userId, acao, entidade, entidadeId, dadosAnteriores, dadosNovos, ip, userAgent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  \`).run(
    crypto.randomUUID(),
    new Date().toISOString(),
    userId,
    acao,
    entidade,
    entidadeId,
    dadosAnteriores ? JSON.stringify(dadosAnteriores) : null,
    dadosNovos ? JSON.stringify(dadosNovos) : null,
    ip,
    userAgent
  );
};
