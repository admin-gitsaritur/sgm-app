// ============================================================================
// FORMAT UTILS — Formatação unit-aware para valores numéricos do SGM
// ============================================================================

/** Labels curtos por unidade */
export const UNIDADE_LABELS: Record<string, string> = {
  BRL: 'R$',
  PERCENTUAL: '%',
  UNIDADE: 'un',
  KM: 'km',
};

/** Unidades que NÃO usam casas decimais (valor inteiro) */
export const isIntegerUnit = (u: string) => u === 'KM' || u === 'UNIDADE';

/** Retorna 0 para unidades inteiras e 2 para monetárias */
export const getDecimals = (u: string) => isIntegerUnit(u) ? 0 : 2;

/**
 * Formata um valor armazenado em centavos para exibição conforme a unidade.
 * - BRL: R$ 15.575,00
 * - PERCENTUAL: 78,50%
 * - KM: 15.575 km
 * - UNIDADE: 350 un
 */
export const formatValue = (centavos: number, unidade: string = 'BRL'): string => {
  if (isIntegerUnit(unidade)) {
    const val = Math.round(centavos / 100);
    return `${val.toLocaleString('pt-BR')} ${UNIDADE_LABELS[unidade] || unidade}`;
  }
  if (unidade === 'PERCENTUAL') {
    return `${(centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}%`;
  }
  // BRL (default)
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(centavos / 100);
};

/**
 * Versão compacta para KPIs e eixos de gráficos.
 * - BRL: R$ 1,2M / R$ 850K
 * - KM: 15K km
 * - UNIDADE: 350 un  
 */
export const formatValueShort = (centavos: number, unidade: string = 'BRL'): string => {
  const symbol = UNIDADE_LABELS[unidade] || '';
  
  if (isIntegerUnit(unidade)) {
    const val = Math.round(centavos / 100);
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M ${symbol}`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K ${symbol}`;
    return `${val.toLocaleString('pt-BR')} ${symbol}`;
  }
  
  if (unidade === 'PERCENTUAL') {
    return `${(centavos / 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
  }
  
  // BRL
  const v = centavos / 100;
  if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(0)}K`;
  return formatValue(centavos, 'BRL');
};
