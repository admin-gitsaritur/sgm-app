/**
 * Motor de Inferência de Intenção do Usuário
 * 
 * Analisa o comportamento do usuário na sessão e infere o que ele está
 * tentando entender/analisar. Gera "sinais de intenção" que a Lara usa
 * para oferecer ajuda contextual proativa.
 * 
 * PRINCÍPIOS:
 * - Só infere com confiança alta (evitar falsos positivos irritantes)
 * - Só considera eventos recentes (últimos 15 min)
 * - Prioriza padrões claros (ida e volta, foco prolongado, filtros repetidos)
 * - Nunca interrompe — apenas sinaliza para a Lara quando abrir
 */

import type {
    UserBehaviorSnapshot,
    NavigationEvent,
    SectionFocusEvent,
    FilterEvent,
    BackAndForthPattern,
} from "@/hooks/use-user-behavior"

// ============================================================================
// TIPOS
// ============================================================================

/** Tipo de intenção inferida */
export type IntentionType =
    | "comparing_pages"         // Comparando dados entre 2 páginas (ida e volta)
    | "deep_analyzing_section"  // Analisando uma seção específica em profundidade
    | "exploring_filters"       // Explorando diferentes recortes de dados
    | "investigating_problem"   // Investigando um problema (foco em seções de alerta)
    | "monitoring_progress"     // Monitorando progresso (evolutivo, metas)
    | "searching_opportunity"   // Buscando oportunidades (seguro, ranking)
    | "understanding_trend"     // Tentando entender uma tendência
    | "checking_specific_pdv"   // Analisando um PDV específico
    | "broad_exploration"       // Exploração geral (scrollou tudo, sem foco)

/** Nível de confiança da inferência */
export type ConfidenceLevel = "high" | "medium" | "low"

/** Sinal de intenção inferido */
export interface IntentionSignal {
    /** Tipo de intenção */
    type: IntentionType
    /** Nível de confiança */
    confidence: ConfidenceLevel
    /** Pontuação numérica (0-100) */
    score: number
    /** Descrição legível para a IA */
    description: string
    /** Contexto adicional para a IA */
    context: Record<string, string | number | string[]>
    /** Sugestão de como a Lara deve reagir */
    laraAction: "proactive_open" | "enrich_next_insight" | "wait"
    /** Timestamp da inferência */
    timestamp: number
}

/** Resultado da análise de comportamento */
export interface BehaviorAnalysis {
    /** Intenções detectadas, ordenadas por confiança */
    intentions: IntentionSignal[]
    /** Intenção principal (maior confiança) */
    primaryIntention: IntentionSignal | null
    /** A Lara deve abrir proativamente? */
    shouldProactivelyOpen: boolean
    /** Resumo textual para enviar à IA */
    summary: string
}

// ============================================================================
// CONSTANTES DE THRESHOLD
// ============================================================================

/** Tempo mínimo em seção para considerar "foco profundo" (ms) */
const DEEP_FOCUS_THRESHOLD_MS = 15000 // 15s

/** Número mínimo de mudanças de filtro para considerar "exploração" */
const FILTER_EXPLORATION_THRESHOLD = 3

/** Tempo mínimo na página para considerar qualquer inferência (ms) */
const MIN_PAGE_DWELL_MS = 5000 // 5s

/** Intervalo mínimo entre aberturas proativas (ms) */
const PROACTIVE_COOLDOWN_MS = 120000 // 2 min

/** Seções que indicam investigação de problema */
const PROBLEM_SECTIONS = new Set([
    "sec-cancelamentos",
    "sec-descontos",
    "detalhe-recencia",
    "detalhe-tendencia",
])

/** Seções que indicam busca de oportunidade */
const OPPORTUNITY_SECTIONS = new Set([
    "sec-seguro",
    "sec-recorrencia",
    "detalhe-seguro",
    "detalhe-metas",
    "detalhe-evolutivo",
])

/** Seções que indicam análise de tendência */
const TREND_SECTIONS = new Set([
    "sec-evolucao",
    "sec-evolucao-mensal",
    "sec-crescimento",
    "detalhe-tendencia",
    "detalhe-frequencia",
])

