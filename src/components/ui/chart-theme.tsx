"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// ============================================================================
// CHART THEME — Padrão visual global para gráficos Recharts
// ============================================================================

/**
 * Paleta de cores oficial Saritur CX para gráficos.
 *
 * @example
 * ```tsx
 * import { CHART_COLORS } from "@/components/ui/chart-theme"
 * <Bar fill={CHART_COLORS.primary} />
 * <Line stroke={CHART_COLORS.palette[2]} />
 * ```
 */
export const CHART_COLORS = {
    /** Laranja Saritur — cor principal */
    primary: "#F37137",
    /** Marrom Saritur — cor secundária */
    secondary: "#4E3205",
    /** Amarelo — accent */
    accent: "#F6D317",
    /** Verde — sucesso/positivo */
    success: "#10B981",
    /** Azul — informativo */
    info: "#3B82F6",
    /** Roxo — destaque alternativo */
    purple: "#8B5CF6",
    /** Vermelho — alerta/negativo */
    danger: "#EF4444",
    /** Cinza — grid lines */
    grid: "#F5F5F4",
    /** Cinza — labels de eixo */
    text: "#A8A29E",

    /**
     * 3 cores brand — para gráficos com ≤3 séries.
     * Laranja Saritur, Marrom Saritur e Amarelo Accent.
     */
    brandTriple: ["#F37137", "#4E3205", "#F6D317"] as const,

    /**
     * Paleta cítrica/alegre — para gráficos com 4+ séries.
     * Tons vibrantes e alegres. Distintas das cores de categorização
     * (#A855F7 roxo, #22D3EE cyan, #A3E635 lime) e tipo agência
     * (#F97316 orange, #6366F1 indigo) para evitar confusão.
     */
    extendedPalette: [
        "#FF6B35", // Tangerina — laranja vibrante
        "#8BC34A", // Limão — verde-limão
        "#FFB300", // Maracujá — amarelo-ouro
        "#AB47BC", // Uva — roxo-berry
        "#00ACC1", // Lagoa — turquesa
        "#E91E63", // Pitaya — rosa-vivo
        "#5C6BC0", // Amora — azul-roxo
        "#FDD835", // Manga — amarelo-claro
    ] as const,

    /** @deprecated Use getChartPalette(count) em vez disso */
    palette: ["#FF6B35", "#8BC34A", "#FFB300", "#AB47BC", "#00ACC1", "#E91E63", "#5C6BC0", "#FDD835"] as const,
} as const

/**
 * Retorna a paleta ideal baseada no número de séries:
 * - ≤ 3 séries → brandTriple (laranja, marrom, amarelo)
 * - 4+ séries → extendedPalette (paleta cítrica/alegre)
 *
 * @example
 * ```tsx
 * const colors = getChartPalette(data.length)
 * {data.map((_, i) => <Cell fill={colors[i % colors.length]} />)}
 * ```
 */
export function getChartPalette(count: number): readonly string[] {
    return count <= 3 ? CHART_COLORS.brandTriple : CHART_COLORS.extendedPalette
}

// ============================================================================
// CONSTANTES DE EIXO E GRID
// ============================================================================

/**
 * Props padrão para XAxis.
 * Linha de eixo X visível (stone-200), sem marcadores de tick.
 *
 * @example
 * ```tsx
 * <XAxis dataKey="name" {...chartXAxisProps} />
 * ```
 */
export const chartXAxisProps = {
    axisLine: { stroke: '#E7E5E4' },
    tickLine: false,
    tick: { fill: CHART_COLORS.text, fontSize: 11 },
    dy: 10,
} as const

/**
 * Props padrão para YAxis.
 * Linha de eixo Y visível (stone-200), sem marcadores de tick.
 *
 * @example
 * ```tsx
 * <YAxis {...chartYAxisProps} />
 * ```
 */
