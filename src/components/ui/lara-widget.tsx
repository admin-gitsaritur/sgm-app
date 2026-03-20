"use client"

import { useState, useEffect, useRef } from "react"

import { X } from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

/**
 * Keyframes para animação pop elástica (entrada e saída do balão).
 * Injetados uma vez no <head> via useEffect.
 */
const LARA_KEYFRAMES = `
@keyframes lara-pop-in {
  0% { opacity: 0; transform: scale(0.3) translateY(20px); }
  50% { opacity: 1; transform: scale(1.08) translateY(-4px); }
  70% { transform: scale(0.96) translateY(1px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes lara-pop-out {
  0% { opacity: 1; transform: scale(1) translateY(0); }
  30% { transform: scale(1.05) translateY(-2px); }
  100% { opacity: 0; transform: scale(0.3) translateY(20px); }
}
@keyframes lara-avatar-bounce {
  0% { opacity: 0; transform: scale(0) rotate(-20deg); }
  50% { opacity: 1; transform: scale(1.15) rotate(5deg); }
  70% { transform: scale(0.92) rotate(-2deg); }
  85% { transform: scale(1.04) rotate(1deg); }
  100% { opacity: 1; transform: scale(1) rotate(0deg); }
}
`
import { cn } from "@/lib/utils"

/** Parser leve de markdown inline para o balão da Lara */
function parseInlineMarkdown(text: string): string {
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')  // **bold**
        .replace(/\*(.+?)\*/g, '<em>$1</em>')              // *italic*
        .replace(/\n/g, '<br />')                           // line breaks
}

interface LaraWidgetProps {
    /** Insight gerado pela IA */
    insight: string | null
    /** Estado de carregamento */
    loading?: boolean
    /** Callback para buscar novo insight (chamado automaticamente a cada abertura) */
    onRefresh?: () => void
    /** Classes adicionais */
    className?: string
}

/**
 * Widget flutuante da Lara — CS virtual da Saritur.
 * 
 * Renderiza um avatar circular fixo no canto inferior direito.
 * Ao abrir, exibe um balão de diálogo com o insight gerado pela IA.
 * A cada abertura ou atualização de dados, busca um novo insight automaticamente.
 * 
 * ## Como usar em outras páginas
 * 
 * ```tsx
 * import { LaraWidget } from "@/components/ui/lara-widget"
 * 
 * // No componente da página:
 * const [insight, setInsight] = useState<string | null>(null)
 * const [loading, setLoading] = useState(false)
 * 
 * const fetchInsight = async () => {
 *     setLoading(true)
 *     const res = await fetch('/api/ai/ranking-insights', { ... })
 *     const data = await res.json()
 *     setInsight(data.insight)
 *     setLoading(false)
 * }
 * 
 * <LaraWidget
 *     insight={insight}
 *     loading={loading}
 *     onRefresh={fetchInsight}
 * />
 * ```
 * 
 * @see docs/LARA_GUIDE.md para instruções detalhadas
 */
