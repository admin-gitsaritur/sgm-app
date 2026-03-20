"use client"

import * as React from "react"
import { useMemo, useState, useCallback, useEffect, useRef } from "react"
import { MultiSelectFilter } from "@/components/ui/multi-select-filter"
import { cn } from "@/lib/utils"

// ============================================================================
// TYPES
// ============================================================================

export interface FilterOption {
    value: string
    label: string
}

export interface PdvItem {
    id: string
    nome: string
    empresa?: string | null
    tipo?: string | null
    classificacao?: string | null
    agenciaCodigos?: string[]
}

export interface UsePdvFilterOptions {
    /** Lista de PDVs retornada pela API */
    pdvs: PdvItem[]
    /** Lista de tipos disponíveis */
    tipos: FilterOption[]
    /** Lista de categorias disponíveis */
    categorias: FilterOption[]
    /** Tipos pré-selecionados (ex: ['Internet', 'Própria', 'Terceirizado']) */
    defaultTipos?: string[]
}

export interface PdvFilterState {
    selectedTipos: string[]
    setSelectedTipos: React.Dispatch<React.SetStateAction<string[]>>
    selectedCategorias: string[]
    setSelectedCategorias: React.Dispatch<React.SetStateAction<string[]>>
    selectedPdvs: string[]
    setSelectedPdvs: React.Dispatch<React.SetStateAction<string[]>>
    /** Tipos filtrados por categoria selecionada */
    tipoOptions: FilterOption[]
    /** Categorias filtradas por tipo selecionado */
    categoriaOptions: FilterOption[]
    /** PDVs filtrados por tipo+categoria (deduplicados) */
    pdvOptions: FilterOption[]
    /** IDs efetivos: PDVs selecionados ou resolvidos via tipo/categoria */
    effectivePdvIds: string[]
    /** IDs efetivos com debounce de 3s — usar para disparar fetches */
    debouncedEffectivePdvIds: string[]
    /** Handler cascata para mudança de tipo */
    handleTipoChange: (newTipos: string[]) => void
    /** Handler cascata para mudança de categoria */
    handleCategoriaChange: (newCategorias: string[]) => void
    /** Limpar todos os filtros */
    resetAll: () => void
}

// ============================================================================
// HOOK: usePdvFilter
// ============================================================================

/**
 * Hook que encapsula toda a lógica de filtros cascata Tipo → Categoria → PDV.
 *
 * @example
 * ```tsx
 * const filter = usePdvFilter({
 *   pdvs: data?.filtros?.pdvs || [],
 *   tipos: data?.filtros?.tipos || [],
 *   categorias: data?.filtros?.categorias || [],
 *   defaultTipos: ['Internet', 'Própria'],
 * })
 *
 * // Usar effectivePdvIds para buscar dados filtrados
 * useEffect(() => { fetchData(filter.effectivePdvIds) }, [filter.effectivePdvIds])
 *
 * // Renderizar barra de filtros
 * <PdvFilterBar filter={filter}>
 *   <BotaoExtra />
 * </PdvFilterBar>
 * ```
 */
