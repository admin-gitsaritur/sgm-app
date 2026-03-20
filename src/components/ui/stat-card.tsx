"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// ============================================================================
// TYPES
// ============================================================================

type StatCardColor = "blue" | "green" | "emerald" | "amber" | "red" | "orange" | "purple" | "teal" | "cyan" | "sky" | "stone"

interface StatCardProps {
    /** Título do card (uppercase automático) */
    title: string
    /** Valor principal */
    value: React.ReactNode
    /** Ícone opcional */
    icon?: React.ReactNode
    /** Variante de cor */
    color?: StatCardColor
    /** Conteúdo adicional no rodapé (badge, subtexto, etc.) */
    footer?: React.ReactNode
    /** Classes CSS adicionais */
    className?: string
    /** Callback de clique */
    onClick?: () => void
}

// ============================================================================
// CONFIG
// ============================================================================

const COLOR_MAP: Record<StatCardColor, {
    bg: string
    border: string
    text: string
    icon: string
}> = {
    blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icon: "text-blue-500" },
    green: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", icon: "text-green-500" },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", icon: "text-emerald-500" },
    amber: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: "text-amber-500" },
    red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: "text-red-500" },
    orange: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", icon: "text-orange-500" },
    purple: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", icon: "text-purple-500" },
    teal: { bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-700", icon: "text-teal-500" },
    cyan: { bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-700", icon: "text-cyan-500" },
    sky: { bg: "bg-sky-50", border: "border-sky-200", text: "text-sky-700", icon: "text-sky-500" },
    stone: { bg: "bg-stone-50", border: "border-stone-200", text: "text-stone-700", icon: "text-stone-500" },
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * StatCard — Card de KPI com fundo sólido colorido.
 *
 * Diferente do ColorCard (borda lateral), este usa fundo cheio + borda
 * para um visual mais forte e compacto.
 *
 * @example
 * ```tsx
 * <StatCard
 *     title="Score Médio"
 *     value="78.5"
 *     color="blue"
 *     icon={<Activity className="h-5 w-5" />}
 *     footer={<span className="text-xs text-stone-500">+2.3 vs anterior</span>}
 * />
 *
 * <StatCard
 *     title="PDVs Críticos"
 *     value="12"
 *     color="red"
 *     icon={<AlertTriangle className="h-5 w-5" />}
 *     footer={<Tag color="red" size="sm">Abaixo de 40</Tag>}
 * />
 * ```
 */
export function StatCard({
    title,
    value,
    icon,
    color = "blue",
    footer,
    className,
    onClick,
}: StatCardProps) {
    const colors = COLOR_MAP[color]
    const isClickable = !!onClick
    const Component = isClickable ? "button" : "div"

    return (
        <Component
            onClick={onClick}
            className={cn(
                "p-4 rounded-2xl border text-left w-full",
                colors.bg,
                colors.border,
                isClickable && "cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.99]",
                className
            )}
        >
            {/* Header: icon + title */}
            <div className="flex items-center justify-between mb-2">
                <p className={cn("text-xs font-bold uppercase tracking-wider opacity-70", colors.text)}>
                    {title}
                </p>
                {icon && (
                    <span className={cn("shrink-0 [&>svg]:h-5 [&>svg]:w-5", colors.icon)}>
                        {icon}
                    </span>
                )}
            </div>

            {/* Value */}
            <p className={cn("text-2xl font-bold", colors.text)}>
                {value}
            </p>

            {/* Footer */}
            {footer && (
                <div className="mt-2">
                    {footer}
                </div>
            )}
        </Component>
    )
}
