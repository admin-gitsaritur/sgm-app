import { db } from '../db.js';
import crypto from 'crypto';

export const logAudit = (
  userId: string,
  acao: string,
  entidade: string,
  entidadeId: string,
  dadosAnteriores: unknown = null,
  dadosNovos: unknown = null,
  ip: string | undefined = '',
  userAgent: string | string[] | undefined = ''
) => {
  db.prepare(`
    INSERT INTO auditoria (id, timestamp, userId, acao, entidade, entidadeId, dadosAnteriores, dadosNovos, ip, userAgent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    crypto.randomUUID(),
    new Date().toISOString(),
    userId,
    acao,
    entidade,
    entidadeId,
    dadosAnteriores ? JSON.stringify(dadosAnteriores) : null,
    dadosNovos ? JSON.stringify(dadosNovos) : null,
    ip || '',
    typeof userAgent === 'string' ? userAgent : (userAgent?.[0] || '')
  );
};
