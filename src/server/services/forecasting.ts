import Decimal from 'decimal.js';

interface ProjecaoResult {
    projecaoLinearCentavos: number;
    projecaoTendenciaCentavos: number;
    gapLinearCentavos: number;
    gapTendenciaCentavos: number;
    risco: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';
}

export function calcularProjecao(
    realizadoMensalCentavos: number[],
    valorMetaCentavos: number
): ProjecaoResult {
    const mesesDecorridos = realizadoMensalCentavos.length;

    if (mesesDecorridos === 0) {
        return {
            projecaoLinearCentavos: 0,
            projecaoTendenciaCentavos: 0,
            gapLinearCentavos: valorMetaCentavos,
            gapTendenciaCentavos: valorMetaCentavos,
            risco: 'CRITICO',
        };
    }

    const mesesRestantes = 12 - mesesDecorridos;
    const realizadoAcumulado = realizadoMensalCentavos.reduce((a, b) => a + b, 0);

    // Linear projection
    const mediaMensal = new Decimal(realizadoAcumulado).dividedBy(mesesDecorridos);
    const projecaoLinear = new Decimal(realizadoAcumulado).plus(mediaMensal.times(mesesRestantes));

    // Trend projection (last 3 months)
    const ultimos3 = realizadoMensalCentavos.slice(-Math.min(3, mesesDecorridos));
    const mediaRecente = new Decimal(ultimos3.reduce((a, b) => a + b, 0)).dividedBy(ultimos3.length);
    const projecaoTendencia = new Decimal(realizadoAcumulado).plus(mediaRecente.times(mesesRestantes));

    const gapLinear = new Decimal(valorMetaCentavos).minus(projecaoLinear);
    const gapTendencia = new Decimal(valorMetaCentavos).minus(projecaoTendencia);

    // Risk classification
    const razao = valorMetaCentavos > 0 ? projecaoLinear.dividedBy(valorMetaCentavos).toNumber() : 0;
    let risco: ProjecaoResult['risco'];
    if (razao >= 0.95) risco = 'BAIXO';
    else if (razao >= 0.85) risco = 'MEDIO';
    else if (razao >= 0.70) risco = 'ALTO';
    else risco = 'CRITICO';

    return {
        projecaoLinearCentavos: Math.round(projecaoLinear.toNumber()),
        projecaoTendenciaCentavos: Math.round(projecaoTendencia.toNumber()),
        gapLinearCentavos: Math.round(gapLinear.toNumber()),
        gapTendenciaCentavos: Math.round(gapTendencia.toNumber()),
        risco,
    };
}

export function calcularEsperadoAcumulado(
    valorMetaCentavos: number,
    tipoCurva: string,
    curvaPersonalizadaCentavos: number[] | null,
    mesAtual: number // 1-12
): number {
    if (tipoCurva === 'PERSONALIZADA' && curvaPersonalizadaCentavos && curvaPersonalizadaCentavos.length === 12) {
        return curvaPersonalizadaCentavos.slice(0, mesAtual).reduce((a, b) => a + b, 0);
    }
    // Linear distribution
    return Math.round((valorMetaCentavos / 12) * mesAtual);
}

export function calcularSemaforo(razao: number): 'VERDE' | 'AMARELO' | 'VERMELHO' {
    if (razao >= 0.95) return 'VERDE';
    if (razao >= 0.85) return 'AMARELO';
    return 'VERMELHO';
}
