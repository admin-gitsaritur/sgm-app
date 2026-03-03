import { Router } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { query } from '../db.js';
import PDFDocument from 'pdfkit';

export const relatoriosRouter = Router();
relatoriosRouter.use(authenticate);

// ── GET /preview — Preview do relatório mensal ────────────
relatoriosRouter.get('/preview', authorize(['ADMIN', 'GESTOR']), async (req: AuthRequest, res) => {
    try {
        const mes = parseInt(req.query.mes as string) || new Date().getMonth() + 1;
        const ano = parseInt(req.query.ano as string) || new Date().getFullYear();

        const report = await gerarDadosRelatorio(mes, ano);
        res.json({ success: true, data: report });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── GET /exportar — Exportar PDF ──────────────────────────
relatoriosRouter.get('/exportar', authorize(['ADMIN', 'GESTOR']), async (req: AuthRequest, res) => {
    try {
        const mes = parseInt(req.query.mes as string) || new Date().getMonth() + 1;
        const ano = parseInt(req.query.ano as string) || new Date().getFullYear();

        const report = await gerarDadosRelatorio(mes, ano);

        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const meses = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=relatorio-sgm-${meses[mes]}-${ano}.pdf`);
        doc.pipe(res);

        // ── Header ──
        doc.fontSize(20).font('Helvetica-Bold').text('Relatório Mensal — SGM', { align: 'center' });
        doc.fontSize(12).font('Helvetica').text(`${meses[mes]} ${ano}`, { align: 'center' });
        doc.moveDown(2);

        // ── 1. Status Consolidado ──
        doc.fontSize(14).font('Helvetica-Bold').text('1. Status Consolidado das Metas');
        doc.moveDown(0.5);
        for (const meta of report.metas) {
            const semaforo = meta.semaforo === 'VERDE' ? '🟢' : meta.semaforo === 'AMARELO' ? '🟡' : '🔴';
            doc.fontSize(11).font('Helvetica-Bold').text(`${semaforo} ${meta.nome}`);
            doc.fontSize(10).font('Helvetica')
                .text(`  Atingimento: ${meta.percentualAtingimento.toFixed(1)}% | Realizado: ${formatCurrency(meta.realizadoCentavos)} / ${formatCurrency(meta.valorMetaCentavos)}`);
            doc.text(`  Projeção: ${formatCurrency(meta.projecaoLinearCentavos)} | Desvio: ${formatCurrency(meta.desvioCentavos)}`);
            doc.moveDown(0.3);
        }
        doc.moveDown();

        // ── 2. Projetos abaixo do esperado ──
        doc.fontSize(14).font('Helvetica-Bold').text('2. Projetos Abaixo do Esperado (< 85%)');
        doc.moveDown(0.5);
        if (report.projetosAbaixo.length === 0) {
            doc.fontSize(10).font('Helvetica').text('  Nenhum projeto abaixo de 85%.');
        } else {
            for (const p of report.projetosAbaixo) {
                doc.fontSize(10).font('Helvetica').text(`  • ${p.nome} — ${p.percentualExecucao.toFixed(1)}% (Meta: ${p.metaNome})`);
            }
        }
        doc.moveDown();

        // ── 3. Indicadores atrasados ──
        doc.fontSize(14).font('Helvetica-Bold').text('3. Indicadores Atrasados');
        doc.moveDown(0.5);
        if (report.indicadoresAtrasados.length === 0) {
            doc.fontSize(10).font('Helvetica').text('  Todos os indicadores atualizados no prazo.');
        } else {
            for (const i of report.indicadoresAtrasados) {
                doc.fontSize(10).font('Helvetica').text(`  • ${i.nome} — Responsável: ${i.responsavelNome} (Projeto: ${i.projetoNome})`);
            }
        }
        doc.moveDown();

        // ── 4. Projeção de fechamento ──
        doc.fontSize(14).font('Helvetica-Bold').text('4. Projeção de Fechamento Anual');
        doc.moveDown(0.5);
        for (const meta of report.metas) {
            const status = meta.gapProjetadoCentavos <= 0 ? '✅ Projeção indica atingimento' : `⚠️ Gap: ${formatCurrency(meta.gapProjetadoCentavos)}`;
            doc.fontSize(10).font('Helvetica').text(`  ${meta.nome}: ${formatCurrency(meta.projecaoLinearCentavos)} — ${status}`);
        }
        doc.moveDown();

        // ── 5. Top 5 piores performances ──
        doc.fontSize(14).font('Helvetica-Bold').text('5. Top 5 — Responsáveis com Menor Score');
        doc.moveDown(0.5);
        for (let i = 0; i < Math.min(5, report.pioresPerformances.length); i++) {
            const r = report.pioresPerformances[i];
            doc.fontSize(10).font('Helvetica').text(`  ${i + 1}. ${r.nome} — Score: ${r.score.toFixed(1)} | Atrasados: ${r.atrasados}`);
        }
        doc.moveDown();

        // ── 6. Resumo ──
        doc.fontSize(14).font('Helvetica-Bold').text('6. Resumo Geral');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica')
            .text(`  Metas ativas: ${report.metas.length}`)
            .text(`  Projetos totais: ${report.totalProjetos}`)
            .text(`  Indicadores atrasados: ${report.indicadoresAtrasados.length}`)
            .text(`  Projetos abaixo de 85%: ${report.projetosAbaixo.length}`);

        // ── Footer ──
        doc.moveDown(3);
        doc.fontSize(8).font('Helvetica').fillColor('#999999')
            .text(`Gerado automaticamente pelo SGM em ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });

        doc.end();
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── Funções auxiliares ────────────────────────────────────

function formatCurrency(centavos: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(centavos / 100);
}

async function gerarDadosRelatorio(mes: number, ano: number) {
    // Metas ativas do ano
    const metasResult = await query(
        'SELECT * FROM metas WHERE ano = $1 AND "deletedAt" IS NULL AND status != $2 ORDER BY nome',
        [ano, 'CANCELADA']
    );

    const metas = [];
    let totalProjetos = 0;

    for (const meta of metasResult.rows) {
        const projResult = await query(
            'SELECT * FROM projetos WHERE "metaId" = $1 AND "deletedAt" IS NULL',
            [meta.id]
        );
        totalProjetos += projResult.rows.length;

        let realizadoAcumulado = 0;
        for (const proj of projResult.rows) {
            const indResult = await query(
                'SELECT * FROM indicadores WHERE "projetoId" = $1 AND "deletedAt" IS NULL',
                [proj.id]
            );
            let execucao = 0;
            let totalPeso = 0;
            for (const ind of indResult.rows) {
                const pct = ind.metaIndicadorCentavos > 0 ? ind.realizadoCentavos / ind.metaIndicadorCentavos : 0;
                execucao += pct * ind.peso;
                totalPeso += ind.peso;
            }
            const percExecucao = totalPeso > 0 ? execucao / totalPeso : 0;
            realizadoAcumulado += proj.contribuicaoEsperadaCentavos * percExecucao;
        }

        // Esperado acumulado
        let esperado = 0;
        if (meta.tipoCurva === 'LINEAR') {
            esperado = (meta.valorMetaCentavos / 12) * mes;
        } else if (meta.curvaPersonalizada) {
            const curva = typeof meta.curvaPersonalizada === 'string' ? JSON.parse(meta.curvaPersonalizada) : meta.curvaPersonalizada;
            esperado = curva.slice(0, mes).reduce((a: number, b: number) => a + b, 0);
        }

        const pctAtingimento = meta.valorMetaCentavos > 0 ? (realizadoAcumulado / meta.valorMetaCentavos) * 100 : 0;
        const razao = esperado > 0 ? realizadoAcumulado / esperado : 1;
        const semaforo = razao >= 0.95 ? 'VERDE' : razao >= 0.85 ? 'AMARELO' : 'VERMELHO';

        const mediaMensal = mes > 0 ? realizadoAcumulado / mes : 0;
        const projecao = realizadoAcumulado + (mediaMensal * (12 - mes));

        metas.push({
            nome: meta.nome,
            valorMetaCentavos: meta.valorMetaCentavos,
            realizadoCentavos: Math.round(realizadoAcumulado),
            percentualAtingimento: pctAtingimento,
            semaforo,
            projecaoLinearCentavos: Math.round(projecao),
            gapProjetadoCentavos: Math.round(meta.valorMetaCentavos - projecao),
            desvioCentavos: Math.round(realizadoAcumulado - esperado),
        });
    }

    // Projetos abaixo de 85%
    const projAbaixoResult = await query(
        `SELECT p.*, m.nome as "metaNome" FROM projetos p
     JOIN metas m ON p."metaId" = m.id
     WHERE p."deletedAt" IS NULL AND m."deletedAt" IS NULL AND m.ano = $1`,
        [ano]
    );

    const projetosAbaixo = [];
    for (const proj of projAbaixoResult.rows) {
        const indResult = await query(
            'SELECT * FROM indicadores WHERE "projetoId" = $1 AND "deletedAt" IS NULL',
            [proj.id]
        );
        let execucao = 0, totalPeso = 0;
        for (const ind of indResult.rows) {
            const pct = ind.metaIndicadorCentavos > 0 ? ind.realizadoCentavos / ind.metaIndicadorCentavos : 0;
            execucao += pct * ind.peso;
            totalPeso += ind.peso;
        }
        const percExecucao = totalPeso > 0 ? (execucao / totalPeso) * 100 : 0;
        if (percExecucao < 85) {
            projetosAbaixo.push({ nome: proj.nome, metaNome: proj.metaNome, percentualExecucao: percExecucao });
        }
    }

    // Indicadores atrasados
    const atrasadosResult = await query(
        `SELECT i.nome, i."statusAtualizacao", u.nome as "responsavelNome", p.nome as "projetoNome"
     FROM indicadores i
     JOIN users u ON i.responsavel = u.id
     JOIN projetos p ON i."projetoId" = p.id
     WHERE i."statusAtualizacao" = 'ATRASADO' AND i."deletedAt" IS NULL AND p."deletedAt" IS NULL`
    );

    // Piores performances
    const usersResult = await query('SELECT id, nome FROM users WHERE ativo = true AND "deletedAt" IS NULL');
    const performances = [];
    for (const user of usersResult.rows) {
        const userInd = await query(
            'SELECT * FROM indicadores WHERE responsavel = $1 AND "deletedAt" IS NULL',
            [user.id]
        );
        if (userInd.rows.length === 0) continue;
        const total = userInd.rows.length;
        const atrasados = userInd.rows.filter((i: any) => i.statusAtualizacao === 'ATRASADO').length;
        const noPrazo = ((total - atrasados) / total) * 100;
        const mediaAt = userInd.rows.reduce((acc: number, i: any) => {
            return acc + (i.metaIndicadorCentavos > 0 ? (i.realizadoCentavos / i.metaIndicadorCentavos) * 100 : 0);
        }, 0) / total;
        const score = (noPrazo * 0.4) + (Math.min(mediaAt, 100) * 0.6);
        performances.push({ nome: user.nome, score, atrasados });
    }
    performances.sort((a, b) => a.score - b.score);

    return {
        mes,
        ano,
        metas,
        totalProjetos,
        projetosAbaixo,
        indicadoresAtrasados: atrasadosResult.rows,
        pioresPerformances: performances.slice(0, 5),
    };
}
