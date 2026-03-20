"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// ============================================================================
// HEATMAP GRID — Visualização de densidade (Dia × Hora, etc.)
// ============================================================================

interface HeatmapDataPoint {
    /** Índice da linha (ex: dia da semana 0-6) */
    row: number
    /** Índice da coluna (ex: hora 0-23) */
    col: number
    /** Valor numérico (usado para calcular intensidade) */
    value: number
    /** Tooltip extra opcional */
    tooltip?: string
}

interface HeatmapGridProps {
    /** Dados do heatmap */
    data: HeatmapDataPoint[]
    /** Labels das linhas (ex: ['Dom', 'Seg', ...]) */
    rowLabels: string[]
    /** Labels das colunas (ex: ['0h', '1h', ...]) */
    colLabels: string[]
    /** Cor base (hex). Intensidade é calculada via opacidade. Ignorada se colorScale é fornecido. */
    color?: string
    /** Escala de cores multicor (array de hex). Interpola entre as cores com base na intensidade. */
    colorScale?: string[]
    /** Formatador do tooltip. Recebe o data point, retorna string */
    tooltipFormatter?: (point: HeatmapDataPoint) => string
    /** Desabilitar scroll horizontal, ajustando quadrados para caber na largura */
    fitWidth?: boolean
    /** Classes adicionais */
    className?: string
}

/**
 * Interpola entre duas cores hex com base em fator t (0-1)
 */
