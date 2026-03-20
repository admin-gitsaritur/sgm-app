"use client"

import { useState, useMemo, type ReactNode } from "react"
import { ArrowUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================================================
// ModalDataList — Tabela de listagem para modais e containers
// ============================================================================
//
// Componente reutilizável que renderiza dados em formato de lista com:
// - Header com colunas sortáveis
// - Rows como cards com border-radius e hover
// - Estética premium idêntica ao padrão do sistema
//
// Uso:
//   import { ModalDataList, type ModalDataColumn } from "@/components/ui/modal-data-list"
//
//   const columns: ModalDataColumn<MyItem>[] = [
//     { key: 'nome', header: 'Nome', align: 'left', sortable: true, render: (_, row) => row.nome },
//     { key: 'valor', header: 'Valor', align: 'right', sortable: true, render: (_, row) => `R$ ${row.valor}` },
//   ]
//
//   <ModalDataList data={items} columns={columns} rowKey="id" />
//
// Para uso dentro de containers (não-modal), adicione `variant="container"`.
// ============================================================================

/**
 * Definição de coluna para o ModalDataList.
 * Segue o mesmo padrão do DataTable para familiaridade.
 */
export interface ModalDataColumn<T> {
    /** Chave única da coluna (usada como sortField) */
    key: string
    /** Texto do header */
    header: string
    /** Alinhamento do conteúdo: left, center, right */
    align?: 'left' | 'center' | 'right'
    /** Se a coluna é sortável */
    sortable?: boolean
    /** Função de renderização customizada. Recebe o valor e a row completa. */
    render: (value: unknown, row: T) => ReactNode
    /** Função de comparação customizada para sort. Se não fornecida, usa comparação padrão. */
    sortFn?: (a: T, b: T) => number
}

interface ModalDataListProps<T> {
    /** Array de dados a exibir */
    data: T[]
    /** Definição das colunas */
    columns: ModalDataColumn<T>[]
    /** Campo usado como key única de cada row */
    rowKey: keyof T
    /** Variante visual: 'modal' (padrão) ou 'container' */
    variant?: 'modal' | 'container'
    /** Classe CSS adicional no container raiz */
    className?: string
    /** Mensagem quando não há dados */
    emptyMessage?: string
    /** Campo de sort inicial */
    defaultSortField?: string
    /** Ordem de sort inicial */
    defaultSortOrder?: 'asc' | 'desc'
    /** Template de grid columns (CSS). Se não fornecido, distribui igualmente. */
    gridTemplate?: string
    /** Callback de clique na row */
    onRowClick?: (row: T) => void
    /** Altura máxima do container de dados (scroll interno) */
    maxHeight?: string
}

/**
 * ModalDataList — Tabela de listagem para modais e containers.
 *
 * Renderiza dados como lista de cards com header sortável, 
 * seguindo a estética premium do sistema (border-radius, hover, cores stone).
 */
export function ModalDataList<T>({
    data,
    columns,
    rowKey,
    variant = 'modal',
    className,
    emptyMessage = 'Nenhum item encontrado',
    defaultSortField,
    defaultSortOrder = 'desc',
    gridTemplate,
    onRowClick,
    maxHeight,
}: ModalDataListProps<T>) {
    const [sortField, setSortField] = useState<string>(defaultSortField || columns[0]?.key || '')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(defaultSortOrder)

    // Gerar grid template automaticamente se não fornecido
    const computedGridTemplate = gridTemplate || columns.map(() => '1fr').join(' ')

    // Ordenar dados
    const sortedData = useMemo(() => {
        const col = columns.find(c => c.key === sortField)
        if (!col?.sortable) return data

        return [...data].sort((a, b) => {
            const order = sortOrder === 'asc' ? 1 : -1

            // Se há sortFn customizada, usá-la
            if (col.sortFn) {
                return order * col.sortFn(a, b)
            }

            // Sort padrão: string ou número
            const valA = (a as Record<string, unknown>)[sortField]
            const valB = (b as Record<string, unknown>)[sortField]

            if (typeof valA === 'string' && typeof valB === 'string') {
                return order * valA.localeCompare(valB, 'pt-BR')
            }
            if (typeof valA === 'number' && typeof valB === 'number') {
                return order * (valA - valB)
            }

            return 0
        })
    }, [data, sortField, sortOrder, columns])

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortOrder(field === 'nome' ? 'asc' : 'desc')
        }
    }

    if (data.length === 0) {
        return (
            <div className={cn("py-12 text-center text-sm text-stone-400", className)}>
                {emptyMessage}
            </div>
        )
    }

    return (
        <div className={cn(
            variant === 'container' && 'border border-stone-200 rounded-2xl overflow-hidden',
            className
        )}>
            {/* Header */}
            <div className="px-3 pt-1">
                <div
                    className="items-center"
                    style={{ display: 'grid', gridTemplateColumns: computedGridTemplate }}
                >
                    {columns.map(col => (
                        <button
                            key={col.key}
                            onClick={() => col.sortable && handleSort(col.key)}
                            disabled={!col.sortable}
                            className={cn(
                                "group flex items-center gap-1.5 py-3 px-4 text-[11px] font-bold uppercase tracking-wider transition-colors",
                                col.sortable
                                    ? "cursor-pointer"
                                    : "cursor-default",
                                sortField === col.key
                                    ? 'text-primary'
                                    : col.sortable
                                        ? 'text-stone-400 hover:text-primary'
                                        : 'text-stone-400',
                                col.align === 'center' ? 'justify-center' :
                                    col.align === 'right' ? 'justify-end' : 'justify-start'
                            )}
                        >
                            {col.header}
                            {col.sortable && (
                                <ArrowUpDown className={cn(
                                    "h-3 w-3 transition-opacity",
                                    sortField === col.key
                                        ? 'opacity-100'
                                        : 'opacity-30 group-hover:opacity-100'
                                )} />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Rows */}
            <div
                className="flex flex-col gap-2 py-3 px-3"
                style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}
            >
                {sortedData.map(row => (
                    <div
                        key={String((row as Record<string, unknown>)[rowKey as string])}
                        className={cn(
                            "items-center bg-white border border-stone-100 rounded-xl px-4 py-3 transition-colors",
                            onRowClick
                                ? 'cursor-pointer hover:bg-stone-50'
                                : 'hover:bg-stone-50'
                        )}
                        style={{ display: 'grid', gridTemplateColumns: computedGridTemplate }}
                        onClick={() => onRowClick?.(row)}
                    >
                        {columns.map(col => {
                            const value = (row as Record<string, unknown>)[col.key]
                            return (
                                <span
                                    key={col.key}
                                    className={cn(
                                        "flex items-center",
                                        col.align === 'center' ? 'justify-center' :
                                            col.align === 'right' ? 'justify-end' : 'justify-start'
                                    )}
                                >
                                    {col.render(value, row)}
                                </span>
                            )
                        })}
                    </div>
                ))}
            </div>
        </div>
    )
}
