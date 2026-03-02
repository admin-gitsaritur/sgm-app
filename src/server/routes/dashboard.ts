import { Router } from 'express';
import { db } from '../db.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { calcularProjecao, calcularEsperadoAcumulado, calcularSemaforo } from '../services/forecasting.js';
import type { Meta, Projeto, Indicador, HistoricoIndicador, DashboardMeta, EvolucaoMensal } from '../types/index.js';

export const dashboardRouter = Router();
dashboardRouter.use(authenticate);

// ── GET / — Aggregated dashboard data ─────────────────────
dashboardRouter.get('/', (req: AuthRequest, res) => {
    const metas = db.prepare('SELECT * FROM metas WHERE deletedAt IS NULL AND status = ?').all('ATIVA') as Meta[];

    const now = new Date();
    const mesAtual = now.getMonth() + 1; // 1-12

    const result: DashboardMeta[] = metas.map(meta => {
        const projetos = db.prepare(
            'SELECT * FROM projetos WHERE metaId = ? AND deletedAt IS NULL'
        ).all(meta.id) as Projeto[];

        let realizadoAcumuladoCentavos = 0;

        const dashboardProjetos = projetos.map(projeto => {
            const indicadores = db.prepare(
                'SELECT * FROM indicadores WHERE projetoId = ? AND deletedAt IS NULL'
            ).all(projeto.id) as Indicador[];

            // Calculate weighted execution percentage
            let pesoTotal = 0;
            let percentualPonderado = 0;
            let indicadoresAtrasados = 0;

            const dashboardIndicadores = indicadores.map(ind => {
                const percentualAtingido = ind.metaIndicadorCentavos > 0
                    ? (ind.realizadoCentavos / ind.metaIndicadorCentavos) * 100
                    : 0;

                pesoTotal += ind.peso;
                percentualPonderado += ind.peso * (percentualAtingido / 100);

                if (ind.statusAtualizacao === 'ATRASADO' || ind.statusAtualizacao === 'PENDENTE') {
                    indicadoresAtrasados++;
                }

                return { indicador: ind, percentualAtingido };
            });

            const percentualExecucao = pesoTotal > 0 ? (percentualPonderado / pesoTotal) * 100 : 0;
            const contribuicaoRealEstimadaCentavos = Math.round(
                projeto.contribuicaoEsperadaCentavos * (percentualExecucao / 100)
            );

            realizadoAcumuladoCentavos += contribuicaoRealEstimadaCentavos;

            return {
                projeto,
                percentualExecucao,
                contribuicaoRealEstimadaCentavos,
                indicadores: dashboardIndicadores,
                indicadoresAtrasados,
            };
        });

        // Expected accumulated based on curve
        const curvaPersonalizadaCentavos = meta.curvaPersonalizada
            ? JSON.parse(meta.curvaPersonalizada) as number[]
            : null;

        const esperadoAcumuladoCentavos = calcularEsperadoAcumulado(
            meta.valorMetaCentavos, meta.tipoCurva, curvaPersonalizadaCentavos, mesAtual
        );

        const percentualAtingimento = meta.valorMetaCentavos > 0
            ? (realizadoAcumuladoCentavos / meta.valorMetaCentavos) * 100
            : 0;

        const razaoSemaforo = esperadoAcumuladoCentavos > 0
            ? realizadoAcumuladoCentavos / esperadoAcumuladoCentavos
            : 0;

        const semaforo = calcularSemaforo(razaoSemaforo);

        // Build monthly evolution for chart
        const evolucaoMensal: EvolucaoMensal[] = [];
        const mensalLinear = Math.round(meta.valorMetaCentavos / 12);

        // Simulated monthly data (in production, this would come from historico_indicadores aggregated by month)
        for (let mes = 1; mes <= 12; mes++) {
            const esperado = meta.tipoCurva === 'PERSONALIZADA' && curvaPersonalizadaCentavos
                ? curvaPersonalizadaCentavos.slice(0, mes).reduce((a: number, b: number) => a + b, 0)
                : mensalLinear * mes;

            evolucaoMensal.push({
                mes: new Date(meta.ano, mes - 1).toLocaleString('pt-BR', { month: 'short' }),
                esperadoCentavos: esperado,
                realizadoCentavos: mes <= mesAtual ? Math.round(realizadoAcumuladoCentavos * (mes / mesAtual)) : null,
                projecaoCentavos: mes > mesAtual ? Math.round(realizadoAcumuladoCentavos + ((realizadoAcumuladoCentavos / Math.max(mesAtual, 1)) * (mes - mesAtual))) : null,
            });
        }

        // Forecasting
        const realizadosMensais = evolucaoMensal
            .filter(e => e.realizadoCentavos !== null)
            .map((e, i, arr) => {
                if (i === 0) return e.realizadoCentavos!;
                return e.realizadoCentavos! - (arr[i - 1].realizadoCentavos || 0);
            });

        const projecao = calcularProjecao(realizadosMensais, meta.valorMetaCentavos);

        return {
            meta,
            projetos: dashboardProjetos,
            realizadoAcumuladoCentavos,
            esperadoAcumuladoCentavos,
            percentualAtingimento,
            razaoSemaforo,
            semaforo,
            projecaoLinearCentavos: projecao.projecaoLinearCentavos,
            projecaoTendenciaCentavos: projecao.projecaoTendenciaCentavos,
            gapProjetadoCentavos: projecao.gapLinearCentavos,
            desvioCentavos: realizadoAcumuladoCentavos - esperadoAcumuladoCentavos,
            risco: projecao.risco,
            evolucaoMensal,
        };
    });

    res.json({ success: true, data: result });
});
