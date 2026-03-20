"use client"

import { useState, useEffect, useRef, useCallback } from "react"

import { X, Send, MessageCircle, Sparkles, Brain } from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

// ============================================================================
// KEYFRAMES — Estética v1 (pop elástico) + typing do v2
// ============================================================================

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
@keyframes lara-proactive-pulse {
  0% { box-shadow: 0 0 0 0 rgba(243, 113, 55, 0.5); }
  50% { box-shadow: 0 0 0 12px rgba(243, 113, 55, 0); }
  100% { box-shadow: 0 0 0 0 rgba(243, 113, 55, 0); }
}
@keyframes lara-brain-float {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.9; }
  50% { transform: translateY(-3px) scale(1.1); opacity: 1; }
}
@keyframes lara-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes lara-typing-dot {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}
@keyframes lara-radar {
  0% { transform: scale(1); opacity: 0.8; box-shadow: 0 0 0 0 rgba(243, 113, 55, 0.6); }
  50% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 0 6px rgba(243, 113, 55, 0.15); }
  100% { transform: scale(1); opacity: 0.8; box-shadow: 0 0 0 0 rgba(243, 113, 55, 0); }
}
@keyframes lara-radar-ring {
  0% { transform: scale(0.5); opacity: 0.8; }
  100% { transform: scale(2.8); opacity: 0; }
}
`

/** Parser leve de markdown inline para o balão da Lara */
function parseInlineMarkdown(text: string): string {
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br/>')
}

// ============================================================================
// TIPOS
// ============================================================================

interface QuickAction {
    label: string
    prompt: string
}

interface LaraWidgetV2Props {
    insight: string | null
    loading?: boolean
    onRefresh?: () => void
    wantsToOpen?: boolean
    onProactiveAcknowledge?: () => void
    onBehaviorInsight?: () => void
    insightType?: "standard" | "behavioral"
    quickActions?: QuickAction[]
    pageContext?: string
    currentPage?: string
    userName?: string
    className?: string
}

const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
    { label: "🔍 Analisar gaps", prompt: "Analise os principais gaps e pontos fracos nos dados atuais. Onde estamos perdendo receita ou oportunidade?" },
    { label: "📈 Pontos fortes", prompt: "Quais são os destaques positivos nos dados atuais? O que está funcionando bem e devemos reforçar?" },
    { label: "⚠️ Riscos", prompt: "Quais são os principais riscos e alertas que você identifica nos dados? O que precisa de atenção urgente?" },
    { label: "💡 Oportunidades", prompt: "Quais oportunidades de receita você identifica nos dados? Onde podemos crescer rapidamente?" },
]

interface ChatMessage {
    role: "user" | "model"
    text: string
    timestamp: number
}

// ============================================================================
// COMPONENTE
// ============================================================================

export function LaraWidgetV2({
    insight,
    loading = false,
    onRefresh,
    wantsToOpen = false,
    onProactiveAcknowledge,
    onBehaviorInsight,
    insightType = "standard",
    quickActions,
    pageContext = "",
    currentPage = "",
    userName = "Gestor",
    className,
}: LaraWidgetV2Props) {
    const [open, setOpen] = useState(false)
    const [closing, setClosing] = useState(false)
    const [hasBeenSeen, setHasBeenSeen] = useState(false)
    const [avatarLoaded, setAvatarLoaded] = useState(false)
    const [showProactivePulse, setShowProactivePulse] = useState(false)

    // Chat state
    const [chatMode, setChatMode] = useState(false)
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
    const [chatInput, setChatInput] = useState("")
    const [chatLoading, setChatLoading] = useState(false)

    // Quick action state
    const [quickActionLoading, setQuickActionLoading] = useState<string | null>(null)
    const [quickActionResponse, setQuickActionResponse] = useState<string | null>(null)

    const balloonRef = useRef<HTMLDivElement>(null)
    const avatarRef = useRef<HTMLButtonElement>(null)
    const chatEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Refs estáveis para callbacks de props (evita loop em useEffect)
    const onBehaviorInsightRef = useRef(onBehaviorInsight)
    onBehaviorInsightRef.current = onBehaviorInsight
    const onProactiveAcknowledgeRef = useRef(onProactiveAcknowledge)
    onProactiveAcknowledgeRef.current = onProactiveAcknowledge
    // Guard: evita multiple triggers por ciclo proactive
    const hasTriggeredProactiveRef = useRef(false)

    const actions = quickActions || DEFAULT_QUICK_ACTIONS
    const firstName = userName?.split(' ')[0] || 'Gestor'

    // Inject keyframes
    useEffect(() => {
        const id = "lara-widget-keyframes"
        if (!document.getElementById(id)) {
            const style = document.createElement("style")
            style.id = id
            style.textContent = LARA_KEYFRAMES
            document.head.appendChild(style)
        }
    }, [])

    // NOTE: Auto-open removido — widget inicia fechado.
    // Notificação via badge no avatar indica insights disponíveis.

    // Proactive opening — refs estáveis para evitar loop de re-render
    useEffect(() => {
        if (wantsToOpen && !open && !loading && !hasTriggeredProactiveRef.current) {
            hasTriggeredProactiveRef.current = true
            setShowProactivePulse(true)
            // Disparar fetch de insight comportamental ANTES de abrir
            onBehaviorInsightRef.current?.()
            const timer = setTimeout(() => {
                setOpen(true)
                setShowProactivePulse(false)
                onProactiveAcknowledgeRef.current?.()
            }, 2000)
            return () => clearTimeout(timer)
        }
        // Reset guard quando wantsToOpen volta a false
        if (!wantsToOpen) {
            hasTriggeredProactiveRef.current = false
        }
    }, [wantsToOpen, open, loading]) // ← deps estáveis (primitivos apenas)

    // Click outside to close
    useEffect(() => {
        if (!open || closing) return
        const handleClickOutside = (e: MouseEvent) => {
            if (
                balloonRef.current && !balloonRef.current.contains(e.target as Node) &&
                avatarRef.current && !avatarRef.current.contains(e.target as Node)
            ) {
                handleClose()
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [open, closing])

    // Scroll chat to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [chatMessages, chatLoading])

    // Toggle
    const handleToggle = useCallback(() => {
        if (open) {
            handleClose()
        } else {
            if (onRefresh && !insight) onRefresh()
            setOpen(true)
            if (!hasBeenSeen) setHasBeenSeen(true)
        }
    }, [open, hasBeenSeen, onRefresh, insight])

    // Close with pop-out animation
    const handleClose = useCallback(() => {
        setClosing(true)
        setHasBeenSeen(true)
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('lara-widget-seen', 'true')
        }
        setTimeout(() => {
            setOpen(false)
            setClosing(false)
            setChatMode(false)
            setQuickActionResponse(null)
        }, 250)
    }, [])

    // Quick Action click
    const handleQuickAction = useCallback(async (action: QuickAction) => {
        setQuickActionLoading(action.label)
        setQuickActionResponse(null)
        try {
            const res = await fetch("/api/ai/lara-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userName: firstName,
                    message: action.prompt,
                    pageContext,
                    currentPage,
                }),
            })
            if (res.ok) {
                const data = await res.json()
                setQuickActionResponse(data.response)
            }
        } catch (err) {
            console.error("Erro quick action Lara:", err)
        } finally {
            setQuickActionLoading(null)
        }
    }, [userName, pageContext, currentPage])

    // Chat send
    const handleChatSend = useCallback(async () => {
        const msg = chatInput.trim()
        if (!msg || chatLoading) return

        const userMessage: ChatMessage = { role: "user", text: msg, timestamp: Date.now() }
        setChatMessages(prev => [...prev, userMessage])
        setChatInput("")
        setChatLoading(true)

        try {
            const res = await fetch("/api/ai/lara-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userName: firstName,
                    message: msg,
                    pageContext,
                    currentPage,
                    conversationHistory: chatMessages.map(m => ({
                        role: m.role,
                        text: m.text,
                    })),
                }),
            })
            if (res.ok) {
                const data = await res.json()
                setChatMessages(prev => [...prev, {
                    role: "model",
                    text: data.response,
                    timestamp: Date.now(),
                }])
            }
        } catch (err) {
            console.error("Erro chat Lara:", err)
            setChatMessages(prev => [...prev, {
                role: "model",
                text: "Desculpa, tive um problema ao processar sua mensagem. Tenta de novo? 😅",
                timestamp: Date.now(),
            }])
        } finally {
            setChatLoading(false)
        }
    }, [chatInput, chatLoading, userName, pageContext, currentPage, chatMessages])

    // Enter key
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleChatSend()
        }
    }, [handleChatSend])

    // Switch to chat
    const handleOpenChat = useCallback(() => {
        setChatMode(true)
        setQuickActionResponse(null)
        setTimeout(() => inputRef.current?.focus(), 100)
    }, [])

    // Shimmer loader
    const renderShimmer = () => (
        <div className="space-y-2.5 py-1">
            <div className="h-3.5 bg-gradient-to-r from-stone-100 via-stone-200 to-stone-100 rounded-full animate-pulse w-full bg-[length:200%_100%]" />
            <div className="h-3.5 bg-gradient-to-r from-stone-100 via-stone-200 to-stone-100 rounded-full animate-pulse w-4/5 bg-[length:200%_100%]" style={{ animationDelay: '150ms' }} />
            <div className="h-3.5 bg-gradient-to-r from-stone-100 via-stone-200 to-stone-100 rounded-full animate-pulse w-3/5 bg-[length:200%_100%]" style={{ animationDelay: '300ms' }} />
        </div>
    )

    // Typing indicator
    const renderTyping = () => (
        <div className="flex items-center gap-1 py-2">
            {[0, 1, 2].map(i => (
                <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-[#F37137]"
                    style={{ animation: `lara-typing-dot 1.4s infinite ${i * 0.2}s` }}
                />
            ))}
        </div>
    )

    return (
        <div className={cn("fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4", className)}>
            {/* =================== BALLOON =================== */}
            {open && (
                <div
                    ref={balloonRef}
                    className={cn(
                        "relative bg-white rounded-2xl",
                        "shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-stone-100",
                        "flex flex-col",
                        chatMode && "overflow-hidden"
                    )}
                    style={{
                        width: chatMode ? "400px" : "340px",
                        maxHeight: chatMode ? "520px" : "80vh",
                        marginBottom: !chatMode ? "12px" : undefined,
                        animation: closing
                            ? 'lara-pop-out 0.25s cubic-bezier(0.36, 0, 0.66, -0.56) forwards'
                            : 'lara-pop-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                        transformOrigin: 'bottom right',
                    }}
                >
                    {/* Close button — discrete (v1 style) */}
                    <button
                        onClick={handleClose}
                        className="absolute top-3 right-3 p-1 rounded-full bg-stone-100 hover:bg-stone-200 transition-colors z-10"
                    >
                        <X className="h-3.5 w-3.5 text-stone-400" />
                    </button>

                    {/* Chat mode back button */}
                    {chatMode && (
                        <button
                            onClick={() => { setChatMode(false); setQuickActionResponse(null) }}
                            className="absolute top-3 left-3 p-1 rounded-full bg-stone-100 hover:bg-stone-200 transition-colors z-10"
                            title="Voltar aos insights"
                        >
                            <Sparkles className="h-3.5 w-3.5 text-[#F37137]" />
                        </button>
                    )}

                    {/* ============ CONTENT ============ */}
                    {chatMode ? (
                        /* ============ CHAT MODE ============ */
                        <div className="flex flex-col" style={{ height: "460px" }}>
                            {/* Header mini */}
                            <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-stone-100">
                                <div className="relative w-6 h-6 rounded-full overflow-hidden">
                                    <img src="/brand/lara.jpeg" alt="Lara" className="w-full h-full object-cover" />
                                </div>
                                <span className="text-xs font-medium text-stone-500">Conversar com a Lara</span>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                                {chatMessages.length === 0 && (
                                    <div className="text-center text-xs text-stone-400 py-6">
                                        Pergunte sobre os dados desta página. 💬
                                    </div>
                                )}
                                {chatMessages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
                                            msg.role === "user"
                                                ? "ml-auto bg-[#F37137] text-white rounded-br-md"
                                                : "mr-auto bg-stone-50 text-stone-700 rounded-bl-md border border-stone-100"
                                        )}
                                    >
                                        <div
                                            dangerouslySetInnerHTML={{
                                                __html: parseInlineMarkdown(msg.text),
                                            }}
                                        />
                                    </div>
                                ))}
                                {chatLoading && (
                                    <div className="mr-auto bg-stone-50 rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%] border border-stone-100">
                                        {renderTyping()}
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Input */}
                            <div className="border-t border-stone-100 px-3 py-2.5">
                                <div className="flex items-center gap-2">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={chatInput}
                                        onChange={e => setChatInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Pergunte sobre os dados..."
                                        className="flex-1 text-sm bg-stone-50 rounded-xl px-3.5 py-2.5 border border-stone-200 focus:outline-none focus:border-[#F37137] focus:ring-1 focus:ring-[#F37137]/20 transition-colors"
                                        disabled={chatLoading}
                                    />
                                    <button
                                        onClick={handleChatSend}
                                        disabled={!chatInput.trim() || chatLoading}
                                        className={cn(
                                            "p-2.5 rounded-xl transition-all",
                                            chatInput.trim() && !chatLoading
                                                ? "bg-[#F37137] text-white hover:bg-[#E06030] shadow-sm"
                                                : "bg-stone-100 text-stone-400 cursor-not-allowed"
                                        )}
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* ============ INSIGHT MODE (v1 layout) ============ */
                        <div className="flex flex-col min-h-0">
                            {/* Insight content + Quick Actions (tudo scrollável junto) */}
                            <div className="pr-8 overflow-y-auto flex-1 min-h-0 p-5">
                                {loading || quickActionLoading ? (
                                    renderShimmer()
                                ) : quickActionResponse ? (
                                    <div
                                        className="text-sm text-stone-700 leading-relaxed [&_strong]:font-semibold [&_em]:italic"
                                        dangerouslySetInnerHTML={{
                                            __html: parseInlineMarkdown(quickActionResponse),
                                        }}
                                    />
                                ) : insight ? (
                                    <div
                                        className="text-sm text-stone-700 leading-relaxed [&_strong]:font-semibold [&_em]:italic"
                                        dangerouslySetInnerHTML={{
                                            __html: parseInlineMarkdown(insight),
                                        }}
                                    />
                                ) : (
                                    <p className="text-sm text-stone-400 italic">
                                        Analisando os dados...
                                    </p>
                                )}

                                {/* Quick Actions — rolam junto com o texto */}
                                {!loading && (insight || quickActionResponse) && (
                                    <div className="pt-3 space-y-2">
                                        {/* Back button if showing quick action response */}
                                        {quickActionResponse && (
                                            <button
                                                onClick={() => setQuickActionResponse(null)}
                                                className="text-xs text-[#F37137] hover:text-[#E06030] transition-colors"
                                            >
                                                ← Voltar ao insight principal
                                            </button>
                                        )}

                                        {/* Action chips */}
                                        <div className="flex flex-wrap gap-1.5">
                                            {actions.map((action) => (
                                                <button
                                                    key={action.label}
                                                    onClick={() => handleQuickAction(action)}
                                                    disabled={!!quickActionLoading}
                                                    className={cn(
                                                        "text-xs px-2.5 py-1.5 rounded-lg border transition-all",
                                                        quickActionLoading === action.label
                                                            ? "bg-[#F37137]/10 border-[#F37137]/30 text-[#F37137]"
                                                            : "bg-white border-stone-200 text-stone-600 hover:border-[#F37137]/40 hover:text-[#F37137] hover:bg-[#F37137]/5"
                                                    )}
                                                >
                                                    {action.label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Chat button */}
                                        <button
                                            onClick={handleOpenChat}
                                            className="w-full flex items-center justify-center gap-2 text-xs py-2 rounded-lg border border-stone-200 text-stone-500 hover:border-[#F37137]/40 hover:text-[#F37137] hover:bg-[#F37137]/5 transition-all"
                                        >
                                            <MessageCircle className="w-3.5 h-3.5" />
                                            Conversar com a Lara
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Arrow pointing to avatar (v1 style) — only in insight mode */}
                    {!chatMode && (
                        <div className="absolute -bottom-[10px] right-8 w-4 h-4 bg-white border-r border-b border-stone-100 rotate-45" />
                    )}
                </div>
            )}

            {/* =================== AVATAR =================== */}
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
                            showProactivePulse && "animate-[lara-proactive-pulse_1.5s_ease-in-out_infinite]",
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
                    </button>
                </TooltipTrigger>
                {!open && (
                    <TooltipContent side="left" sideOffset={8}>
                        Fale com a Lara
                    </TooltipContent>
                )}
            </Tooltip>

            {/* Indicator dot — radar effect (top-left do avatar) */}
            {insight && !open && (
                <span
                    className="absolute -top-1 right-[52px] flex h-4 w-4 z-10 pointer-events-none"
                >
                    {/* Radar rings */}
                    <span
                        className="absolute inline-flex h-full w-full rounded-full bg-[#F37137]"
                        style={{ animation: 'lara-radar-ring 1.5s ease-out infinite' }}
                    />
                    <span
                        className="absolute inline-flex h-full w-full rounded-full bg-[#F37137]"
                        style={{ animation: 'lara-radar-ring 1.5s ease-out infinite 0.5s' }}
                    />
                    {/* Solid dot */}
                    <span
                        className="relative inline-flex rounded-full h-4 w-4 bg-[#F37137] border-2 border-white"
                        style={{ animation: 'lara-radar 2s ease-in-out infinite' }}
                    />
                </span>
            )}

            {/* Brain icon for proactive */}
            {showProactivePulse && (
                <div
                    className="absolute -top-1 right-[52px] w-5 h-5 bg-[#F37137] rounded-full flex items-center justify-center border-2 border-white z-10 pointer-events-none"
                    style={{ animation: "lara-brain-float 2s ease-in-out infinite" }}
                >
                    <Brain className="w-3 h-3 text-white" />
                </div>
            )}
        </div>
    )
}
