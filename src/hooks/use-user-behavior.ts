"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { useLocation } from "react-router-dom"

// ============================================================================
// TIPOS
// ============================================================================

/** Evento de navegação entre páginas */
export interface NavigationEvent {
    from: string
    to: string
    timestamp: number
    dwellTimeMs: number // Quanto tempo ficou na página anterior
}

/** Evento de foco em seção (container com id) */
export interface SectionFocusEvent {
    sectionId: string
    page: string
    enterTime: number
    exitTime: number | null
    dwellTimeMs: number
    /** Quantas vezes o usuário voltou a essa seção */
    revisitCount: number
}

/** Evento de filtro aplicado */
export interface FilterEvent {
    filterType: "tipo" | "categoria" | "pdv" | "periodo" | "mes" | "ano"
    values: string[]
    page: string
    timestamp: number
}

/** Evento de hover prolongado em elemento */
export interface HoverEvent {
    elementId: string
    sectionId: string | null
    page: string
    timestamp: number
    durationMs: number
}

/** Padrão de ida e volta detectado */
export interface BackAndForthPattern {
    pages: string[]
    count: number
    firstDetected: number
    lastDetected: number
}

/** Snapshot completo do comportamento do usuário na sessão */
export interface UserBehaviorSnapshot {
    /** Página atual */
    currentPage: string
    /** Tempo na página atual (ms) */
    currentPageDwellMs: number
    /** Histórico de navegação (últimas 20 navegações) */
    navigationHistory: NavigationEvent[]
    /** Seções em foco / visitadas na página atual */
    sectionFocus: Map<string, SectionFocusEvent>
    /** Seção atualmente visível (a mais tempo em viewport) */
    currentSection: string | null
    /** Filtros aplicados na sessão */
    filterHistory: FilterEvent[]
    /** Filtros ativos no momento */
    activeFilters: FilterEvent[]
    /** Padrões de ida e volta detectados */
    backAndForthPatterns: BackAndForthPattern[]
    /** Hovers prolongados (>3s) */
    hoverEvents: HoverEvent[]
    /** Profundidade de scroll (0-100%) */
    scrollDepth: number
    /** Timestamp do início da sessão */
    sessionStart: number
}

// ============================================================================
// CONSTANTES
// ============================================================================

/** Tempo mínimo de hover para considerar "prolongado" (ms) */
const HOVER_THRESHOLD_MS = 3000

/** Tempo máximo de sessão para considerar eventos relevantes (15 min) */
const SESSION_WINDOW_MS = 15 * 60 * 1000

/** Máximo de eventos de navegação no histórico */
const MAX_NAV_HISTORY = 20

/** Máximo de eventos de filtro no histórico */
const MAX_FILTER_HISTORY = 30

/** Intervalo de atualização do dwell time (ms) */
const DWELL_UPDATE_INTERVAL_MS = 1000

// ============================================================================
// HOOK: useUserBehavior
// ============================================================================

export interface UseUserBehaviorOptions {
    /** IDs das seções a observar (containers com esses IDs na página) */
    sectionIds?: string[]
    /** Callback quando um padrão de ida e volta é detectado */
    onBackAndForth?: (pattern: BackAndForthPattern) => void
    /** Callback quando o usuário fica muito tempo em uma seção (>10s) */
    onSectionDwell?: (sectionId: string, dwellMs: number) => void
    /** Callback quando filtros mudam */
    onFilterChange?: (filter: FilterEvent) => void
    /** Habilitado? (default: true) */
    enabled?: boolean
}

export interface UseUserBehaviorReturn {
    /** Snapshot atual do comportamento */
    snapshot: UserBehaviorSnapshot
    /** Registrar mudança de filtro manualmente */
    trackFilter: (filterType: FilterEvent["filterType"], values: string[]) => void
    /** Obter resumo textual para enviar à IA */
    getBehaviorSummary: () => string
    /** Limpar histórico da sessão */
    reset: () => void
}

