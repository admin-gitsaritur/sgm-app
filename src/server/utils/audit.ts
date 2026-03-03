import { query } from '../db.js';
import crypto from 'crypto';

export const logAudit = async (
  userId: string,
  acao: string,
  entidade: string,
  entidadeId: string,
  dadosAnteriores: unknown = null,
  dadosNovos: unknown = null,
  ip: string | undefined = '',
  userAgent: string | string[] | undefined = ''
) => {
  try {
    await query(`
      INSERT INTO auditoria (id, "timestamp", "userId", acao, entidade, "entidadeId", "dadosAnteriores", "dadosNovos", ip, "userAgent")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      crypto.randomUUID(),
      new Date().toISOString(),
      userId,
      acao,
      entidade,
      entidadeId,
      dadosAnteriores ? JSON.stringify(dadosAnteriores) : null,
      dadosNovos ? JSON.stringify(dadosNovos) : null,
      ip || '',
      typeof userAgent === 'string' ? userAgent : (userAgent?.[0] || ''),
    ]);
  } catch (err) {
    console.error('Erro ao registrar auditoria:', err);
  }
};
