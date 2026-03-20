"use client"

import * as React from "react"
import { Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================================================
// DATE RANGE INLINE
// ============================================================================

interface DateRangeInlineProps {
    /** Data de início (YYYY-MM-DD) */
    startDate: string
    /** Data de fim (YYYY-MM-DD) */
    endDate: string
    /** Callback quando data início muda */
    onStartChange: (date: string) => void
    /** Callback quando data fim muda */
    onEndChange: (date: string) => void
    /** Classes adicionais */
    className?: string
}

/**
 * Seletor inline compacto de intervalo de datas — ideal para toolbars.
 * Usa inputs nativos `type="date"` com estilo Saritur CX.
 * 
 * @example
 * ```tsx
 * <DateRangeInline
 *     startDate={dataInicio}
 *     endDate={dataFim}
 *     onStartChange={setDataInicio}
 *     onEndChange={setDataFim}
 * />
 * ```
 */
export function DateRangeInline({
    startDate,
    endDate,
    onStartChange,
    onEndChange,
    className,
}: DateRangeInlineProps) {
    return (
        <div
            className={cn(
                "flex items-center gap-2 h-12 bg-white border border-stone-200 rounded-xl px-4",
                "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
                "transition-all",
                className
            )}
        >
            <Calendar className="h-4 w-4 text-stone-400 shrink-0" />
            <input
                type="date"
                value={startDate}
                onChange={(e) => onStartChange(e.target.value)}
                className="text-sm font-medium text-stone-700 bg-transparent outline-none border-none w-[130px]"
            />
            <span className="text-stone-400 text-sm shrink-0">até</span>
            <input
                type="date"
                value={endDate}
                onChange={(e) => onEndChange(e.target.value)}
                className="text-sm font-medium text-stone-700 bg-transparent outline-none border-none w-[130px]"
            />
        </div>
    )
}