/** Mapa de páginas para contexto */
const PAGE_CONTEXT: Record<string, string> = {
    "/pdvs/ranking": "ranking mensal de PDVs",
    "/pdvs/evolutivo": "acompanhamento do mês corrente",
    "/pdvs/comportamento": "diagnóstico de vendas e comportamento",
    "/pdvs/health-score": "visão geral de saúde dos PDVs",
    "/": "dashboard executivo",
    "/clientes": "gestão de clientes",
    "/nps": "métricas de NPS",
    "/feedbacks": "feedbacks recebidos",
}

// ============================================================================
// MOTOR DE INFERÊNCIA
// ============================================================================

let lastProactiveOpen = 0

/**
 * Analisa o snapshot de comportamento e infere intenções do usuário.
 * 
 * @param snapshot - Snapshot atual do comportamento
 * @param behaviorSummary - Resumo textual gerado pelo hook
 * @returns Análise completa com intenções e recomendações
 */
export function analyzeBehavior(
    snapshot: UserBehaviorSnapshot,
    behaviorSummary: string
): BehaviorAnalysis {
    const intentions: IntentionSignal[] = []
    const now = Date.now()

    // Não inferir nada se o usuário acabou de chegar
    if (snapshot.currentPageDwellMs < MIN_PAGE_DWELL_MS) {
        return {
            intentions: [],
            primaryIntention: null,
            shouldProactivelyOpen: false,
            summary: behaviorSummary,
        }
    }

    // ── 1. Comparando páginas (ida e volta) ──────────────────────────────
    if (snapshot.backAndForthPatterns.length > 0) {
        for (const pattern of snapshot.backAndForthPatterns) {
            const page0 = PAGE_CONTEXT[pattern.pages[0]] || pattern.pages[0]
            const page1 = PAGE_CONTEXT[pattern.pages[1]] || pattern.pages[1]

            intentions.push({
                type: "comparing_pages",
                confidence: pattern.count >= 2 ? "high" : "medium",
                score: Math.min(95, 60 + pattern.count * 15),
                description: `O usuário está alternando entre "${page0}" e "${page1}" (${pattern.count}x). Provavelmente está comparando dados entre essas duas visões para entender uma relação ou discrepância.`,
                context: {
                    page1: pattern.pages[0],
                    page2: pattern.pages[1],
                    page1Name: page0,
                    page2Name: page1,
                    count: pattern.count,
                },
                laraAction: pattern.count >= 2 ? "proactive_open" : "enrich_next_insight",
                timestamp: now,
            })
        }
    }

    // ── 2. Foco profundo em seção ────────────────────────────────────────
    const sections = Array.from(snapshot.sectionFocus.values())
    const deepFocusSections = sections.filter(s => s.dwellTimeMs > DEEP_FOCUS_THRESHOLD_MS)

    for (const section of deepFocusSections) {
        const sectionCategory = PROBLEM_SECTIONS.has(section.sectionId)
            ? "problem"
            : OPPORTUNITY_SECTIONS.has(section.sectionId)
                ? "opportunity"
                : TREND_SECTIONS.has(section.sectionId)
                    ? "trend"
                    : "general"

        const dwellSec = Math.round(section.dwellTimeMs / 1000)

        intentions.push({
            type: "deep_analyzing_section",
            confidence: dwellSec > 30 ? "high" : "medium",
            score: Math.min(90, 50 + dwellSec),
            description: `O usuário está focado na seção "${section.sectionId}" há ${dwellSec}s${section.revisitCount > 0 ? ` e já voltou ${section.revisitCount}x` : ""}. Categoria: ${sectionCategory}.`,
            context: {
                sectionId: section.sectionId,
                dwellSeconds: dwellSec,
                revisitCount: section.revisitCount,
                category: sectionCategory,
            },
            laraAction: dwellSec > 30 && section.revisitCount > 0 ? "proactive_open" : "enrich_next_insight",
            timestamp: now,
        })
    }

    // ── 3. Exploração de filtros ─────────────────────────────────────────
    const recentFilters = snapshot.filterHistory.filter(
        f => f.timestamp > now - 120000 // Últimos 2 min
    )
    if (recentFilters.length >= FILTER_EXPLORATION_THRESHOLD) {
        const filterTypes = [...new Set(recentFilters.map(f => f.filterType))]
        const lastValues = recentFilters.slice(-3).map(f => `${f.filterType}: ${f.values.join(",")}`)

        intentions.push({
            type: "exploring_filters",
            confidence: recentFilters.length >= 5 ? "high" : "medium",
            score: Math.min(85, 40 + recentFilters.length * 10),
            description: `O usuário mudou filtros ${recentFilters.length}x nos últimos 2 minutos (tipos: ${filterTypes.join(", ")}). Está comparando diferentes recortes dos dados.`,
            context: {
                filterCount: recentFilters.length,
                filterTypes,
                lastValues,
            },
            laraAction: recentFilters.length >= 5 ? "proactive_open" : "enrich_next_insight",
            timestamp: now,
        })
    }

    // ── 4. Investigando problema ─────────────────────────────────────────
    const problemFocus = sections.filter(
        s => PROBLEM_SECTIONS.has(s.sectionId) && s.dwellTimeMs > 8000
    )
    if (problemFocus.length >= 2 || (problemFocus.length === 1 && problemFocus[0].revisitCount >= 2)) {
        intentions.push({
            type: "investigating_problem",
            confidence: "high",
            score: 85,
            description: `O usuário está focado em seções de alerta/problema (${problemFocus.map(s => s.sectionId).join(", ")}). Provavelmente investigando uma queda ou anomalia.`,
            context: {
                sections: problemFocus.map(s => s.sectionId),
                totalDwellSeconds: Math.round(problemFocus.reduce((a, s) => a + s.dwellTimeMs, 0) / 1000),
            },
            laraAction: "proactive_open",
            timestamp: now,
        })
    }

    // ── 5. Buscando oportunidade ─────────────────────────────────────────
    const opportunityFocus = sections.filter(
        s => OPPORTUNITY_SECTIONS.has(s.sectionId) && s.dwellTimeMs > 8000
    )
    if (opportunityFocus.length >= 2) {
        intentions.push({
            type: "searching_opportunity",
            confidence: "medium",
            score: 70,
            description: `O usuário está analisando seções de oportunidade (${opportunityFocus.map(s => s.sectionId).join(", ")}). Pode estar buscando formas de melhorar resultados.`,
            context: {
                sections: opportunityFocus.map(s => s.sectionId),
            },
            laraAction: "enrich_next_insight",
            timestamp: now,
        })
    }

    // ── 6. Entendendo tendência ──────────────────────────────────────────
    const trendFocus = sections.filter(
        s => TREND_SECTIONS.has(s.sectionId) && s.dwellTimeMs > 10000
    )
    if (trendFocus.length >= 1) {
        intentions.push({
            type: "understanding_trend",
            confidence: trendFocus.length >= 2 ? "high" : "medium",
            score: Math.min(80, 50 + trendFocus.length * 15),
            description: `O usuário está analisando seções de tendência (${trendFocus.map(s => s.sectionId).join(", ")}). Provavelmente tentando entender a direção do negócio.`,
            context: {
                sections: trendFocus.map(s => s.sectionId),
            },
            laraAction: "enrich_next_insight",
            timestamp: now,
        })
    }

    // ── 7. Analisando PDV específico ─────────────────────────────────────
    const hsMatch = snapshot.currentPage.match(/\/pdvs\/health-score\/(.+)/)
    if (hsMatch && snapshot.currentPageDwellMs > 20000) {
        intentions.push({
            type: "checking_specific_pdv",
            confidence: "high",
            score: 80,
            description: `O usuário está analisando o Health Score de um PDV específico há ${Math.round(snapshot.currentPageDwellMs / 1000)}s. Quer entender a saúde desse ponto de venda em detalhe.`,
            context: {
                pdvId: hsMatch[1],
                dwellSeconds: Math.round(snapshot.currentPageDwellMs / 1000),
            },
            laraAction: snapshot.currentPageDwellMs > 45000 ? "proactive_open" : "enrich_next_insight",
            timestamp: now,
        })
    }

    // ── 8. Monitorando progresso ─────────────────────────────────────────
    if (
        (snapshot.currentPage === "/pdvs/evolutivo" || snapshot.currentPage === "/pdvs/ranking") &&
        snapshot.currentPageDwellMs > 15000
    ) {
        const pageName = snapshot.currentPage === "/pdvs/evolutivo" ? "evolutivo" : "ranking"
        intentions.push({
            type: "monitoring_progress",
            confidence: "medium",
            score: 65,
            description: `O usuário está monitorando o ${pageName} há ${Math.round(snapshot.currentPageDwellMs / 1000)}s. Quer acompanhar o progresso das metas.`,
            context: {
                page: pageName,
                dwellSeconds: Math.round(snapshot.currentPageDwellMs / 1000),
            },
            laraAction: "enrich_next_insight",
            timestamp: now,
        })
    }

    // ── 9. Exploração geral ──────────────────────────────────────────────
    if (
        snapshot.scrollDepth > 80 &&
        snapshot.currentPageDwellMs > 30000 &&
        deepFocusSections.length === 0
    ) {
        intentions.push({
            type: "broad_exploration",
            confidence: "low",
            score: 40,
            description: `O usuário scrollou ${snapshot.scrollDepth}% da página em ${Math.round(snapshot.currentPageDwellMs / 1000)}s sem focar em nenhuma seção específica. Está fazendo uma exploração geral.`,
            context: {
                scrollDepth: snapshot.scrollDepth,
                dwellSeconds: Math.round(snapshot.currentPageDwellMs / 1000),
            },
            laraAction: "wait",
            timestamp: now,
        })
    }

    // ── Ordenar por score e determinar ação ──────────────────────────────
    intentions.sort((a, b) => b.score - a.score)

    const primaryIntention = intentions.length > 0 ? intentions[0] : null

    // Determinar se deve abrir proativamente
    let shouldProactivelyOpen = false
    if (primaryIntention && primaryIntention.laraAction === "proactive_open") {
        // Respeitar cooldown
        if (now - lastProactiveOpen > PROACTIVE_COOLDOWN_MS) {
            shouldProactivelyOpen = true
            lastProactiveOpen = now
        }
    }

    // Gerar resumo enriquecido
    let summary = behaviorSummary
    if (primaryIntention) {
        summary += `\n\nINFERÊNCIA DE INTENÇÃO (confiança: ${primaryIntention.confidence}): ${primaryIntention.description}`
        if (intentions.length > 1) {
            summary += `\nIntenções secundárias: ${intentions.slice(1, 3).map(i => i.description).join(" | ")}`
        }
    }

    return {
        intentions,
        primaryIntention,
        shouldProactivelyOpen,
        summary,
    }
}