function interpolateColor(color1: string, color2: string, t: number): string {
    const r1 = parseInt(color1.slice(1, 3), 16)
    const g1 = parseInt(color1.slice(3, 5), 16)
    const b1 = parseInt(color1.slice(5, 7), 16)
    const r2 = parseInt(color2.slice(1, 3), 16)
    const g2 = parseInt(color2.slice(3, 5), 16)
    const b2 = parseInt(color2.slice(5, 7), 16)
    const r = Math.round(r1 + (r2 - r1) * t)
    const g = Math.round(g1 + (g2 - g1) * t)
    const b = Math.round(b1 + (b2 - b1) * t)
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

/**
 * Retorna cor interpolada de uma escala com base na intensidade (0-1)
 */
function getScaleColor(scale: string[], intensity: number): string {
    if (intensity <= 0) return scale[0]
    if (intensity >= 1) return scale[scale.length - 1]
    const pos = intensity * (scale.length - 1)
    const idx = Math.floor(pos)
    const t = pos - idx
    if (idx >= scale.length - 1) return scale[scale.length - 1]
    return interpolateColor(scale[idx], scale[idx + 1], t)
}

/**
 * Grid heatmap reutilizável — renderiza uma matrix de densidade.
 * 
 * Suporta 2 modos de cor:
 * - **Cor única** (default): usa `color` com gradiente de opacidade
 * - **Escala multicor**: usa `colorScale` para interpolar entre cores (ex: azul→amarelo→vermelho)
 * 
 * @example
 * ```tsx
 * <HeatmapGrid
 *     data={cells}
 *     rowLabels={['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']}
 *     colLabels={Array.from({length: 24}, (_, i) => `${i}h`)}
 *     colorScale={['#313695', '#FFFFBF', '#A50026']}
 *     tooltipFormatter={(p) => `${p.value} vendas`}
 *     fitWidth
 * />
 * ```
 */
export function HeatmapGrid({
    data,
    rowLabels,
    colLabels,
    color = "#F37137",
    colorScale,
    tooltipFormatter,
    fitWidth = false,
    className,
}: HeatmapGridProps) {
    // Calcular valor máximo para normalizar intensidade
    const maxValue = React.useMemo(
        () => Math.max(...data.map(d => d.value), 1),
        [data]
    )

    // Lookup rápido: `${row}-${col}` → dataPoint
    const lookup = React.useMemo(() => {
        const map = new Map<string, HeatmapDataPoint>()
        for (const point of data) {
            map.set(`${point.row}-${point.col}`, point)
        }
        return map
    }, [data])

    // Default: Warm heatmap scale — cinza → azul → amarelo → laranja → vermelho → sangue
    const defaultColorScale = ['#E0E0E0', '#81D4FA', '#039BE5', '#FFF176', '#FBC02D', '#FB8C00', '#E65100', '#FF1744', '#D50000', '#5D0808']
    const useScale = colorScale ?? defaultColorScale

    const getCellColor = (value: number): string => {
        const intensity = value / maxValue
        return getScaleColor(useScale, intensity)
    }

    // Calcular largura do label de linha baseado no maior label
    const rowLabelWidth = fitWidth ? 48 : 60

    return (
        <div className={cn(fitWidth ? "" : "overflow-x-auto", className)}>
            <div className={fitWidth ? "overflow-visible relative" : "min-w-[600px] overflow-visible relative"}>
                <div
                    className="grid gap-0 overflow-visible"
                    style={{
                        gridTemplateColumns: `${rowLabelWidth}px repeat(${colLabels.length}, 1fr)`,
                    }}
                >
                    {/* Header: vazio + colLabels + 24h marker at the end */}
                    <div />
                    {colLabels.map((label, i) => (
                        <div key={`col-${i}`} className="text-center text-[10px] text-stone-400 font-medium overflow-visible whitespace-nowrap">
                            {label}
                        </div>
                    ))}

                    {/* Rows */}
                    {rowLabels.map((rowLabel, rowIdx) => (
                        <React.Fragment key={`row-${rowIdx}`}>
                            <div
                                className="text-[10px] text-stone-400 font-medium flex items-center whitespace-nowrap overflow-visible leading-none"
                                style={fitWidth ? {
                                    height: rowLabels.length <= 10 ? 24 : Math.max(4, Math.round(220 / rowLabels.length))
                                } : {}}
                            >
                                {rowLabel}
                            </div>
                            {colLabels.map((_, colIdx) => {
                                const point = lookup.get(`${rowIdx}-${colIdx}`)
                                const value = point?.value ?? 0
                                const bgColor = getCellColor(value)
                                const tooltipText = point
                                    ? tooltipFormatter
                                        ? tooltipFormatter(point)
                                        : `${value}`
                                    : ""

                                return (
                                    <div
                                        key={`cell-${rowIdx}-${colIdx}`}
                                        className={cn(
                                            "group relative cursor-pointer hover:ring-2 hover:ring-white/60 hover:ring-inset",
                                            !fitWidth && "aspect-square"
                                        )}
                                        style={{
                                            backgroundColor: bgColor,
                                            ...(fitWidth ? {
                                                height: rowLabels.length <= 10 ? 24 : Math.max(4, Math.round(220 / rowLabels.length))
                                            } : {})
                                        }}
                                    >

                                        {/* Tooltip CSS-only — segue padrão ChartTooltip */}
                                        {tooltipText && (
                                            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 invisible group-hover:visible scale-95 group-hover:scale-100 transition-transform duration-150">
                                                <div className="bg-white border border-stone-200 rounded-xl shadow-lg shadow-black/5 px-4 py-3 text-sm font-semibold text-[#4E3205] whitespace-nowrap">
                                                    {tooltipText}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </React.Fragment>
                    ))}
                </div>

                {/* Legenda — gradiente contínuo */}
                <div className="flex items-center justify-center gap-2 mt-4">
                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wide">
                        Intensidade
                    </span>
                    <div
                        className="h-3 w-32 rounded-sm"
                        style={{ background: `linear-gradient(to right, ${useScale.join(', ')})` }}
                    />
                    <span className="text-[9px] text-stone-400">0</span>
                    <span className="text-[9px] text-stone-400">→</span>
                    <span className="text-[9px] text-stone-400">{maxValue}</span>
                </div>
            </div>
        </div>
    )
}
