"use client"

import * as React from "react"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================================================
// TYPES
// ============================================================================

type VariationType = "pct" | "pp" | "abs"

interface VariationBadgeProps {
    /** Valor numérico da variação (ex: -9.7, 5.3) */
    value: number
    /** Tipo de variação: 'pct' = percentual, 'pp' = pontos percentuais, 'abs' = absoluto */
    type?: VariationType
    /** Se true, inverte as cores (queda = verde, subida = vermelho). Ex: taxa de cancelamento */
    inverted?: boolean
    /** Tamanho do badge */
    size?: "sm" | "md"
    /** Variante visual: 'text' = apenas texto, 'pill' = com background colorido */
    variant?: "text" | "pill"
    /** Mostrar ícone de seta */
    showIcon?: boolean
    /** Sufixo customizado (ex: 'd' para dias). Sobrescreve o sufixo padrão do type */
    suffix?: string
    /** Classes adicionais */
    className?: string
}

// ============================================================================
// HELPERS
// ============================================================================

const formatSuffix: Record<VariationType, string> = {
    pct: "%",
    pp: "pp",
    abs: "",
}

// ============================================================================
// COMPONENT
// ============================================================================

export function VariationBadge({
    value,
    type = "pct",
    inverted = false,
    size = "sm",
    variant = "text",
    showIcon = true,
    suffix,
    className,
}: VariationBadgeProps) {
    const sfx = suffix !== undefined ? suffix : formatSuffix[type]
    const isPositive = value > 0
    const isNegative = value < 0
    const isNeutral = value === 0 || (Math.abs(value) < 0.05)

    // Determina a cor (invertido troca verde/vermelho)
    const colorClass = isNeutral
        ? "text-stone-400"
        : isPositive
            ? inverted ? "text-red-500" : "text-emerald-600"
            : inverted ? "text-emerald-600" : "text-red-500"

    // Background para variant pill
    const pillClass = variant === "pill"
        ? isNeutral
            ? "bg-stone-100 border-stone-200"
            : isPositive
                ? inverted ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100"
                : inverted ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"
        : ""

    // Ícone
    const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown

    // Formatação do valor
    const formatted = `${isPositive ? "+" : ""}${value.toFixed(1)}${sfx}`

    const sizeClasses = size === "sm"
        ? variant === "pill" ? "text-[10px] gap-0.5 px-1.5 py-0.5" : "text-xs gap-0.5"
        : variant === "pill" ? "text-xs gap-1 px-2.5 py-1" : "text-sm gap-1"

    return (
        <span
            className={cn(
                "inline-flex items-center font-bold whitespace-nowrap",
                colorClass,
                sizeClasses,
                variant === "pill" && "rounded-xl border",
                pillClass,
                className
            )}
        >
            {showIcon && <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />}
            {formatted}
        </span>
    )
}