export function usePdvFilter({
    pdvs,
    tipos,
    categorias,
    defaultTipos = [],
}: UsePdvFilterOptions): PdvFilterState {
    const [selectedTipos, setSelectedTipos] = useState<string[]>(defaultTipos)
    const [selectedCategorias, setSelectedCategorias] = useState<string[]>([])
    const [selectedPdvs, setSelectedPdvs] = useState<string[]>([])

    // State separado para PDVs do filtro — preenchido apenas na 1ª carga
    // Evita que mudanças no `pdvs` (que varia com dados filtrados) resetem a lista base
    const [filterPdvsList, setFilterPdvsList] = useState<PdvItem[]>([])

    // Popular filterPdvsList na primeira carga
    useEffect(() => {
        if (pdvs.length > 0 && filterPdvsList.length === 0) {
            setFilterPdvsList(pdvs)
        }
    }, [pdvs, filterPdvsList.length])

    // Cascata: quando tipo muda, limpar PDVs que não pertencem
    const handleTipoChange = useCallback((newTipos: string[]) => {
        setSelectedTipos(newTipos)
        if (newTipos.length > 0) {
            setSelectedPdvs(prev => prev.filter(pdvId => {
                const pdv = filterPdvsList.find(p => p.id === pdvId)
                return pdv?.tipo && newTipos.includes(pdv.tipo)
            }))
        }
    }, [filterPdvsList])

    // Cascata: quando categoria muda, limpar PDVs que não pertencem
    const handleCategoriaChange = useCallback((newCategorias: string[]) => {
        setSelectedCategorias(newCategorias)
        if (newCategorias.length > 0) {
            setSelectedPdvs(prev => prev.filter(pdvId => {
                const pdv = filterPdvsList.find(p => p.id === pdvId)
                return pdv?.classificacao && newCategorias.includes(pdv.classificacao)
            }))
        }
    }, [filterPdvsList])

    // Tipo options filtrados por categoria selecionada
    const tipoOptions = useMemo(() => {
        if (tipos.length === 0) return []
        if (selectedCategorias.length === 0) return tipos
        const tiposComPdvs = new Set(
            filterPdvsList
                .filter(p => p.classificacao && selectedCategorias.includes(p.classificacao))
                .map(p => p.tipo)
                .filter(Boolean)
        )
        return tipos.filter(t => tiposComPdvs.has(t.value))
    }, [tipos, selectedCategorias, filterPdvsList])

    // Categoria options filtradas por tipo selecionado
    const categoriaOptions = useMemo(() => {
        if (categorias.length === 0) return []
        if (selectedTipos.length === 0) return categorias
        const categoriasComPdvs = new Set(
            filterPdvsList
                .filter(p => p.tipo && selectedTipos.includes(p.tipo))
                .map(p => p.classificacao)
                .filter(Boolean)
        )
        return categorias.filter(c => categoriasComPdvs.has(c.value))
    }, [categorias, selectedTipos, filterPdvsList])

    // PDV options filtrados por tipo + categoria (deduplicados)
    const pdvOptions = useMemo(() => {
        if (pdvs.length === 0) return []
        let filtered = pdvs
        if (selectedTipos.length > 0) {
            filtered = filtered.filter(p => p.tipo && selectedTipos.includes(p.tipo))
        }
        if (selectedCategorias.length > 0) {
            filtered = filtered.filter(p => p.classificacao && selectedCategorias.includes(p.classificacao))
        }
        // Deduplicar por id
        const seen = new Set<string>()
        return filtered
            .filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true })
            .map(p => ({ value: p.id, label: p.nome }))
            .sort((a, b) => a.label.localeCompare(b.label))
    }, [pdvs, selectedTipos, selectedCategorias])

    // Effective PDV IDs: selecionados ou resolvidos via tipo/categoria
    const effectivePdvIds = useMemo(() => {
        if (selectedPdvs.length > 0) return selectedPdvs
        if (filterPdvsList.length === 0) return []
        if (selectedTipos.length === 0 && selectedCategorias.length === 0) return []
        let filtered = filterPdvsList
        if (selectedTipos.length > 0) {
            filtered = filtered.filter(p => p.tipo && selectedTipos.includes(p.tipo))
        }
        if (selectedCategorias.length > 0) {
            filtered = filtered.filter(p => p.classificacao && selectedCategorias.includes(p.classificacao))
        }
        return [...new Set(filtered.map(p => p.id))]
    }, [selectedPdvs, selectedTipos, selectedCategorias, filterPdvsList])

    const resetAll = useCallback(() => {
        setSelectedTipos(defaultTipos)
        setSelectedCategorias([])
        setSelectedPdvs([])
    }, [defaultTipos])

    // Debounce de 3s nos effectivePdvIds — evita fetch a cada mudança parcial
    const [debouncedEffectivePdvIds, setDebouncedEffectivePdvIds] = useState<string[]>(effectivePdvIds)
    const isFirstRender = useRef(true)
    useEffect(() => {
        // Primeiro render: sincronizar imediatamente
        if (isFirstRender.current) {
            isFirstRender.current = false
            setDebouncedEffectivePdvIds(effectivePdvIds)
            return
        }
        // Mudanças subsequentes: debounce 3s
        const timer = setTimeout(() => setDebouncedEffectivePdvIds(effectivePdvIds), 3000)
        return () => clearTimeout(timer)
    }, [effectivePdvIds])

    return {
        selectedTipos, setSelectedTipos,
        selectedCategorias, setSelectedCategorias,
        selectedPdvs, setSelectedPdvs,
        tipoOptions,
        categoriaOptions,
        pdvOptions,
        effectivePdvIds,
        debouncedEffectivePdvIds,
        handleTipoChange,
        handleCategoriaChange,
        resetAll,
    }
}

// ============================================================================
// COMPONENTE: PdvFilterBar
// ============================================================================

interface PdvFilterBarProps {
    /** Estado do filtro retornado por usePdvFilter */
    filter: PdvFilterState
    /** Elementos extras renderizados à direita (botões, seletor de período) */
    children?: React.ReactNode
    className?: string
}

/**
 * Barra de filtros reutilizável Tipo → Categoria → PDV.
 *
 * @example
 * ```tsx
 * const filter = usePdvFilter({ pdvs, tipos, categorias })
 * <PdvFilterBar filter={filter}>
 *   <RefreshButton />
 * </PdvFilterBar>
 * ```
 */
export function PdvFilterBar({ filter, children, className }: PdvFilterBarProps) {
    return (
        <div className={cn("flex flex-wrap items-center gap-3", className)}>
            <MultiSelectFilter
                label="Tipo"
                options={filter.tipoOptions}
                selected={filter.selectedTipos}
                onChange={filter.handleTipoChange}
                placeholder="Todos"
            />
            <MultiSelectFilter
                label="Categoria"
                options={filter.categoriaOptions}
                selected={filter.selectedCategorias}
                onChange={filter.handleCategoriaChange}
                placeholder="Todas"
            />
            <MultiSelectFilter
                label="PDV"
                options={filter.pdvOptions}
                selected={filter.selectedPdvs}
                onChange={filter.setSelectedPdvs}
                placeholder="Todos"
            />
            {children}
        </div>
    )
}
