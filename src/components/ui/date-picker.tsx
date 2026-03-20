"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================================================
// DATE PICKER
// ============================================================================

interface DatePickerProps {
    /** Data inicial selecionada */
    startDate?: Date | null
    /** Data final selecionada (para range) */
    endDate?: Date | null
    /** Callback quando a seleção mudar */
    onChange?: (start: Date | null, end: Date | null) => void
    /** Modo de seleção */
    mode?: "single" | "range"
    /** Classes adicionais */
    className?: string
}

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"]
const MONTHS = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

/**
 * Seletor de data estilizado Saritur CX.
 * 
 * Suporta seleção única ou range de datas.
 * 
 * @example
 * ```tsx
 * const [start, setStart] = useState<Date | null>(null)
 * const [end, setEnd] = useState<Date | null>(null)
 * 
 * <DatePicker
 *     startDate={start}
 *     endDate={end}
 *     mode="range"
 *     onChange={(s, e) => { setStart(s); setEnd(e); }}
 * />
 * ```
 */
export function DatePicker({
    startDate,
    endDate,
    onChange,
    mode = "range",
    className,
}: DatePickerProps) {
    const [viewDate, setViewDate] = React.useState(new Date())
    const [selection, setSelection] = React.useState<{ start: number | null; end: number | null }>({
        start: startDate?.getDate() ?? null,
        end: endDate?.getDate() ?? null,
    })

    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayOfMonth = new Date(year, month, 1).getDay()
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

    // Dias do mês anterior para preencher
    const prevMonth = new Date(year, month, 0)
    const prevMonthDays = Array.from(
        { length: firstDayOfMonth },
        (_, i) => prevMonth.getDate() - firstDayOfMonth + i + 1
    )

    const handleDayClick = (day: number) => {
        if (mode === "single") {
            setSelection({ start: day, end: null })
            onChange?.(new Date(year, month, day), null)
            return
        }

        // Range mode
        if (!selection.start || (selection.start && selection.end)) {
            setSelection({ start: day, end: null })
        } else {
            const start = Math.min(selection.start, day)
            const end = Math.max(selection.start, day)
            setSelection({ start, end })
            onChange?.(new Date(year, month, start), new Date(year, month, end))
        }
    }

    const getDayClass = (day: number) => {
        const isStart = day === selection.start
        const isEnd = selection.end && day === selection.end
        const isInRange = selection.end && selection.start && day > selection.start && day < selection.end

        return cn(
            // Base
            "w-9 h-9 flex items-center justify-center text-sm rounded-[10px] cursor-pointer transition-all",
            "text-stone-600 hover:bg-stone-50 hover:text-primary hover:font-semibold",
            // Active (start/end)
            (isStart || isEnd) && [
                "bg-primary text-white font-bold",
                "shadow-[--shadow-glow-primary]",
                "hover:bg-primary hover:text-white",
            ],
            // Range
            isInRange && [
                "bg-primary/10 text-primary rounded-none",
            ],
            // Range start/end corners
            isStart && selection.end && "rounded-r-none",
            isEnd && "rounded-l-none",
        )
    }

    const goToPrevMonth = () => {
        setViewDate(new Date(year, month - 1, 1))
    }

    const goToNextMonth = () => {
        setViewDate(new Date(year, month + 1, 1))
    }

    const getSelectionText = () => {
        if (!selection.start) return "Selecione"
        const startText = `${selection.start} ${MONTHS[month].slice(0, 3).toLowerCase()}`
        if (!selection.end) return startText
        return `${startText} - ${selection.end} ${MONTHS[month].slice(0, 3).toLowerCase()}`
    }

    return (
        <div className={cn(
            "bg-white border border-stone-200 rounded-2xl p-6 soft-shadow w-full max-w-sm select-none",
            className
        )}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={goToPrevMonth}
                    className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold text-brown">
                    {MONTHS[month]} {year}
                </span>
                <button
                    onClick={goToNextMonth}
                    className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400 transition-colors"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-y-2 mb-2">
                {WEEKDAYS.map((d, i) => (
                    <span
                        key={`header-${i}`}
                        className="text-center text-[10px] font-bold text-stone-400 uppercase"
                    >
                        {d}
                    </span>
                ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-y-1">
                {/* Previous month days */}
                {prevMonthDays.map((d) => (
                    <span
                        key={`prev-${d}`}
                        className="w-9 h-9 flex items-center justify-center text-sm text-stone-300 pointer-events-none"
                    >
                        {d}
                    </span>
                ))}

                {/* Current month days */}
                {days.map((d) => (
                    <div
                        key={`curr-${d}`}
                        className={getDayClass(d)}
                        onClick={() => handleDayClick(d)}
                    >
                        {d}
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-stone-100 flex justify-between items-center">
                <span className="text-xs text-stone-500 font-medium">
                    {getSelectionText()}
                </span>
                <button className="text-xs font-bold text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors">
                    Aplicar
                </button>
            </div>
        </div>
    )
}