export function LaraWidget({
    insight,
    loading = false,
    onRefresh,
    className,
}: LaraWidgetProps) {
    const [open, setOpen] = useState(false)
    const [closing, setClosing] = useState(false)
    const [hasBeenSeen, setHasBeenSeen] = useState(() => {
        if (typeof window !== 'undefined') {
            return sessionStorage.getItem('lara-widget-seen') === 'true'
        }
        return false
    })
    const [avatarLoaded, setAvatarLoaded] = useState(false)
    const balloonRef = useRef<HTMLDivElement>(null)
    const avatarRef = useRef<HTMLButtonElement>(null)

    // Injetar keyframes no <head> uma vez
    useEffect(() => {
        const id = 'lara-widget-keyframes'
        if (!document.getElementById(id)) {
            const style = document.createElement('style')
            style.id = id
            style.textContent = LARA_KEYFRAMES
            document.head.appendChild(style)
        }
    }, [])

    // Abrir automaticamente quando o insight chegar pela primeira vez
    useEffect(() => {
        if (insight && !hasBeenSeen && !loading) {
            const timer = setTimeout(() => setOpen(true), 800)
            return () => clearTimeout(timer)
        }
    }, [insight, hasBeenSeen, loading])

    // Fechar ao clicar fora
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                open &&
                !closing &&
                balloonRef.current &&
                avatarRef.current &&
                !balloonRef.current.contains(e.target as Node) &&
                !avatarRef.current.contains(e.target as Node)
            ) {
                handleClose()
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [open, closing])

    const handleToggle = () => {
        if (open) {
            handleClose()
        } else {
            // Toda vez que abre, pede novo insight
            if (onRefresh) onRefresh()
            setOpen(true)
        }
    }

    const handleClose = () => {
        setClosing(true)
        setHasBeenSeen(true)
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('lara-widget-seen', 'true')
        }
        // Esperar animação de saída terminar
        setTimeout(() => {
            setOpen(false)
            setClosing(false)
        }, 250)
    }

    return (
        <div className={cn("fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4", className)}>
            {/* Balão de diálogo */}
            {open && (
                <div
                    ref={balloonRef}
                    className={cn(
                        "relative bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-stone-100",
                        "max-w-[340px] min-w-[280px] p-5 pb-4",
                        "max-h-[80vh] flex flex-col"
                    )}
                    style={{
                        animation: closing
                            ? 'lara-pop-out 0.25s cubic-bezier(0.36, 0, 0.66, -0.56) forwards'
                            : 'lara-pop-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                        transformOrigin: 'bottom right'
                    }}
                >
                    {/* Botão fechar — lado direito */}
                    <button
                        onClick={handleClose}
                        className="absolute top-3 right-3 p-1 rounded-full bg-stone-100 hover:bg-stone-200 transition-colors z-10"
                    >
                        <X className="h-3.5 w-3.5 text-stone-400" />
                    </button>

                    {/* Conteúdo com scroll */}
                    <div className="pr-6 overflow-y-auto flex-1 min-h-0">
                        {loading ? (
                            <div className="space-y-2.5 py-1">
                                <div className="h-3.5 bg-gradient-to-r from-stone-100 via-stone-200 to-stone-100 rounded-full animate-pulse w-full bg-[length:200%_100%]" />
                                <div className="h-3.5 bg-gradient-to-r from-stone-100 via-stone-200 to-stone-100 rounded-full animate-pulse w-4/5 bg-[length:200%_100%]" style={{ animationDelay: '150ms' }} />
                                <div className="h-3.5 bg-gradient-to-r from-stone-100 via-stone-200 to-stone-100 rounded-full animate-pulse w-3/5 bg-[length:200%_100%]" style={{ animationDelay: '300ms' }} />
                            </div>
                        ) : insight ? (
                            <div
                                className="text-sm text-stone-700 leading-relaxed [&_strong]:font-semibold [&_em]:italic"
                                dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(insight) }}
                            />
                        ) : (
                            <p className="text-sm text-stone-400 italic">
                                Analisando os dados do ranking...
                            </p>
                        )}
                    </div>

                    {/* Seta do balão apontando para o avatar */}
                    {/* Seta do balão — afastada do avatar */}
                    <div className="absolute -bottom-[10px] right-8 w-4 h-4 bg-white border-r border-b border-stone-100 rotate-45" />
                </div>
            )}

            {/* Avatar da Lara com Tooltip */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        ref={avatarRef}
                        onClick={handleToggle}
                        className={cn(
                            "relative w-16 h-16 rounded-full overflow-hidden",
                            "shadow-[0_4px_20px_rgba(243,113,55,0.3)] hover:shadow-[0_4px_25px_rgba(243,113,55,0.45)]",
                            "border-[3px] border-white",
                            "transition-shadow duration-300 hover:scale-110 active:scale-95",
                            "focus:outline-none focus:ring-2 focus:ring-[#F37137] focus:ring-offset-2",
                            !avatarLoaded && "opacity-0"
                        )}
                        style={avatarLoaded ? {
                            animation: 'lara-avatar-bounce 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
                        } : undefined}
                    >
                        <img
                            src="/brand/lara.jpeg"
                            alt="Lara — Assistente Virtual Saritur"
                            className="w-full h-full object-cover"
                            onLoad={() => setAvatarLoaded(true)}
                        />

                        {/* Indicador de novo insight (pulsante) */}
                        {insight && !hasBeenSeen && !open && (
                            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F37137] opacity-75" />
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-[#F37137] border-2 border-white" />
                            </span>
                        )}
                    </button>
                </TooltipTrigger>
                {!open && (
                    <TooltipContent side="left" sideOffset={8}>
                        Fale com a Lara
                    </TooltipContent>
                )}
            </Tooltip>
        </div>
    )
}
