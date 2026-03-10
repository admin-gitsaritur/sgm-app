import * as React from "react"
import { cn } from "../../lib/utils"

// ============================================================================
// CURRENCY INPUT — Máscara de moeda brasileira (R$)
// ============================================================================

export interface CurrencyInputProps extends Omit<React.ComponentProps<"input">, "onChange" | "value" | "type" | "size"> {
    /** Valor em centavos (inteiro) ou reais (float) */
    value: string
    /** Callback com valor numérico (em reais, float) */
    onChange: (value: string) => void
    /** Símbolo monetário */
    symbol?: string
    /** Mensagem de erro */
    error?: string
    /** Tamanho */
    size?: "sm" | "default" | "lg"
}

/**
 * Input com máscara de moeda brasileira (R$).
 * Formata automaticamente com separador de milhar e decimais.
 *
 * @example
 * ```tsx
 * <CurrencyInput value={form.valor} onChange={v => setForm({...form, valor: v})} />
 * ```
 */
export function CurrencyInput({
    value,
    onChange,
    symbol = "R$",
    error,
    size = "default",
    className,
    ...props
}: CurrencyInputProps) {

    const formatDisplay = (raw: string): string => {
        // Remove tudo que não é dígito
        const digits = raw.replace(/\D/g, "")
        if (!digits) return ""
        const num = parseInt(digits, 10)
        // Divide por 100 para centavos -> reais
        const reais = num / 100
        return reais.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
    }

    const displayValue = React.useMemo(() => {
        if (!value && value !== "0") return ""
        // Se já é um número raw, converter para display
        const num = parseFloat(value)
        if (isNaN(num)) return ""
        // Converter reais para centavos string para formatar
        const centavos = Math.round(num * 100).toString()
        return formatDisplay(centavos)
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, "")
        if (!raw) {
            onChange("")
            return
        }
        const num = parseInt(raw, 10) / 100
        onChange(num.toString())
    }

    const sizeClasses = {
        sm: "h-9 text-xs",
        default: "h-11 text-sm",
        lg: "h-12 text-base",
    }

    return (
        <div className="relative w-full">
            {/* Símbolo */}
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-semibold pointer-events-none">
                {symbol}
            </div>

            <input
                inputMode="numeric"
                data-slot="currency-input"
                aria-invalid={!!error}
                className={cn(
                    "peer w-full rounded-xl border bg-white",
                    "font-medium text-brown",
                    "placeholder:text-stone-300",
                    "pl-10 pr-4",
                    sizeClasses[size],
                    "transition-all duration-200",
                    "border-stone-200 hover:border-stone-300",
                    "focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15",
                    error && [
                        "border-rose-300 bg-rose-50/30",
                        "hover:border-rose-400",
                        "focus:border-rose-500 focus:ring-rose-500/15",
                    ],
                    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-stone-50",
                    className
                )}
                value={displayValue}
                onChange={handleChange}
                placeholder="0,00"
                {...props}
            />

            {error && (
                <p className="text-xs text-rose-500 font-medium mt-1.5 ml-1">{error}</p>
            )}
        </div>
    )
}