/**
 * Gera o contexto comportamental formatado para enviar à API da Lara.
 * Este texto é adicionado ao contexto de dados da página.
 */
export function formatBehaviorForAI(analysis: BehaviorAnalysis): string {
    if (!analysis.primaryIntention) return ""

    const parts: string[] = []

    parts.push("═══ COMPORTAMENTO DO USUÁRIO NA SESSÃO ═══")
    parts.push(analysis.summary)

    if (analysis.primaryIntention) {
        parts.push("")
        parts.push("COMO A LARA DEVE REAGIR:")

        switch (analysis.primaryIntention.type) {
            case "comparing_pages":
                parts.push(
                    `O usuário está comparando ${analysis.primaryIntention.context.page1Name} com ${analysis.primaryIntention.context.page2Name}. ` +
                    `Ajude-o a entender a RELAÇÃO entre os dados dessas duas páginas. ` +
                    `Cruze as informações e explique o que uma página revela sobre a outra. ` +
                    `Exemplo: se está alternando entre Ranking e Health Score, explique como o score impacta o ranking.`
                )
                break

            case "deep_analyzing_section":
                parts.push(
                    `O usuário está focado na seção "${analysis.primaryIntention.context.sectionId}". ` +
                    `Dê uma análise PROFUNDA especificamente sobre esse tema. ` +
                    `Não repita o que está na tela — INTERPRETE, CONTEXTUALIZE e RECOMENDE. ` +
                    `Se é uma seção de problema, proponha solução. Se é de oportunidade, quantifique o potencial.`
                )
                break

            case "exploring_filters":
                parts.push(
                    `O usuário está comparando diferentes recortes dos dados via filtros. ` +
                    `Ajude-o a entender as DIFERENÇAS entre os cenários que está explorando. ` +
                    `Destaque qual recorte tem melhor/pior performance e por quê.`
                )
                break

            case "investigating_problem":
                parts.push(
                    `O usuário está investigando um problema (seções de cancelamento, queda, recência). ` +
                    `Vá direto ao ponto: qual é o problema, qual a causa provável, e o que fazer AGORA. ` +
                    `Seja específica com números e prazos.`
                )
                break

            case "monitoring_progress":
                parts.push(
                    `O usuário está monitorando o progresso das metas. ` +
                    `Dê um status rápido: está no ritmo? Quanto falta? Quais PDVs podem virar o jogo? ` +
                    `Foque em ações dos próximos dias.`
                )
                break

            case "searching_opportunity":
                parts.push(
                    `O usuário está buscando oportunidades de melhoria (seguro, metas, recorrência). ` +
                    `Quantifique as oportunidades: "Se subir X para Y, ganha R$ Z". ` +
                    `Priorize a oportunidade de maior impacto e menor esforço.`
                )
                break

            case "understanding_trend":
                parts.push(
                    `O usuário está tentando entender tendências (evolução, crescimento). ` +
                    `Explique a DIREÇÃO: está subindo ou caindo? Desde quando? Por quê? ` +
                    `Projete: se continuar assim, o que acontece no próximo mês?`
                )
                break

            case "checking_specific_pdv":
                parts.push(
                    `O usuário está analisando um PDV específico em detalhe. ` +
                    `Dê um diagnóstico completo: o que está bem, o que precisa de atenção, e a ação prioritária. ` +
                    `Compare com PDVs similares se possível.`
                )
                break

            case "broad_exploration":
                parts.push(
                    `O usuário está fazendo uma exploração geral da página. ` +
                    `Destaque o insight MAIS IMPORTANTE que ele pode ter perdido. ` +
                    `Aponte para a seção que merece mais atenção.`
                )
                break
        }
    }

    return parts.join("\n")
}

