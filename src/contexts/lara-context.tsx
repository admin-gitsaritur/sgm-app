"use client"

import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    type ReactNode,
} from "react"
import { useLocation } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import {
    useUserBehavior,
    type UseUserBehaviorOptions,
    type FilterEvent,
} from "@/hooks/use-user-behavior"
import {
    analyzeBehavior,
    formatBehaviorForAI,
    shouldTriggerProactiveInsight,
    type BehaviorAnalysis,
    type IntentionSignal,
} from "@/lib/ai/behavior-inference"

// ============================================================================
// TIPOS
// ============================================================================

/** Mapa de seções rastreáveis por página */
const PAGE_SECTION_IDS: Record<string, string[]> = {
    "/pdvs/comportamento": [
        "sec-crescimento", "sec-evolucao", "sec-evolucao-mensal",
        "sec-distribuicao-tipo", "sec-descontos", "sec-cancelamentos",
        "sec-seguro", "sec-sentido-viagem", "sec-recorrencia",
    ],
    "/pdvs/health-score": [
        "sec-hs-distribuicao", "sec-hs-stat-cards",
        "sec-hs-rankings", "sec-hs-tabela",
    ],
    "/pdvs/ranking": [
        "sec-ranking-table", "sec-categoria-performance",
        "sec-meta-empresa", "sec-distribuicao-metas",
    ],
    "/pdvs/evolutivo": [
        "sec-projecao-chart", "sec-evolutivo-table",
        "sec-categoria-resumo", "sec-meta-progress",
    ],
    "/": [],
}

/** Seções da página de Health Score individual (dinâmico) */
const HEALTH_SCORE_SECTION_IDS = [
    "detalhe-recencia", "detalhe-frequencia", "detalhe-tendencia",
    "detalhe-seguro", "detalhe-metas", "detalhe-evolutivo",
]

interface LaraContextType {
    /** Insight atual da Lara */
    insight: string | null
    /** Estado de carregamento */
    loading: boolean
    /** A Lara quer abrir proativamente? */
    wantsToOpen: boolean
    /** Intenção principal detectada */
    primaryIntention: IntentionSignal | null
    /** Análise comportamental completa */
    behaviorAnalysis: BehaviorAnalysis | null
    /** Contexto comportamental formatado para a IA */
    behaviorContextForAI: string
    /** Registrar mudança de filtro */
    trackFilter: (filterType: FilterEvent["filterType"], values: string[]) => void
    /** Definir insight (usado pelas páginas) */
    setInsight: (insight: string | null) => void
    /** Definir loading */
    setLoading: (loading: boolean) => void
    /** Resetar estado de abertura proativa (após a Lara abrir) */
    acknowledgeProactive: () => void
    /** Obter resumo comportamental para enviar à API */
    getBehaviorSummary: () => string
}

const LaraContext = createContext<LaraContextType | undefined>(undefined)

// ============================================================================
// PROVIDER
// ============================================================================

interface LaraProviderProps {
    children: ReactNode
}

