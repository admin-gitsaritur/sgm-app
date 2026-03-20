/**
 * Formatadores de valores reutilizáveis.
 *
 * @example
 * ```tsx
 * import { formatCurrency, formatPercent } from "@/lib/formatters"
 *
 * formatCurrency(1500.5)  // "R$ 1.500,50"
 * formatPercent(85.437)   // "85,44%"
 * ```
 */

/** Formata número como moeda BRL (ex: R$ 1.500,50) */
export const formatCurrency = (value: number): string =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

/** Formata número como percentual com 2 casas (ex: 85,44%) */
export const formatPercent = (value: number): string =>
    value.toFixed(2).replace('.', ',') + '%'
