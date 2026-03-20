"use client"

import * as React from "react"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================================================
// TYPES
// ============================================================================

interface RankingItem {
    /** Nome/label principal */
    label: string
    /** Subtexto (ex: "R$ 180 → R$ 7.680") */
    subtext?: string
    /** Valor exibido à direita (ex: "+4090.8%") */
    value: string
}

type RankingVariant = "success" | "danger"

interface RankingListProps {
    /** Título do card (uppercase no header) */
    title: string
    /** Ícone opcional no header */
    icon?: React.ReactNode
    /** Variante visual: success (verde) ou danger (vermelho) */
    variant?: RankingVariant
    /** Itens do ranking */
    items: RankingItem[]
    /** Texto quando não há dados */
    emptyText?: string
    /** Classes CSS adicionais */
    className?: string
}

// ============================================================================
// CONFIG
// ============================================================================

const VARIANT_CONFIG: Record<RankingVariant, {
    border: string
    headerBg: string
    headerBorder: string
    headerText: string
    valueColor: string
    icon: React.ElementType
}> = {
    success: {
        border: "border-emerald-200",
        headerBg: "bg-emerald-50",
        headerBorder: "border-emerald-200",
        headerText: "text-emerald-700",
        valueColor: "text-emerald-600",
        icon: TrendingUp,
    },
    danger: {
        border: "border-red-200",
        headerBg: "bg-red-50",
        headerBorder: "border-red-200",
        headerText: "text-red-700",
        valueColor: "text-red-600",
        icon: TrendingDown,
    },
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * RankingList — Lista numerada de ranking com header colorido e valores.
 *
 * Baseado no padrão visual de `/pdvs/comportamento`.
 *
 * @example
 * ```tsx
 * <div className="grid grid-cols-2 gap-4">
 *     <RankingList
 *         title="Top 5 — Maior Crescimento"
 *         variant="success"
 *         items={[
 *             { label: "Itaú de Minas", subtext: "R$ 183 → R$ 7.681", value: "+4090.8%" },
 *             { label: "Guaxupé", subtext: "R$ 272 → R$ 9.950", value: "+3549.3%" },
 *         ]}
 *     />
 *     <RankingList
 *         title="Top 5 — Maior Queda"
 *         variant="danger"
 *         items={[
 *             { label: "Agência 88888", subtext: "R$ 37 → R$ 0", value: "-100%" },
 *         ]}
 *     />
 * </div>
 * ```
 */
export function RankingList({
    title,
    icon,
    variant = "success",
    items,
    emptyText = "Sem dados",
    className,
}: RankingListProps) {
    const config = VARIANT_CONFIG[variant]
    const DefaultIcon = config.icon

    return (
        <div className={cn("bg-white border rounded-xl overflow-hidden flex flex-col", config.border, className)}>
            {/* Header */}
            <div className={cn("px-3 py-2 border-b", config.headerBg, config.headerBorder)}>
                <p className={cn(
                    "text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5",
                    config.headerText
                )}>
                    {icon || <DefaultIcon className="h-3.5 w-3.5" />}
                    {title}
                </p>
            </div>

            {/* Items */}
            <div className="divide-y divide-stone-100 flex-1 flex flex-col">
                {items.length > 0 ? (
                    items.map((item, i) => (
                        <div key={i} className="px-3 py-2 flex items-center justify-between text-xs flex-1">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="text-stone-400 font-mono text-[10px] w-4">
                                    {i + 1}.
                                </span>
                                <span className="font-medium text-stone-700 truncate">
                                    {item.label}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                                {item.subtext && (
                                    <span className="text-stone-400 text-[10px]">
                                        {item.subtext}
                                    </span>
                                )}
                                <span className={cn("font-bold min-w-[50px] text-right", config.valueColor)}>
                                    {item.value}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="px-3 py-4 text-xs text-stone-400 text-center">
                        {emptyText}
                    </div>
                )}
            </div>
        </div>
    )
}