export function LaraProvider({ children }: LaraProviderProps) {
    const { pathname } = useLocation()
    const { user } = useAuthStore()

    const [insight, setInsight] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [wantsToOpen, setWantsToOpen] = useState(false)
    const [behaviorAnalysis, setBehaviorAnalysis] = useState<BehaviorAnalysis | null>(null)
    const [behaviorContextForAI, setBehaviorContextForAI] = useState("")

    // Determinar seções rastreáveis da página atual
    const isHealthScoreDetail = pathname.startsWith("/pdvs/health-score/") && pathname !== "/pdvs/health-score"
    const sectionIds = isHealthScoreDetail
        ? HEALTH_SCORE_SECTION_IDS
        : PAGE_SECTION_IDS[pathname] || []

    // Callbacks para o hook de comportamento
    const handleBackAndForth = useCallback(() => {
        // Re-analisar quando detectar ida e volta
        triggerAnalysis()
    }, [])

    const handleSectionDwell = useCallback((_sectionId: string, _dwellMs: number) => {
        // Re-analisar quando foco prolongado
        triggerAnalysis()
    }, [])

    const handleFilterChange = useCallback((_filter: FilterEvent) => {
        // Re-analisar quando filtro muda
        triggerAnalysis()
    }, [])

    // Hook de rastreamento
    const behavior = useUserBehavior({
        sectionIds,
        onBackAndForth: handleBackAndForth,
        onSectionDwell: handleSectionDwell,
        onFilterChange: handleFilterChange,
        enabled: true,
    })

    // Ref para controlar intervalo de análise
    const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const triggerAnalysisRef = useRef<() => void>(() => { })
    // Cooldown de 3 min para proactive trigger (evita spam)
    const lastProactiveTriggerRef = useRef<number>(0)
    const PROACTIVE_COOLDOWN_MS = 3 * 60 * 1000 // 3 minutos

    // Smart Debounce Nível 2
    const pageEntryRef = useRef<number>(Date.now())
    const proactiveCountRef = useRef<number>(0)
    const MIN_PAGE_TIME_MS = 15 * 1000 // 15 segundos mínimo na página
    const MAX_PROACTIVE_PER_SESSION = 2

    // Função de análise
    const triggerAnalysis = useCallback(() => {
        const summary = behavior.getBehaviorSummary()
        const analysis = analyzeBehavior(behavior.snapshot, summary)
        setBehaviorAnalysis(analysis)

        // Formatar contexto para IA
        const aiContext = formatBehaviorForAI(analysis)
        setBehaviorContextForAI(aiContext)

        // Verificar se deve abrir proativamente (com cooldown + smart debounce)
        const proactive = shouldTriggerProactiveInsight(analysis)
        const now = Date.now()
        const canCooldown = now - lastProactiveTriggerRef.current > PROACTIVE_COOLDOWN_MS
        const hasMinPageTime = now - pageEntryRef.current > MIN_PAGE_TIME_MS
        const hasSessionQuota = proactiveCountRef.current < MAX_PROACTIVE_PER_SESSION
        if (proactive.shouldTrigger && !wantsToOpen && canCooldown && hasMinPageTime && hasSessionQuota) {
            setWantsToOpen(true)
            lastProactiveTriggerRef.current = now
            proactiveCountRef.current += 1
        }
    }, [behavior, wantsToOpen])

    // Atualizar ref
    triggerAnalysisRef.current = triggerAnalysis

    // Análise periódica (a cada 15s — debounce para evitar churn)
    useEffect(() => {
        analysisIntervalRef.current = setInterval(() => {
            triggerAnalysisRef.current()
        }, 15000)

        return () => {
            if (analysisIntervalRef.current) {
                clearInterval(analysisIntervalRef.current)
            }
        }
    }, [])

    // Reset quando muda de página
    useEffect(() => {
        setInsight(null)
        setWantsToOpen(false)
        pageEntryRef.current = Date.now() // resetar timer de tempo na página
    }, [pathname])

    const acknowledgeProactive = useCallback(() => {
        setWantsToOpen(false)
    }, [])

    // Memoizar value para evitar re-renders desnecessários nos consumers
    const value = useMemo<LaraContextType>(() => ({
        insight,
        loading,
        wantsToOpen,
        primaryIntention: behaviorAnalysis?.primaryIntention || null,
        behaviorAnalysis,
        behaviorContextForAI,
        trackFilter: behavior.trackFilter,
        setInsight,
        setLoading,
        acknowledgeProactive,
        getBehaviorSummary: behavior.getBehaviorSummary,
    }), [
        insight, loading, wantsToOpen,
        behaviorAnalysis, behaviorContextForAI,
        behavior.trackFilter, behavior.getBehaviorSummary,
        acknowledgeProactive,
    ])

    return (
        <LaraContext.Provider value={value}>
            {children}
        </LaraContext.Provider>
    )
}

// ============================================================================
// HOOK
// ============================================================================

export function useLara() {
    const context = useContext(LaraContext)
    if (context === undefined) {
        throw new Error("useLara must be used within a LaraProvider")
    }
    return context
}