/**
 * Determina se a Lara deve disparar um insight proativo
 * baseado no comportamento acumulado.
 */
export function shouldTriggerProactiveInsight(analysis: BehaviorAnalysis): {
    shouldTrigger: boolean
    reason: string
    urgency: "high" | "medium" | "low"
} {
    if (!analysis.shouldProactivelyOpen || !analysis.primaryIntention) {
        return { shouldTrigger: false, reason: "", urgency: "low" }
    }

    const intent = analysis.primaryIntention

    // Alta urgência: ida e volta repetida ou investigação de problema
    if (
        (intent.type === "comparing_pages" && intent.score >= 80) ||
        intent.type === "investigating_problem"
    ) {
        return {
            shouldTrigger: true,
            reason: intent.description,
            urgency: "high",
        }
    }

    // Média urgência: foco profundo ou filtros exploratórios
    if (
        (intent.type === "deep_analyzing_section" && intent.score >= 75) ||
        (intent.type === "exploring_filters" && intent.score >= 75)
    ) {
        return {
            shouldTrigger: true,
            reason: intent.description,
            urgency: "medium",
        }
    }

    // Baixa urgência: outros padrões
    if (intent.score >= 70) {
        return {
            shouldTrigger: true,
            reason: intent.description,
            urgency: "low",
        }
    }

    return { shouldTrigger: false, reason: "", urgency: "low" }
}
