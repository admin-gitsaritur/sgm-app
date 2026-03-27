import * as React from "react"
import { cn } from "../../lib/utils"

// ============================================================================
// CURRENCY INPUT — Máscara numérica com suporte a decimais configuráveis
// ============================================================================

export interface CurrencyInputProps extends Omit<React.ComponentProps<"input">, "onChange" | "value" | "type" | "size"> {
    /** Valor numérico como string */
    value: string
    /** Callback com valor numérico como string */
    onChange: (value: string) => void
    /** Símbolo prefixo (ex: R$, km, %) */
    symbol?: string
    /** Casas decimais: 2 = moeda (padrão), 0 = inteiro (KM, Unidade) */
    decimals?: number
    /** Mensagem de erro */
    error?: string
    /** Tamanho */
    size?: "sm" | "default" | "lg"
}

/**
 * Input numérico com máscara brasileira.
 * - decimals=2 (padrão): formata como moeda (15.575,00)
 * - decimals=0: formata como inteiro com separador de milhar (15.575)
 *
 * @example
 * ```tsx
 * <CurrencyInput value={form.valor} onChange={v => setForm({...form, valor: v})} />
 * <CurrencyInput value={form.km} onChange={v => setForm({...form, km: v})} symbol="km" decimals={0} />
 * ```
 */
export function CurrencyInput({
    value,
    onChange,
    symbol = "R$",
    decimals = 2,
    error,
    size = "default",
    className,
    ...props
}: CurrencyInputProps) {

    const formatDisplay = (raw: string): string => {
        const digits = raw.replace(/\D/g, "")
        if (!digits) return ""
        const num = parseInt(digits, 10)

        if (decimals === 0) {
            // Inteiro: apenas separador de milhar
            return num.toLocaleString("pt-BR")
        }

        // Moeda: divide por 10^decimals
        const divisor = Math.pow(10, decimals)
        const reais = num / divisor
        return reais.toLocaleString("pt-BR", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        })
    }

    const displayValue = React.useMemo(() => {
        if (!value && value !== "0") return ""
        const num = parseFloat(value)
        if (isNaN(num)) return ""

        if (decimals === 0) {
            // Inteiro: converter direto
            return Math.round(num).toLocaleString("pt-BR")
        }

        // Moeda: converter reais para centavos string para formatar
        const divisor = Math.pow(10, decimals)
        const centavos = Math.round(num * divisor).toString()
        return formatDisplay(centavos)
    }, [value, decimals])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, "")
        if (!raw) {
            onChange("")
            return
        }

        if (decimals === 0) {
            // Inteiro: valor direto
            const num = parseInt(raw, 10)
            onChange(num.toString())
        } else {
            // Moeda: divide por 10^decimals
            const divisor = Math.pow(10, decimals)
            const num = parseInt(raw, 10) / divisor
            onChange(num.toString())
        }
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
                placeholder={decimals === 0 ? "0" : "0,00"}
                {...props}
            />

            {error && (
                <p className="text-xs text-rose-500 font-medium mt-1.5 ml-1">{error}</p>
            )}
        </div>
    )
}
