"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// ============================================================================
// TIPOS
// ============================================================================

type ProgressBarHeight = "xs" | "sm" | "md" | "lg"

interface ProgressBarProps {
    /** Valor (0-100) */
    value: number
    /** Classe de cor do preenchimento (ex: 'bg-emerald-500', 'bg-red-500') */
    color?: string
    /** Classe de cor do fundo (track) */
    bgColor?: string
    /** Altura da barra */
    height?: ProgressBarHeight
    /** Animação de transição */
    animated?: boolean
    /** Label à esquerda da barra */
    label?: string
    /** Valor formatado à direita da barra */
    valueLabel?: string
    /** Conteúdo sobreposto dentro da barra (ex: contagem) */
    overlay?: React.ReactNode
    /** Classes CSS adicionais no container mais externo */
    className?: string
}

// ============================================================================
// MAPA DE ALTURAS
// ============================================================================

const HEIGHT_MAP: Record<ProgressBarHeight, string> = {
    xs: "h-1",
    sm: "h-1.5",
    md: "h-2",
    lg: "h-4",
}

// ============================================================================
// COMPONENTE
// ============================================================================

/**
 * ProgressBar reutilizável com suporte a cores variáveis.
 *
 * @example
 * ```tsx
 * // Simples
 * <ProgressBar value={75} color="bg-emerald-500" />
 *
 * // Com label e valor
 * <ProgressBar value={42} color="bg-amber-500" label="CPF Preenchido" valueLabel="42%" />
 *
 * // Barra maior com overlay
 * <ProgressBar value={60} color="bg-red-500" height="lg" overlay={<span className="text-xs">60</span>} />
 *
 * // Customizada
 * <ProgressBar value={80} color="bg-blue-500" bgColor="bg-blue-100" height="md" animated />
 * ```
 */
export function ProgressBar({
    value,
    color = "bg-primary",
    bgColor = "bg-stone-100",
    height = "md",
    animated = true,
    label,
    valueLabel,
    overlay,
    className,
}: ProgressBarProps) {
    const clampedValue = Math.max(0, Math.min(value, 100))
    const heightClass = HEIGHT_MAP[height]

    return (
        <div className={cn("w-full", className)}>
            {/* Labels acima da barra */}
            {(label || valueLabel) && (
                <div className="flex items-center justify-between mb-1">
                    {label && <span className="text-sm text-stone-600">{label}</span>}
                    {valueLabel && <span className="text-sm font-bold text-stone-800">{valueLabel}</span>}
                </div>
            )}

            {/* Track */}
            <div className={cn("w-full rounded-full overflow-hidden relative", bgColor, heightClass)}>
                {/* Fill */}
                <div
                    className={cn(
                        "rounded-full",
                        heightClass,
                        color,
                        animated && "transition-all duration-500"
                    )}
                    style={{ width: `${clampedValue}%` }}
                />

                {/* Overlay (conteúdo dentro da barra) */}
                {overlay && (
                    <span className="absolute right-2 top-0 bottom-0 flex items-center text-stone-600">
                        {overlay}
                    </span>
                )}
            </div>
        </div>
    )
}
