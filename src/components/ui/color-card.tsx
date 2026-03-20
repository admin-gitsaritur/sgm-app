"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// ============================================================================
// COLOR CARD — KPI Card com 20 cores cítricas e alegres
// ============================================================================

/**
 * Variantes de cor do ColorCard.
 * 20 cores claras, alegres e cítricas para diversos usos.
 * Cada variante define: borda lateral, fundo, cor do texto do valor.
 */
export type ColorCardVariant =
    | 'orange'      // Laranja vibrante
    | 'tangerine'   // Tangerina
    | 'amber'       // Âmbar dourado
    | 'yellow'      // Amarelo sol
    | 'lime'        // Lima
    | 'green'       // Verde fresco
    | 'emerald'     // Esmeralda
    | 'teal'        // Verde-azulado
    | 'cyan'        // Ciano
    | 'sky'         // Azul céu
    | 'blue'        // Azul
    | 'indigo'      // Índigo
    | 'violet'      // Violeta
    | 'purple'      // Roxo
    | 'fuchsia'     // Fúcsia
    | 'pink'        // Rosa
    | 'rose'        // Rosé
    | 'coral'       // Coral
    | 'peach'       // Pêssego
    | 'mint'        // Menta

const COLOR_MAP: Record<ColorCardVariant, {
    borderAll: string
    bg: string
    text: string
}> = {
    orange: { borderAll: 'border-orange-200', bg: 'bg-orange-50/50', text: 'text-orange-600' },
    tangerine: { borderAll: 'border-orange-200', bg: 'bg-orange-50/60', text: 'text-orange-700' },
    amber: { borderAll: 'border-amber-200', bg: 'bg-amber-50/50', text: 'text-amber-700' },
    yellow: { borderAll: 'border-yellow-200', bg: 'bg-yellow-50/50', text: 'text-yellow-700' },
    lime: { borderAll: 'border-lime-200', bg: 'bg-lime-50/50', text: 'text-lime-700' },
    green: { borderAll: 'border-green-200', bg: 'bg-green-50/50', text: 'text-green-700' },
    emerald: { borderAll: 'border-emerald-200', bg: 'bg-emerald-50/50', text: 'text-emerald-700' },
    teal: { borderAll: 'border-teal-200', bg: 'bg-teal-50/50', text: 'text-teal-700' },
    cyan: { borderAll: 'border-cyan-200', bg: 'bg-cyan-50/50', text: 'text-cyan-700' },
    sky: { borderAll: 'border-sky-200', bg: 'bg-sky-50/50', text: 'text-sky-700' },
    blue: { borderAll: 'border-blue-200', bg: 'bg-blue-50/50', text: 'text-blue-700' },
    indigo: { borderAll: 'border-indigo-200', bg: 'bg-indigo-50/50', text: 'text-indigo-700' },
    violet: { borderAll: 'border-violet-200', bg: 'bg-violet-50/50', text: 'text-violet-700' },
    purple: { borderAll: 'border-purple-200', bg: 'bg-purple-50/50', text: 'text-purple-700' },
    fuchsia: { borderAll: 'border-fuchsia-200', bg: 'bg-fuchsia-50/50', text: 'text-fuchsia-700' },
    pink: { borderAll: 'border-pink-200', bg: 'bg-pink-50/50', text: 'text-pink-700' },
    rose: { borderAll: 'border-rose-200', bg: 'bg-rose-50/50', text: 'text-rose-700' },
    coral: { borderAll: 'border-red-200', bg: 'bg-red-50/40', text: 'text-red-500' },
    peach: { borderAll: 'border-orange-200', bg: 'bg-orange-50/40', text: 'text-orange-500' },
    mint: { borderAll: 'border-emerald-200', bg: 'bg-emerald-50/40', text: 'text-emerald-600' },
}

// ============================================================================
// Component Props
// ============================================================================

interface ColorCardProps {
    /** Título do KPI (uppercase automático) */
    title: string
    /** Valor principal (string ou ReactNode) */
    value: React.ReactNode
    /** Texto auxiliar abaixo do valor */
    subtext?: React.ReactNode
    /** Ícone opcional exibido ao lado do título */
    icon?: React.ReactNode
    /** Variante de cor (20 opções) */
    color?: ColorCardVariant
    /** Classes CSS adicionais */
    className?: string
    /** Callback de clique (torna clicável com hover) */
    onClick?: () => void
}

// ============================================================================
// Component
// ============================================================================

/**
 * Card de KPI colorido com borda lateral.
 * 20 variantes cítricas/claras/alegres para uso em dashboards.
 * 
 * Estilo: fundo suave + borda lateral grossa colorida (border-l-4)
 * 
 * @example
 * ```tsx
 * <ColorCard
 *     color="orange"
 *     title="GMV Previsto"
 *     value="R$ 1.518.693,58"
 * />
 * 
 * <ColorCard
 *     color="emerald"
 *     title="Bilhetes Futuros"
 *     value="16.693"
 *     subtext="5.8% do total vendido"
 * />
 * 
 * <ColorCard
 *     color="amber"
 *     title="Pico de Viagens"
 *     value="qua., 18 de fev."
 *     subtext="2.104 bilhetes • R$ 246.139,40"
 *     icon={<CalendarDays className="h-3 w-3" />}
 * />
 * 
 * <ColorCard
 *     color="purple"
 *     title="Rota com Mais Vendas"
 *     value="MCL001 → BHZ023"
 *     subtext="815 bilhetes • R$ 120.816,59"
 *     icon={<Route className="h-3 w-3" />}
 * />
 * ```
 */
export function ColorCard({
    title,
    value,
    subtext,
    icon,
    color = 'orange',
    className,
    onClick,
}: ColorCardProps) {
    const colors = COLOR_MAP[color]
    const isClickable = !!onClick

    const Component = isClickable ? 'button' : 'div'

    return (
        <Component
            onClick={onClick}
            className={cn(
                // Base
                "p-4 rounded-2xl border text-left w-full",
                // Colors
                colors.borderAll,
                colors.bg,
                // Clickable
                isClickable && "cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.99]",
                className
            )}
        >
            {/* Title */}
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1 flex items-center gap-1">
                {icon && <span className={cn("shrink-0 [&>svg]:h-3 [&>svg]:w-3", colors.text)}>{icon}</span>}
                {title}
            </p>

            {/* Value */}
            <p className={cn("text-xl font-bold truncate", colors.text)}>
                {value}
            </p>

            {/* Subtext */}
            {subtext && (
                <p className="text-xs text-stone-400 mt-0.5">
                    {subtext}
                </p>
            )}
        </Component>
    )
}

// ============================================================================
// Exports
// ============================================================================

/** Lista de todas as variantes disponíveis */
export const COLOR_CARD_VARIANTS: ColorCardVariant[] = [
    'orange', 'tangerine', 'amber', 'yellow', 'lime',
    'green', 'emerald', 'teal', 'cyan', 'sky',
    'blue', 'indigo', 'violet', 'purple', 'fuchsia',
    'pink', 'rose', 'coral', 'peach', 'mint',
]
