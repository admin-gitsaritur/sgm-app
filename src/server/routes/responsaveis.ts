import { Router } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { query } from '../db.js';

export const responsaveisRouter = Router();
responsaveisRouter.use(authenticate);

// ── GET / — Performance de todos os responsáveis ──────────
responsaveisRouter.get('/', async (req: AuthRequest, res) => {
    try {
        // Buscar todos os usuários ativos
        const usersResult = await query(
            'SELECT id, nome, email, departamento, cargo, role FROM users WHERE ativo = true AND "deletedAt" IS NULL ORDER BY nome'
        );

        const responsaveis = [];

        for (const user of usersResult.rows) {
            // Indicadores sob responsabilidade
            const indResult = await query(
                `SELECT i.*, p."contribuicaoEsperadaCentavos", p.nome as "projetoNome"
         FROM indicadores i
         LEFT JOIN projetos p ON i."projetoId" = p.id
         WHERE i.responsavel = $1 AND i."deletedAt" IS NULL AND (p."deletedAt" IS NULL OR i."projetoId" IS NULL)`,
                [user.id]
            );

            if (indResult.rows.length === 0) continue; // Pula quem não tem indicadores

            const indicadores = indResult.rows;
            const total = indicadores.length;

            // % indicadores no prazo
            const noPrazo = indicadores.filter((i: any) => i.statusAtualizacao !== 'ATRASADO').length;
            const percentualNoPrazo = total > 0 ? (noPrazo / total) * 100 : 0;

            // % médio de atingimento
            const mediaAtingimento = total > 0
                ? indicadores.reduce((acc: number, i: any) => {
                    const pct = i.metaIndicadorCentavos > 0 ? (i.realizadoCentavos / i.metaIndicadorCentavos) * 100 : 0;
                    return acc + pct;
                }, 0) / total
                : 0;

            // Indicadores atrasados
            const atrasados = indicadores.filter((i: any) => i.statusAtualizacao === 'ATRASADO').length;

            // Contribuição financeira (projetos como responsável principal)
            const projResult = await query(
                'SELECT COALESCE(SUM("contribuicaoEsperadaCentavos"), 0) as total FROM projetos WHERE "responsavelPrincipal" = $1 AND "deletedAt" IS NULL',
                [user.id]
            );
            const contribuicaoFinanceira = parseInt(projResult.rows[0]?.total || '0');

            // Score de confiabilidade = (% no prazo × 0.4) + (% atingimento × 0.6)
            const score = (percentualNoPrazo * 0.4) + (Math.min(mediaAtingimento, 100) * 0.6);

            // Dados para radar chart
            const radar = {
                pontualidade: percentualNoPrazo,
                atingimento: Math.min(mediaAtingimento, 100),
                cobertura: Math.min((total / 5) * 100, 100), // normalizado: 5+ indicadores = 100%
                contribuicao: Math.min((contribuicaoFinanceira / 500000000) * 100, 100), // normalizado: R$ 5M+ = 100%
                consistencia: atrasados === 0 ? 100 : Math.max(0, 100 - (atrasados * 20)),
            };

            responsaveis.push({
                user: { id: user.id, nome: user.nome, email: user.email, departamento: user.departamento, cargo: user.cargo },
                totalIndicadores: total,
                percentualNoPrazo: Math.round(percentualNoPrazo * 10) / 10,
                mediaAtingimento: Math.round(mediaAtingimento * 10) / 10,
                indicadoresAtrasados: atrasados,
                contribuicaoFinanceiraCentavos: contribuicaoFinanceira,
                score: Math.round(score * 10) / 10,
                radar,
            });
        }

        // Ordenar por score descendente
        responsaveis.sort((a, b) => b.score - a.score);

        res.json({ success: true, data: responsaveis });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── GET /:id — Detalhe de um responsável ──────────────────
responsaveisRouter.get('/:id', async (req: AuthRequest, res) => {
    try {
        const userResult = await query(
            'SELECT id, nome, email, departamento, cargo, role FROM users WHERE id = $1 AND ativo = true',
            [req.params.id]
        );
        if (userResult.rows.length === 0) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });

        const user = userResult.rows[0];

        // Indicadores detalhados
        const indResult = await query(
            `SELECT i.*, p.nome as "projetoNome", COALESCE(m.nome, md.nome) as "metaNome"
       FROM indicadores i
       LEFT JOIN projetos p ON i."projetoId" = p.id
       LEFT JOIN metas m ON p."metaId" = m.id
       LEFT JOIN metas md ON md.id = i."metaId"
       WHERE i.responsavel = $1 AND i."deletedAt" IS NULL AND (p."deletedAt" IS NULL OR i."projetoId" IS NULL)`,
            [user.id]
        );

        // Projetos como responsável principal
        const projResult = await query(
            `SELECT p.*, m.nome as "metaNome"
       FROM projetos p
       LEFT JOIN metas m ON p."metaId" = m.id
       WHERE p."responsavelPrincipal" = $1 AND p."deletedAt" IS NULL`,
            [user.id]
        );

        res.json({
            success: true,
            data: {
                user,
                indicadores: indResult.rows,
                projetos: projResult.rows,
            },
        });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});
