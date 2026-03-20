"use client"

import * as React from "react"
import { Check, ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface FilterOption {
    value: string
    label: string
}

interface MultiSelectFilterProps {
    label: string
    options: FilterOption[]
    selected: string[]
    onChange: (selected: string[]) => void
    placeholder?: string
    className?: string
}

export function MultiSelectFilter({
    label,
    options,
    selected,
    onChange,
    placeholder = "Todos",
    className
}: MultiSelectFilterProps) {
    const [open, setOpen] = React.useState(false)

    const handleToggle = (value: string) => {
        if (selected.includes(value)) {
            onChange(selected.filter(v => v !== value))
        } else {
            onChange([...selected, value])
        }
    }

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation()
        onChange([])
    }

    const handleSelectAll = () => {
        if (selected.length === options.length) {
            onChange([])
        } else {
            onChange(options.map(o => o.value))
        }
    }

    const displayText = selected.length > 0
        ? selected.length === 1
            ? options.find(o => o.value === selected[0])?.label || selected[0]
            : `${selected.length} selecionados`
        : placeholder

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "!h-12 min-w-[140px] justify-between !rounded-[12px] border-stone-200 bg-white font-medium",
                        "hover:bg-stone-50 hover:border-stone-300",
                        "data-[state=open]:border-[#F37137] data-[state=open]:ring-2 data-[state=open]:ring-[#F37137]/20",
                        selected.length > 0 && "border-[#F37137]/50 bg-[#F37137]/5",
                        className
                    )}
                >
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-stone-500 font-normal">{label}:</span>
                        <span className={cn(
                            "text-sm",
                            selected.length > 0 ? "text-[#4E3205] font-semibold" : "text-stone-600"
                        )}>
                            {displayText}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        {selected.length > 0 && (
                            <span
                                role="button"
                                tabIndex={0}
                                onClick={handleClear}
                                onKeyDown={(e) => e.key === 'Enter' && handleClear(e as unknown as React.MouseEvent)}
                                className="p-0.5 hover:bg-stone-200 rounded-full transition-colors cursor-pointer"
                            >
                                <X className="h-3 w-3 text-stone-500" />
                            </span>
                        )}
                        <ChevronDown className={cn(
                            "h-4 w-4 text-stone-400 transition-transform duration-200",
                            open && "rotate-180"
                        )} />
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0 rounded-xl shadow-lg border-stone-200" align="start">
                {options.length === 0 ? (
                    <div className="p-4 text-center text-xs text-stone-400">
                        Nenhum item disponível
                    </div>
                ) : (
                    <>
                        <div className="p-2 border-b border-stone-100">
                            <button
                                onClick={handleSelectAll}
                                className="w-full text-left px-3 py-2 text-xs font-medium text-stone-600 hover:bg-stone-50 rounded-lg transition-colors"
                            >
                                {selected.length === options.length ? "Desmarcar todos" : "Selecionar todos"}
                            </button>
                        </div>
                        <div className="max-h-[240px] overflow-y-auto p-2 custom-scroll flex flex-col gap-1">
                            {options.map((option) => {
                                const isSelected = selected.includes(option.value)
                                return (
                                    <button
                                        key={option.value}
                                        onClick={() => handleToggle(option.value)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                                            "hover:bg-stone-50",
                                            isSelected && "bg-[#F37137]/10"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
                                            isSelected
                                                ? "bg-[#F37137] border-[#F37137]"
                                                : "border-stone-300 bg-white"
                                        )}>
                                            {isSelected && <Check className="h-3 w-3 text-white" />}
                                        </div>
                                        <span className={cn(
                                            "font-medium whitespace-nowrap",
                                            isSelected ? "text-[#4E3205]" : "text-stone-700"
                                        )}>
                                            {option.label}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </>
                )}
            </PopoverContent>
        </Popover>
    )
}
