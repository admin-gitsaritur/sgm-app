"use client"

import * as React from "react"
import { CheckCircle2, CircleMinus, XCircle, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================================================
// TYPES
// ============================================================================

type StatusType = "success" | "warning" | "error" | "neutral"

interface StatusIconProps {
    /** Status semântico */
    status: StatusType
    /** Tamanho do ícone */
    size?: "sm" | "md"
    /** Classes CSS adicionais */
    className?: string
    /** Mostrar label junto ao ícone */
    label?: string
}

// ============================================================================
// CONFIG
// ============================================================================

const STATUS_CONFIG: Record<StatusType, {
    icon: React.ElementType
    color: string
}> = {
    success: { icon: CheckCircle2, color: "text-emerald-500" },
    warning: { icon: CircleMinus, color: "text-amber-500" },
    error: { icon: XCircle, color: "text-red-500" },
    neutral: { icon: Minus, color: "text-stone-400" },
}

const SIZE_MAP = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * StatusIcon — Ícone semântico de status (sucesso, atenção, erro, neutro).
 *
 * @example
 * ```tsx
 * <StatusIcon status="success" />
 * <StatusIcon status="warning" label="Parcial" />
 * <StatusIcon status="error" size="md" />
 * ```
 */
export function StatusIcon({
    status,
    size = "sm",
    className,
    label,
}: StatusIconProps) {
    const config = STATUS_CONFIG[status]
    const Icon = config.icon

    return (
        <span className={cn("inline-flex items-center gap-1", className)}>
            <Icon className={cn(SIZE_MAP[size], config.color)} />
            {label && (
                <span className={cn("text-xs font-medium", config.color)}>
                    {label}
                </span>
            )}
        </span>
    )
}
