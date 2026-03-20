"use client"

import * as React from "react"
import { useState } from "react"
import { cn } from "@/lib/utils"

// ============================================================================
// TYPES
// ============================================================================

interface StackedSegment {
    /** Valor percentual (0-100) do segmento */
    value: number
    /** Classe Tailwind de cor (ex: 'bg-emerald-500') */
    color: string
    /** Label opcional do segmento */
    label?: string
    /** Conteúdo do tooltip ao passar o mouse neste segmento */
    tooltipContent?: React.ReactNode
}

type StackedHeight = "xs" | "sm" | "md" | "lg"

interface StackedProgressBarProps {
    /** Array de segmentos da barra */
    segments: StackedSegment[]
    /** Altura da barra */
    height?: StackedHeight
    /** Cor de fundo do track */
    bgColor?: string
    /** Animação de transição */
    animated?: boolean
    /** Mostrar legenda abaixo da barra */
    showLegend?: boolean
    /** Classes CSS adicionais no container */
    className?: string
}

// ============================================================================
// HELPERS
// ============================================================================

const HEIGHT_MAP: Record<StackedHeight, string> = {
    xs: "h-1",
    sm: "h-1.5",
    md: "h-2",
    lg: "h-4",
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * StackedProgressBar — Barra de progresso com múltiplos segmentos coloridos.
 * Cada segmento pode ter seu próprio tooltip via `tooltipContent`.
 *
 * @example
 * ```tsx
 * <StackedProgressBar
 *     segments={[
 *         { value: 40, color: "bg-emerald-500", label: "Excelência", tooltipContent: "40% Excelência" },
 *         { value: 30, color: "bg-blue-500", label: "Qualidade", tooltipContent: "30% Qualidade" },
 *     ]}
 *     height="lg"
 *     showLegend
 * />
 * ```
 */
export function StackedProgressBar({
    segments,
    height = "md",
    bgColor = "bg-stone-100",
    animated = true,
    showLegend = false,
    className,
}: StackedProgressBarProps) {
    const heightClass = HEIGHT_MAP[height]
    const [activeTooltip, setActiveTooltip] = useState<number | null>(null)

    // Normalizar valores para que somem no máximo 100
    const total = segments.reduce((acc, s) => acc + s.value, 0)
    const normalizedSegments = total > 100
        ? segments.map(s => ({ ...s, value: (s.value / total) * 100 }))
        : segments

    return (
        <div className={cn("w-full relative", className)}>
            {/* Track */}
            <div className={cn("w-full rounded-full overflow-hidden flex", bgColor, heightClass)}>
                {normalizedSegments.map((segment, index) => (
                    <div
                        key={index}
                        className={cn(
                            heightClass,
                            segment.color,
                            animated && "transition-all duration-500",
                            index === 0 && "rounded-l-full",
                            index === normalizedSegments.length - 1 && "rounded-r-full",
                            segment.tooltipContent && "cursor-pointer",
                        )}
                        style={{ width: `${Math.max(segment.value, 0)}%` }}
                        onMouseEnter={() => segment.tooltipContent && setActiveTooltip(index)}
                        onMouseLeave={() => setActiveTooltip(null)}
                    />
                ))}
            </div>

            {/* Per-segment tooltip */}
            {activeTooltip !== null && normalizedSegments[activeTooltip]?.tooltipContent && (
                <div
                    className="absolute z-50 mt-2 px-3 py-2 bg-white rounded-xl shadow-lg border border-stone-100 text-xs pointer-events-none"
                    style={{
                        left: `${normalizedSegments.slice(0, activeTooltip).reduce((sum, s) => sum + s.value, 0) + normalizedSegments[activeTooltip].value / 2}%`,
                        transform: 'translateX(-50%)',
                    }}
                >
                    {normalizedSegments[activeTooltip].tooltipContent}
                </div>
            )}

            {/* Legend */}
            {showLegend && (
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                    {normalizedSegments.map((segment, index) => (
                        segment.label && (
                            <div key={index} className="flex items-center gap-1.5 text-xs text-stone-600">
                                <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", segment.color)} />
                                <span>{segment.label}</span>
                                <span className="font-bold text-stone-800">{segment.value.toFixed(0)}%</span>
                            </div>
                        )
                    ))}
                </div>
            )}
        </div>
    )
}
