"use client"

import * as React from "react"
import { Info } from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================================================
// TYPES
// ============================================================================

export interface BreakdownItem {
    /** Label (lado esquerdo) */
    label: string
    /** Valor (lado direito) — string ou ReactNode para formatação custom */
    value: React.ReactNode
    /** Cor do valor: positive (verde), negative (vermelho), neutral (stone) */
    color?: "positive" | "negative" | "neutral"
}

interface BreakdownListProps {
    /** Título do bloco (uppercase automático) */
    title?: string
    /** Ícone ao lado do título (default: Info) */
    icon?: React.ReactNode
    /** Itens key-value */
    items: BreakdownItem[]
    /** Número de colunas (1 ou 2) */
    columns?: 1 | 2
    /** Classes CSS adicionais */
    className?: string
}

// ============================================================================
// HELPERS
// ============================================================================

const VALUE_COLORS: Record<string, string> = {
    positive: "text-emerald-600",
    negative: "text-red-600",
    neutral: "text-stone-700",
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * BreakdownList — Bloco de detalhamento com pares key-value.
 * 
 * Útil para breakdowns analíticos, resumos de cálculos e detalhes compactos.
 * 
 * Estilo: fundo stone-50, borda stone-300, header com ícone uppercase,
 * grid de 1 ou 2 colunas com labels e valores alinhados.
 * 
 * @example
 * ```tsx
 * <BreakdownList
 *     title="Breakdown do Cálculo"
 *     columns={2}
 *     items={[
 *         { label: "Crescimento Real (YoY)", value: "+19.9%", color: "positive" },
 *         { label: "Diferença Absoluta", value: "+R$ 2.711.648,69", color: "positive" },
 *         { label: "Gap p/ Meta", value: "+R$ 2.029.713,10", color: "positive" },
 *         { label: "Fat. Médio/Dia", value: "R$ 527.756,62", color: "neutral" },
 *         { label: "Ticket Médio", value: "R$ 56,71", color: "neutral" },
 *         { label: "Dias no Mês", value: "31 dias", color: "neutral" },
 *     ]}
 * />
 * ```
 */
export function BreakdownList({
    title = "Breakdown",
    icon,
    items,
    columns = 2,
    className,
}: BreakdownListProps) {
    return (
        <div className={cn(
            "bg-stone-50 border border-stone-300 rounded-xl p-3",
            className
        )}>
            {/* Header */}
            <div className="flex items-center gap-1.5 mb-2">
                {icon || <Info className="h-3.5 w-3.5 text-stone-400" />}
                <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                    {title}
                </p>
            </div>

            {/* Items */}
            <div className={cn(
                "gap-x-6 gap-y-1.5 text-xs",
                columns === 2 ? "grid grid-cols-2" : "flex flex-col"
            )}>
                {items.map((item, i) => (
                    <div key={i} className="flex justify-between">
                        <span className="text-stone-500">{item.label}</span>
                        <span className={cn(
                            "font-semibold",
                            VALUE_COLORS[item.color || "neutral"]
                        )}>
                            {item.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
