"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// ============================================================================
// DATE QUICK SELECTOR
// ============================================================================

interface QuickDateOption {
    /** Label exibido no botão */
    label: string
    /** ID único da opção */
    value: string
}

interface DateQuickSelectorProps {
    /** Lista de opções */
    options: QuickDateOption[]
    /** Valor da opção ativa (match por value) */
    value: string
    /** Callback de mudança */
    onChange: (value: string) => void
    /** Classes adicionais no container */
    className?: string
}

/**
 * Seletor rápido estilizado — pill group com indicador ativo.
 * 
 * @example
 * ```tsx
 * const [periodo, setPeriodo] = useState("mes-passado")
 * 
 * <DateQuickSelector
 *     options={[
 *         { label: "Mês Passado", value: "mes-passado" },
 *         { label: "Mês Atual", value: "mes-atual" },
 *         { label: "Últ. 7 dias", value: "7d" },
 *         { label: "Hoje", value: "hoje" },
 *     ]}
 *     value={periodo}
 *     onChange={setPeriodo}
 * />
 * ```
 */
export function DateQuickSelector({
    options,
    value,
    onChange,
    className,
}: DateQuickSelectorProps) {
    return (
        <div
            className={cn(
                "inline-flex bg-stone-100 p-1.5 rounded-xl gap-1.5",
                className
            )}
        >
            {options.map((opt) => {
                const isActive = value === opt.value
                return (
                    <button
                        key={opt.value}
                        onClick={() => onChange(opt.value)}
                        className={cn(
                            "px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-200",
                            isActive
                                ? "bg-white text-primary shadow-sm"
                                : "text-stone-500 hover:text-stone-700 hover:bg-stone-200/50"
                        )}
                    >
                        {opt.label}
                    </button>
                )
            })}
        </div>
    )
}