export function useUserBehavior(
    options: UseUserBehaviorOptions = {}
): UseUserBehaviorReturn {
    const {
        sectionIds = [],
        onBackAndForth,
        onSectionDwell,
        onFilterChange,
        enabled = true,
    } = options

    const { pathname } = useLocation()

    // Refs para estado mutável (evitar re-renders desnecessários)
    const sessionStartRef = useRef(Date.now())
    const pageEnterTimeRef = useRef(Date.now())
    const navHistoryRef = useRef<NavigationEvent[]>([])
    const sectionFocusRef = useRef<Map<string, SectionFocusEvent>>(new Map())
    const filterHistoryRef = useRef<FilterEvent[]>([])
    const activeFiltersRef = useRef<FilterEvent[]>([])
    const hoverEventsRef = useRef<HoverEvent[]>([])
    const backAndForthRef = useRef<BackAndForthPattern[]>([])
    const currentSectionRef = useRef<string | null>(null)
    const scrollDepthRef = useRef(0)
    const previousPathnameRef = useRef(pathname)
    const sectionTimersRef = useRef<Map<string, number>>(new Map())
    const hoverTimerRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

    // Estado reativo (para o snapshot exposto)
    const [snapshotVersion, setSnapshotVersion] = useState(0)
    const triggerUpdate = useCallback(() => setSnapshotVersion(v => v + 1), [])

    // ────────────────────────────────────────────────────────────────────────
    // NAVEGAÇÃO: Detectar mudanças de página
    // ────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!enabled) return
        const prev = previousPathnameRef.current
        if (prev !== pathname) {
            const now = Date.now()
            const dwellTime = now - pageEnterTimeRef.current

            // Registrar navegação
            const navEvent: NavigationEvent = {
                from: prev,
                to: pathname,
                timestamp: now,
                dwellTimeMs: dwellTime,
            }
            navHistoryRef.current = [
                ...navHistoryRef.current.slice(-(MAX_NAV_HISTORY - 1)),
                navEvent,
            ]

            // Detectar padrão de ida e volta
            detectBackAndForth(pathname)

            // Reset para nova página
            pageEnterTimeRef.current = now
            sectionFocusRef.current = new Map()
            currentSectionRef.current = null
            scrollDepthRef.current = 0
            previousPathnameRef.current = pathname

            triggerUpdate()
        }
    }, [pathname, enabled, triggerUpdate])

    // ────────────────────────────────────────────────────────────────────────
    // SEÇÕES: IntersectionObserver para detectar seções visíveis
    // ────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!enabled || sectionIds.length === 0) return

        // Aguardar DOM renderizar
        const timeout = setTimeout(() => {
            const elements: Element[] = []
            for (const id of sectionIds) {
                const el = document.getElementById(id)
                if (el) elements.push(el)
            }

            if (elements.length === 0) return

            const observer = new IntersectionObserver(
                (entries) => {
                    const now = Date.now()
                    for (const entry of entries) {
                        const sectionId = entry.target.id
                        if (!sectionId) continue

                        if (entry.isIntersecting) {
                            // Entrou no viewport
                            const existing = sectionFocusRef.current.get(sectionId)
                            if (existing) {
                                existing.enterTime = now
                                existing.exitTime = null
                                existing.revisitCount += 1
                            } else {
                                sectionFocusRef.current.set(sectionId, {
                                    sectionId,
                                    page: pathname,
                                    enterTime: now,
                                    exitTime: null,
                                    dwellTimeMs: 0,
                                    revisitCount: 0,
                                })
                            }
                            currentSectionRef.current = sectionId

                            // Timer para dwell time
                            const timer = window.setInterval(() => {
                                const sec = sectionFocusRef.current.get(sectionId)
                                if (sec && sec.exitTime === null) {
                                    sec.dwellTimeMs += DWELL_UPDATE_INTERVAL_MS
                                    // Callback de dwell prolongado
                                    if (sec.dwellTimeMs > 0 && sec.dwellTimeMs % 10000 === 0 && onSectionDwell) {
                                        onSectionDwell(sectionId, sec.dwellTimeMs)
                                    }
                                }
                            }, DWELL_UPDATE_INTERVAL_MS)
                            sectionTimersRef.current.set(sectionId, timer)
                        } else {
                            // Saiu do viewport
                            const existing = sectionFocusRef.current.get(sectionId)
                            if (existing) {
                                existing.exitTime = now
                            }
                            // Limpar timer
                            const timer = sectionTimersRef.current.get(sectionId)
                            if (timer) {
                                clearInterval(timer)
                                sectionTimersRef.current.delete(sectionId)
                            }
                            if (currentSectionRef.current === sectionId) {
                                currentSectionRef.current = null
                            }
                        }
                    }
                    triggerUpdate()
                },
                { threshold: 0.3 } // 30% visível = "em foco"
            )

            for (const el of elements) {
                observer.observe(el)
            }

            return () => observer.disconnect()
        }, 500) // Aguardar 500ms para DOM

        return () => clearTimeout(timeout)
    }, [pathname, sectionIds, enabled, onSectionDwell, triggerUpdate])

    // ────────────────────────────────────────────────────────────────────────
    // SCROLL: Rastrear profundidade de scroll
    // ────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!enabled) return

        const handleScroll = () => {
            const scrollTop = window.scrollY
            const docHeight = document.documentElement.scrollHeight - window.innerHeight
            if (docHeight > 0) {
                scrollDepthRef.current = Math.round((scrollTop / docHeight) * 100)
            }
        }

        window.addEventListener("scroll", handleScroll, { passive: true })
        return () => window.removeEventListener("scroll", handleScroll)
    }, [enabled])

    // ────────────────────────────────────────────────────────────────────────
    // HOVER: Rastrear hover prolongado em elementos com data-lara-track
    // ────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!enabled) return

        const handleMouseEnter = (e: Event) => {
            const target = e.currentTarget as HTMLElement
            const elementId = target.getAttribute("data-lara-track") || target.id || ""
            if (!elementId) return

            const timer = setTimeout(() => {
                const sectionId = target.closest("[id]")?.id || null
                const hoverEvent: HoverEvent = {
                    elementId,
                    sectionId,
                    page: pathname,
                    timestamp: Date.now(),
                    durationMs: HOVER_THRESHOLD_MS,
                }
                hoverEventsRef.current.push(hoverEvent)
                triggerUpdate()
            }, HOVER_THRESHOLD_MS)

            hoverTimerRef.current.set(elementId, timer)
        }

        const handleMouseLeave = (e: Event) => {
            const target = e.currentTarget as HTMLElement
            const elementId = target.getAttribute("data-lara-track") || target.id || ""
            const timer = hoverTimerRef.current.get(elementId)
            if (timer) {
                clearTimeout(timer)
                hoverTimerRef.current.delete(elementId)
            }
        }

        // Observar elementos com data-lara-track
        const timeout = setTimeout(() => {
            const trackables = document.querySelectorAll("[data-lara-track]")
            trackables.forEach((el) => {
                el.addEventListener("mouseenter", handleMouseEnter)
                el.addEventListener("mouseleave", handleMouseLeave)
            })
        }, 1000)

        return () => {
            clearTimeout(timeout)
            const trackables = document.querySelectorAll("[data-lara-track]")
            trackables.forEach((el) => {
                el.removeEventListener("mouseenter", handleMouseEnter)
                el.removeEventListener("mouseleave", handleMouseLeave)
            })
            hoverTimerRef.current.forEach((timer) => clearTimeout(timer))
            hoverTimerRef.current.clear()
        }
    }, [pathname, enabled, triggerUpdate])

    // ────────────────────────────────────────────────────────────────────────
    // LIMPEZA: Remover eventos antigos (>15 min)
    // ────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!enabled) return

        const cleanup = setInterval(() => {
            const cutoff = Date.now() - SESSION_WINDOW_MS
            navHistoryRef.current = navHistoryRef.current.filter(e => e.timestamp > cutoff)
            filterHistoryRef.current = filterHistoryRef.current.filter(e => e.timestamp > cutoff)
            hoverEventsRef.current = hoverEventsRef.current.filter(e => e.timestamp > cutoff)
            backAndForthRef.current = backAndForthRef.current.filter(e => e.lastDetected > cutoff)
        }, 60000) // Limpar a cada 1 min

        return () => clearInterval(cleanup)
    }, [enabled])

    // ────────────────────────────────────────────────────────────────────────
    // DETECÇÃO: Padrão de ida e volta
    // ────────────────────────────────────────────────────────────────────────
    const detectBackAndForth = useCallback((currentPath: string) => {
        const history = navHistoryRef.current
        if (history.length < 2) return

        // Pegar as últimas 5 navegações
        const recent = history.slice(-5)
        const pages = recent.map(e => e.to)
        pages.push(currentPath)

        // Detectar A → B → A (ida e volta simples)
        for (let i = 0; i < pages.length - 2; i++) {
            if (pages[i] === pages[i + 2] && pages[i] !== pages[i + 1]) {
                const pattern: BackAndForthPattern = {
                    pages: [pages[i], pages[i + 1]],
                    count: 1,
                    firstDetected: Date.now(),
                    lastDetected: Date.now(),
                }

                // Verificar se já existe esse padrão
                const existing = backAndForthRef.current.find(
                    p => p.pages[0] === pattern.pages[0] && p.pages[1] === pattern.pages[1]
                )
                if (existing) {
                    existing.count += 1
                    existing.lastDetected = Date.now()
                } else {
                    backAndForthRef.current.push(pattern)
                }

                if (onBackAndForth) {
                    onBackAndForth(existing || pattern)
                }
            }
        }
    }, [onBackAndForth])

    // ────────────────────────────────────────────────────────────────────────
    // FILTROS: Registrar mudanças de filtro
    // ────────────────────────────────────────────────────────────────────────
    const trackFilter = useCallback((
        filterType: FilterEvent["filterType"],
        values: string[]
    ) => {
        if (!enabled) return

        const event: FilterEvent = {
            filterType,
            values,
            page: pathname,
            timestamp: Date.now(),
        }

        filterHistoryRef.current = [
            ...filterHistoryRef.current.slice(-(MAX_FILTER_HISTORY - 1)),
            event,
        ]

        // Atualizar filtros ativos (último de cada tipo)
        const active = [...activeFiltersRef.current.filter(f => f.filterType !== filterType)]
        if (values.length > 0) {
            active.push(event)
        }
        activeFiltersRef.current = active

        if (onFilterChange) {
            onFilterChange(event)
        }

        triggerUpdate()
    }, [enabled, pathname, onFilterChange, triggerUpdate])

    // ────────────────────────────────────────────────────────────────────────
    // RESUMO: Gerar texto descritivo do comportamento para a IA
    // ────────────────────────────────────────────────────────────────────────
    const getBehaviorSummary = useCallback((): string => {
        const now = Date.now()
        const parts: string[] = []

        // 1. Página atual e tempo
        const pageDwell = now - pageEnterTimeRef.current
        const pageDwellSec = Math.round(pageDwell / 1000)
        const pageNames: Record<string, string> = {
            "/": "Dashboard",
            "/pdvs/ranking": "Ranking Mensal",
            "/pdvs/evolutivo": "Evolutivo",
            "/pdvs/comportamento": "Diagnóstico de Vendas",
            "/pdvs/health-score": "Health Score (Carteira)",
            "/clientes": "Clientes",
            "/nps": "NPS",
            "/feedbacks": "Feedbacks",
        }
        // Health Score individual
        const hsMatch = pathname.match(/\/pdvs\/health-score\/(.+)/)
        const pageName = hsMatch
            ? `Health Score Individual (PDV ${hsMatch[1]})`
            : pageNames[pathname] || pathname

        parts.push(`O usuário está na página "${pageName}" há ${pageDwellSec} segundos.`)

        // 2. Seção em foco
        if (currentSectionRef.current) {
            const sec = sectionFocusRef.current.get(currentSectionRef.current)
            if (sec) {
                const secDwell = Math.round(sec.dwellTimeMs / 1000)
                const sectionNames: Record<string, string> = {
                    "sec-crescimento": "Crescimento da Receita",
                    "sec-evolucao": "Evolução Diária",
                    "sec-evolucao-mensal": "Evolução Mensal",
                    "sec-distribuicao-tipo": "Distribuição por Tipo de Bilhete",
                    "sec-descontos": "Descontos",
                    "sec-cancelamentos": "Cancelamentos",
                    "sec-seguro": "Seguro Viagem",
                    "sec-sentido-viagem": "Sentido de Viagem",
                    "sec-recorrencia": "Recorrência de Clientes",
                    "detalhe-recencia": "Detalhe de Recência",
                    "detalhe-frequencia": "Detalhe de Frequência",
                    "detalhe-tendencia": "Detalhe de Tendência",
                    "detalhe-seguro": "Detalhe de Seguro",
                    "detalhe-metas": "Detalhe de Metas",
                    "detalhe-evolutivo": "Detalhe de Evolutivo",
                }
                const secName = sectionNames[currentSectionRef.current] || currentSectionRef.current
                parts.push(`Está olhando a seção "${secName}" há ${secDwell}s.`)
                if (sec.revisitCount > 0) {
                    parts.push(`Já voltou a essa seção ${sec.revisitCount} vez(es) — parece estar analisando algo específico aqui.`)
                }
            }
        }

        // 3. Seções mais visitadas (top 3 por dwell time)
        const sections = Array.from(sectionFocusRef.current.values())
            .filter(s => s.dwellTimeMs > 3000) // Mais de 3s
            .sort((a, b) => b.dwellTimeMs - a.dwellTimeMs)
            .slice(0, 3)
        if (sections.length > 0) {
            const secList = sections.map(s => {
                const sectionNames: Record<string, string> = {
                    "sec-crescimento": "Crescimento da Receita",
                    "sec-evolucao": "Evolução Diária",
                    "sec-evolucao-mensal": "Evolução Mensal",
                    "sec-distribuicao-tipo": "Distribuição por Tipo",
                    "sec-descontos": "Descontos",
                    "sec-cancelamentos": "Cancelamentos",
                    "sec-seguro": "Seguro Viagem",
                    "sec-sentido-viagem": "Sentido de Viagem",
                    "sec-recorrencia": "Recorrência",
                    "detalhe-recencia": "Recência",
                    "detalhe-frequencia": "Frequência",
                    "detalhe-tendencia": "Tendência",
                    "detalhe-seguro": "Seguro",
                    "detalhe-metas": "Metas",
                    "detalhe-evolutivo": "Evolutivo",
                }
                const name = sectionNames[s.sectionId] || s.sectionId
                return `${name} (${Math.round(s.dwellTimeMs / 1000)}s${s.revisitCount > 0 ? `, revisitou ${s.revisitCount}x` : ""})`
            }).join(", ")
            parts.push(`Seções mais analisadas nesta página: ${secList}.`)
        }

        // 4. Navegação recente
        const recentNav = navHistoryRef.current.slice(-5)
        if (recentNav.length > 0) {
            const navStr = recentNav.map(n => {
                const fromName = pageNames[n.from] || n.from
                const toName = pageNames[n.to] || n.to
                return `${fromName} → ${toName} (ficou ${Math.round(n.dwellTimeMs / 1000)}s)`
            }).join(" | ")
            parts.push(`Navegação recente: ${navStr}.`)
        }

        // 5. Padrões de ida e volta
        if (backAndForthRef.current.length > 0) {
            const patterns = backAndForthRef.current.map(p => {
                const p0 = pageNames[p.pages[0]] || p.pages[0]
                const p1 = pageNames[p.pages[1]] || p.pages[1]
                return `${p0} ↔ ${p1} (${p.count}x)`
            }).join(", ")
            parts.push(`PADRÃO DETECTADO — ida e volta entre páginas: ${patterns}. O usuário parece estar comparando informações entre essas telas.`)
        }

        // 6. Filtros ativos
        if (activeFiltersRef.current.length > 0) {
            const filters = activeFiltersRef.current.map(f => {
                const typeNames: Record<string, string> = {
                    tipo: "Tipo de PDV",
                    categoria: "Categoria",
                    pdv: "PDV específico",
                    periodo: "Período",
                    mes: "Mês",
                    ano: "Ano",
                }
                return `${typeNames[f.filterType] || f.filterType}: ${f.values.join(", ")}`
            }).join(" | ")
            parts.push(`Filtros ativos: ${filters}.`)
        }

        // 7. Mudanças frequentes de filtro
        const recentFilters = filterHistoryRef.current.filter(
            f => f.timestamp > now - 120000 // Últimos 2 min
        )
        if (recentFilters.length >= 3) {
            const filterTypes = [...new Set(recentFilters.map(f => f.filterType))]
            if (filterTypes.length === 1) {
                parts.push(`O usuário mudou o filtro de "${filterTypes[0]}" ${recentFilters.length} vezes nos últimos 2 minutos — parece estar comparando cenários diferentes.`)
            } else {
                parts.push(`O usuário alterou filtros ${recentFilters.length} vezes nos últimos 2 minutos (${filterTypes.join(", ")}) — está explorando diferentes recortes dos dados.`)
            }
        }

        // 8. Scroll depth
        if (scrollDepthRef.current > 80) {
            parts.push(`O usuário scrollou até ${scrollDepthRef.current}% da página — explorou quase todo o conteúdo.`)
        } else if (scrollDepthRef.current < 30 && pageDwellSec > 30) {
            parts.push(`O usuário está há ${pageDwellSec}s na página mas só scrollou ${scrollDepthRef.current}% — está focado no topo (KPIs e resumo).`)
        }

        return parts.join(" ")
    }, [pathname])

    // ────────────────────────────────────────────────────────────────────────
    // RESET
    // ────────────────────────────────────────────────────────────────────────
    const reset = useCallback(() => {
        sessionStartRef.current = Date.now()
        pageEnterTimeRef.current = Date.now()
        navHistoryRef.current = []
        sectionFocusRef.current = new Map()
        filterHistoryRef.current = []
        activeFiltersRef.current = []
        hoverEventsRef.current = []
        backAndForthRef.current = []
        currentSectionRef.current = null
        scrollDepthRef.current = 0
        triggerUpdate()
    }, [triggerUpdate])

    // ────────────────────────────────────────────────────────────────────────
    // SNAPSHOT (memo com version)
    // ────────────────────────────────────────────────────────────────────────
    const snapshot: UserBehaviorSnapshot = {
        currentPage: pathname,
        currentPageDwellMs: Date.now() - pageEnterTimeRef.current,
        navigationHistory: navHistoryRef.current,
        sectionFocus: sectionFocusRef.current,
        currentSection: currentSectionRef.current,
        filterHistory: filterHistoryRef.current,
        activeFilters: activeFiltersRef.current,
        backAndForthPatterns: backAndForthRef.current,
        hoverEvents: hoverEventsRef.current,
        scrollDepth: scrollDepthRef.current,
        sessionStart: sessionStartRef.current,
    }

    // Suprimir warning de snapshotVersion não usado (é intencional para trigger)
    void snapshotVersion

    return {
        snapshot,
        trackFilter,
        getBehaviorSummary,
        reset,
    }
}
