"use client"

/**
 * LaraWidgetConnected — Bridge entre useLara() e LaraWidgetV2
 *
 * Wrapper que consome o LaraContext (comportamento) e repassa ao widget.
 * Cada página substitui <LaraWidgetV2> por <LaraWidgetConnected> para
 * habilitar: abertura proativa, contexto comportamental nos insights,
 * e tracking de filtros.
 */

import { useCallback, useEffect, useRef } from "react"
import { useLocation } from "react-router-dom"
import { useLara } from "@/contexts/lara-context"
import { LaraWidgetV2 } from "@/components/ui/lara-widget-v2"

/**
 * Monta string descritiva dos filtros ativos para contextualizar a Lara.
 * Se nenhum filtro ativo → retorna "".
 */
export function buildFilterContext(opts: {
    selectedPdvs?: string[]
    pdvOptions?: Array<{ value: string; label: string }>
    selectedTipos?: string[]
    selectedCategorias?: string[]
    empresa?: string | null
    periodo?: string
}): string {
    const parts: string[] = []

    // Nomes dos PDVs selecionados
    if (opts.selectedPdvs?.length && opts.pdvOptions?.length) {
        const names = opts.selectedPdvs
            .map(id => opts.pdvOptions!.find(o => o.value === id)?.label)
            .filter(Boolean)
        if (names.length > 0) parts.push(`PDV(s): ${names.join(", ")}`)
    }

    // Tipos
    if (opts.selectedTipos?.length) {
        parts.push(`Tipo(s): ${opts.selectedTipos.join(", ")}`)
    }

    // Categorias
    if (opts.selectedCategorias?.length) {
        parts.push(`Categoria(s): ${opts.selectedCategorias.join(", ")}`)
    }

    // Empresa
    if (opts.empresa) {
        parts.push(`Empresa: ${opts.empresa}`)
    }

    // Período
    if (opts.periodo) {
        parts.push(`Período: ${opts.periodo}`)
    }

    return parts.join(" | ")
}

interface LaraWidgetConnectedProps {
    /** Insight padrão (gerado pela rota de insight da página) */
    insight: string | null
    /** Loading do insight padrão */
    loading?: boolean
    /** Refresh do insight padrão */
    onRefresh?: () => void
    /** Quick actions customizadas da página */
    quickActions?: Array<{ label: string; prompt: string }>
    /** Contexto da página (JSON com dados) */
    pageContext?: string
    /**
     * Descrição dos filtros ativos — ex: "PDV: Clickbus | Tipo: Internet"
     * Quando presente, a Lara sabe que está analisando um recorte específico.
     */
    filterContext?: string
    /** Nome do usuário logado */
    userName?: string
    /** CSS class */
    className?: string
}

export function LaraWidgetConnected({
    insight,
    loading = false,
    onRefresh,
    quickActions,
    pageContext = "",
    filterContext = "",
    userName = "Gestor",
    className,
}: LaraWidgetConnectedProps) {
    const lara = useLara()
    const { pathname } = useLocation()
    const prevFilterRef = useRef(filterContext)

    // ── Refs estáveis para funções do lara (evita recriação de callbacks) ──
    const laraRef = useRef(lara)
    laraRef.current = lara

    // Auto-track filter changes — quando filterContext muda, registra no behavior engine
    useEffect(() => {
        if (filterContext && filterContext !== prevFilterRef.current) {
            laraRef.current.trackFilter("pdv", [filterContext])
        }
        prevFilterRef.current = filterContext
    }, [filterContext])

    // Montar contexto completo: dados da página + filtros ativos + comportamento
    const parts: string[] = [pageContext]
    if (filterContext) {
        parts.push(`\n═══ FILTROS ATIVOS ═══\n${filterContext}\nIMPORTANTE: Analise APENAS os dados do recorte filtrado acima, NÃO faça análise geral.`)
    }
    if (lara.behaviorContextForAI) {
        parts.push(`\n═══ COMPORTAMENTO DO USUÁRIO NA SESSÃO ═══\n${lara.behaviorContextForAI}`)
    }
    const enrichedContext = parts.filter(Boolean).join("\n")

    // Fetch de insight comportamental (quando proativo abre)
    // IMPORTANTE: deps estáveis via refs — evita loop infinito de re-render
    const fetchBehaviorInsight = useCallback(async () => {
        const l = laraRef.current
        if (l.loading) return // Guard: evitar chamadas duplicadas

        l.setLoading(true)
        try {
            const res = await fetch("/api/ai/lara-behavior-insight", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userName,
                    behaviorSummary: l.getBehaviorSummary(),
                    pageData: pageContext,
                    currentPage: pathname,
                    intentionType: l.primaryIntention?.type,
                    intentionDescription: l.primaryIntention?.description,
                }),
            })
            if (res.ok) {
                const data = await res.json()
                l.setInsight(data.insight)
            }
        } catch (err) {
            console.error("[LaraConnected] Erro ao buscar insight comportamental:", err)
        } finally {
            l.setLoading(false)
        }
    }, [userName, pageContext, pathname]) // ← SEM `lara` — usa laraRef

    return (
        <LaraWidgetV2
            insight={lara.insight || insight}
            loading={lara.loading || loading}
            onRefresh={onRefresh}
            wantsToOpen={lara.wantsToOpen}
            onProactiveAcknowledge={lara.acknowledgeProactive}
            onBehaviorInsight={fetchBehaviorInsight}
            insightType={lara.wantsToOpen ? "behavioral" : "standard"}
            quickActions={quickActions}
            pageContext={enrichedContext}
            currentPage={pathname}
            userName={userName}
            className={className}
        />
    )
}
