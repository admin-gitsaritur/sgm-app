"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// ============================================================================
// CHART LEGEND — Legenda centralizada para gráficos Recharts
// ============================================================================

interface ChartLegendItem {
    /** Cor do indicador (hex, tailwind ou CSS variable) */
    color: string
    /** Rótulo exibido ao lado do indicador */
    label: string
    /** Opacidade do indicador (default: 1) */
    opacity?: number
}

interface ChartLegendProps {
    /** Itens da legenda */
    items: ChartLegendItem[]
    /** Classes CSS adicionais */
    className?: string
}

/**
 * Legenda padronizada para gráficos Recharts.
 * Centralizada por padrão, com indicadores coloridos e tipografia consistente.
 *
 * @example
 * ```tsx
 * import { ChartLegend } from "@/components/ui/chart-legend"
 *
 * <ChartLegend items={[
 *     { color: '#F37137', label: 'Dias úteis' },
 *     { color: '#FB923C', label: 'Sábado' },
 *     { color: '#FDBA74', label: 'Domingo', opacity: 0.8 },
 * ]} />
 * ```
 */
export function ChartLegend({ items, className }: ChartLegendProps) {
    return (
        <div
            className={cn(
                "flex items-center justify-center gap-4 mt-2 text-[10px] text-stone-400",
                className
            )}
        >
            {items.map((item, index) => (
                <span key={index} className="flex items-center gap-1.5">
                    <span
                        className="w-2.5 h-2.5 rounded-sm shrink-0 inline-block"
                        style={{
                            backgroundColor: item.color,
                            opacity: item.opacity ?? 1,
                        }}
                    />
                    {item.label}
                </span>
            ))}
        </div>
    )
}
