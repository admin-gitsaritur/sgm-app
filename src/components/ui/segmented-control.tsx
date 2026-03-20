"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

// ============================================================================
// SEGMENTED CONTROL — Estilo Tab com Underline/Pill animado
// ============================================================================

interface SegmentOption {
    /** ID único da opção */
    id: string
    /** Label da opção */
    label: string
    /** Ícone opcional (Lucide) */
    icon?: LucideIcon
}

interface SegmentedControlProps {
    /** Lista de opções */
    options: SegmentOption[]
    /** Opção ativa */
    value: string
    /** Callback de mudança */
    onChange: (value: string) => void
    /** Variante visual: 'underline' = tab com underline, 'pill' = fundo com pill deslizante */
    variant?: "underline" | "pill"
    /** Classes adicionais */
    className?: string
}

/**
 * Controle segmentado com animação deslizante.
 * 
 * - `variant="underline"` (default): underline laranja animado abaixo do tab ativo
 * - `variant="pill"`: fundo pill deslizante com texto laranja + bold no ativo
 * 
 * @example
 * ```tsx
 * import { List, LayoutGrid, Map } from "lucide-react"
 * 
 * const [view, setView] = useState("list")
 * 
 * <SegmentedControl
 *     options={[
 *         { id: "list", label: "Lista", icon: List },
 *         { id: "grid", label: "Grade", icon: LayoutGrid },
 *         { id: "map", label: "Mapa", icon: Map },
 *     ]}
 *     value={view}
 *     onChange={setView}
 *     variant="pill"
 * />
 * ```
 */
export function SegmentedControl({
    options,
    value,
    onChange,
    variant = "underline",
    className,
}: SegmentedControlProps) {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const [indicatorStyle, setIndicatorStyle] = React.useState({ left: 0, width: 0 })

    // Atualiza a posição do indicador quando a seleção muda
    React.useEffect(() => {
        const updateIndicator = () => {
            if (containerRef.current) {
                const activeBtn = containerRef.current.querySelector(
                    `[data-segment-id="${value}"]`
                ) as HTMLElement
                if (activeBtn) {
                    const containerRect = containerRef.current.getBoundingClientRect()
                    const btnRect = activeBtn.getBoundingClientRect()
                    setIndicatorStyle({
                        left: Math.round(btnRect.left - containerRect.left),
                        width: Math.round(btnRect.width),
                    })
                }
            }
        }
        // Aguarda layout completo
        requestAnimationFrame(updateIndicator)
        window.addEventListener('resize', updateIndicator)
        return () => window.removeEventListener('resize', updateIndicator)
    }, [value])

    const isPill = variant === "pill"

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative",
                isPill
                    ? "bg-stone-100 rounded-xl p-1.5 inline-flex border border-stone-200/60"
                    : "border-b border-stone-200",
                className
            )}
        >
            {/* Tabs */}
            <div className="flex w-full z-10 relative">
                {options.map((opt) => {
                    const Icon = opt.icon
                    const isActive = value === opt.id

                    return (
                        <button
                            key={opt.id}
                            data-segment-id={opt.id}
                            onClick={() => onChange(opt.id)}
                            className={cn(
                                "flex items-center gap-2 transition-colors relative outline-none focus:outline-none focus-visible:outline-none",
                                isPill
                                    ? cn(
                                        "flex-1 justify-center px-4 py-2 text-sm rounded-lg whitespace-nowrap",
                                        isActive
                                            ? "text-primary font-bold"
                                            : "text-stone-400 hover:text-stone-600 font-medium"
                                    )
                                    : cn(
                                        "px-5 py-2.5 text-sm font-semibold uppercase tracking-wide",
                                        isActive
                                            ? "text-primary"
                                            : "text-stone-400 hover:text-stone-600"
                                    )
                            )}
                        >
                            {Icon && <Icon className="w-3.5 h-3.5" />}
                            {opt.label}
                        </button>
                    )
                })}
            </div>

            {/* Sliding indicator */}
            {isPill ? (
                <div
                    className="absolute top-1.5 bottom-1.5 bg-white rounded-lg shadow-sm transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] z-0"
                    style={{
                        left: indicatorStyle.left,
                        width: indicatorStyle.width,
                    }}
                />
            ) : (
                <div
                    className="absolute bottom-0 h-[2.5px] bg-primary rounded-full transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
                    style={{
                        left: indicatorStyle.left,
                        width: indicatorStyle.width,
                    }}
                />
            )}
        </div>
    )
}
