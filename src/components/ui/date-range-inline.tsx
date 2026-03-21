"use client"

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar } from "./calendar"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { DateRange } from "react-day-picker"

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
 * Abre um calendário popover com seleção de range.
 * O popover permanece aberto até ambas as datas serem selecionadas.
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
    const [open, setOpen] = React.useState(false)

    // Converter strings YYYY-MM-DD para Date objects
    const fromDate = startDate ? new Date(startDate + "T00:00:00") : undefined
    const toDate = endDate ? new Date(endDate + "T00:00:00") : undefined

    const selected: DateRange | undefined =
        fromDate || toDate ? { from: fromDate, to: toDate } : undefined

    const handleSelect = (range: DateRange | undefined) => {
        if (range?.from) {
            const yyyy = range.from.getFullYear()
            const mm = String(range.from.getMonth() + 1).padStart(2, "0")
            const dd = String(range.from.getDate()).padStart(2, "0")
            onStartChange(`${yyyy}-${mm}-${dd}`)
        } else {
            onStartChange("")
        }

        if (range?.to) {
            const yyyy = range.to.getFullYear()
            const mm = String(range.to.getMonth() + 1).padStart(2, "0")
            const dd = String(range.to.getDate()).padStart(2, "0")
            onEndChange(`${yyyy}-${mm}-${dd}`)
            // Fecha o popover quando ambas as datas estiverem selecionadas
            setOpen(false)
        } else {
            onEndChange("")
        }
    }

    const formatLabel = () => {
        if (fromDate && toDate) {
            return `${format(fromDate, "dd/MM/yyyy", { locale: ptBR })} até ${format(toDate, "dd/MM/yyyy", { locale: ptBR })}`
        }
        if (fromDate) {
            return `${format(fromDate, "dd/MM/yyyy", { locale: ptBR })} até ...`
        }
        return "Selecionar período"
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "flex items-center gap-2 h-12 bg-white border border-stone-200 rounded-xl px-4",
                        "hover:border-stone-300 focus:border-primary focus:ring-2 focus:ring-primary/20",
                        "transition-all text-sm cursor-pointer whitespace-nowrap",
                        open && "border-primary ring-2 ring-primary/20",
                        className
                    )}
                >
                    <CalendarIcon className="h-4 w-4 text-stone-400 shrink-0" />
                    <span className={cn(
                        "font-medium",
                        fromDate ? "text-stone-700" : "text-stone-400"
                    )}>
                        {formatLabel()}
                    </span>
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start" sideOffset={8}>
                <Calendar
                    mode="range"
                    selected={selected}
                    onSelect={handleSelect}
                    numberOfMonths={2}
                    locale={ptBR}
                    defaultMonth={fromDate || new Date()}
                />
            </PopoverContent>
        </Popover>
    )
}