export const chartYAxisProps = {
    axisLine: { stroke: '#E7E5E4' },
    tickLine: false,
    tick: { fill: CHART_COLORS.text, fontSize: 11 },
    tickFormatter: (v: number) => v.toLocaleString('pt-BR'),
} as const

/**
 * Props padrão para CartesianGrid.
 * Linha tracejada, apenas horizontal, cor suave.
 *
 * @example
 * ```tsx
 * <CartesianGrid {...chartGridProps} />
 * ```
 */
export const chartGridProps = {
    strokeDasharray: "3 3",
    vertical: false as const,
    stroke: CHART_COLORS.grid,
} as const

// ============================================================================
// GRADIENTES SVG
// ============================================================================

/**
 * Definições SVG de gradientes reutilizáveis.
 * Insira dentro de qualquer `<AreaChart>` ou `<ComposedChart>`.
 *
 * @example
 * ```tsx
 * <AreaChart data={data}>
 *   <ChartGradients />
 *   <Area fill="url(#sariturFadePrimary)" stroke={CHART_COLORS.primary} />
 * </AreaChart>
 * ```
 *
 * Gradientes disponíveis:
 * - `sariturFadePrimary` — Laranja com fade vertical
 * - `sariturFadeSuccess` — Verde com fade vertical
 * - `sariturFadeInfo` — Azul com fade vertical
 */
export function ChartGradients() {
    return (
        <defs>
            <linearGradient id="sariturFadePrimary" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="sariturFadeSuccess" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="sariturFadeInfo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.info} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART_COLORS.info} stopOpacity={0} />
            </linearGradient>
        </defs>
    )
}

// ============================================================================
// TOOLTIP CUSTOMIZADO
// ============================================================================

interface ChartTooltipProps {
    active?: boolean
    payload?: Array<{
        name: string
        value: number
        color: string
        dataKey?: string
    }>
    label?: string
    /** Unidade a exibir após o valor (ex: "R$", "%", "un") */
    unit?: string
    /** Função para formatar o valor (ex: formatCurrency). Se não fornecida, usa toLocaleString('pt-BR'). */
    formatter?: (value: number) => string
    className?: string
}

/**
 * Tooltip padronizado Saritur CX com efeito glassmorphism.
 *
 * @example
 * ```tsx
 * import { ChartTooltip } from "@/components/ui/chart-theme"
 *
 * <Tooltip content={<ChartTooltip formatter={formatCurrency} />} />
 * <Tooltip content={<ChartTooltip unit="%" />} />
 * ```
 */
export function ChartTooltip({
    active,
    payload,
    label,
    unit = "",
    formatter,
    className,
}: ChartTooltipProps) {
    if (!active || !payload?.length) return null

    return (
        <div
            className={cn(
                "bg-white/95 backdrop-blur-md border border-stone-200 rounded-xl",
                "px-4 py-3 shadow-lg shadow-black/5 z-50",
                className
            )}
        >
            {label && (
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                    {label}
                </p>
            )}
            {payload.map((entry, index) => (
                <p
                    key={index}
                    className="text-sm font-semibold text-[#4E3205] flex items-center gap-2"
                >
                    <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-stone-500 font-normal">{entry.name}:</span>
                    <span>
                        {formatter
                            ? formatter(entry.value)
                            : entry.value.toLocaleString("pt-BR")}
                        {unit ? ` ${unit}` : ""}
                    </span>
                </p>
            ))}
        </div>
    )
}

// ============================================================================
// CURSOR STYLE
// ============================================================================

/**
 * Estilo padrão para cursor do Tooltip.
 *
 * @example
 * ```tsx
 * <Tooltip cursor={chartCursorStyle} />
 * ```
 */
export const chartCursorStyle = {
    stroke: CHART_COLORS.primary,
    strokeWidth: 1,
    strokeDasharray: "4 4",
} as const

/**
 * Estilo padrão para cursor em BarChart (transparente para não sobrepor barras).
 */
export const chartBarCursorStyle = {
    fill: "transparent",
} as const
