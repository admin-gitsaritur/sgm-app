/**
 * ModalDataList — Tabela de listagem para modais e containers (Saritur CX)
 *
 * DESIGN VISUAL:
 * • Header: grid com colunas sortáveis, text-[11px] uppercase tracking-wider
 *   – Ativo: text-primary
 *   – Hover: text-primary com seta opacity-100
 *   – Seta: ArrowUpDown h-3 w-3, opacity-30 padrão
 * • Rows: cards individuais rounded-xl, border stone-100
 *   – Grid CSS (gridTemplateColumns)
 *   – Hover: bg-stone-50
 *   – px-4 py-3
 * • Container: gap-2 entre rows, py-3 px-3
 * • Empty: py-12 text-center stone-400
 * • Variante "container": border stone-200 rounded-2xl overflow-hidden
 * • Sort automático por coluna (bidirecional)
 * • maxHeight com scroll interno
 */

import { useState, useMemo, type ReactNode } from "react"
import { ArrowUpDown } from "lucide-react"
import { cn } from "../../lib/utils"

export interface ModalDataColumn<T> {
    key: string
    header: string
    align?: 'left' | 'center' | 'right'
    sortable?: boolean
    render: (value: unknown, row: T) => ReactNode
    sortFn?: (a: T, b: T) => number
}

interface ModalDataListProps<T> {
    data: T[]
    columns: ModalDataColumn<T>[]
    rowKey: keyof T
    variant?: 'modal' | 'container'
    className?: string
    emptyMessage?: string
    defaultSortField?: string
    defaultSortOrder?: 'asc' | 'desc'
    gridTemplate?: string
    onRowClick?: (row: T) => void
    maxHeight?: string
}

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

    const computedGridTemplate = gridTemplate || columns.map(() => '1fr').join(' ')

    const sortedData = useMemo(() => {
        const col = columns.find(c => c.key === sortField)
        if (!col?.sortable) return data
        return [...data].sort((a, b) => {
            const order = sortOrder === 'asc' ? 1 : -1
            if (col.sortFn) return order * col.sortFn(a, b)
            const valA = (a as Record<string, unknown>)[sortField]
            const valB = (b as Record<string, unknown>)[sortField]
            if (typeof valA === 'string' && typeof valB === 'string') return order * valA.localeCompare(valB, 'pt-BR')
            if (typeof valA === 'number' && typeof valB === 'number') return order * (valA - valB)
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
        return <div className={cn("py-12 text-center text-sm text-stone-400", className)}>{emptyMessage}</div>
    }

    return (
        <div className={cn(variant === 'container' && 'border border-stone-200 rounded-2xl overflow-hidden', className)}>
            <div className="px-3 pt-1">
                <div className="items-center" style={{ display: 'grid', gridTemplateColumns: computedGridTemplate }}>
                    {columns.map(col => (
                        <button
                            key={col.key}
                            onClick={() => col.sortable && handleSort(col.key)}
                            disabled={!col.sortable}
                            className={cn(
                                "group flex items-center gap-1.5 py-3 px-4 text-[11px] font-bold uppercase tracking-wider transition-colors",
                                col.sortable ? "cursor-pointer" : "cursor-default",
                                sortField === col.key ? 'text-primary' : col.sortable ? 'text-stone-400 hover:text-primary' : 'text-stone-400',
                                col.align === 'center' ? 'justify-center' : col.align === 'right' ? 'justify-end' : 'justify-start'
                            )}
                        >
                            {col.header}
                            {col.sortable && (
                                <ArrowUpDown className={cn("h-3 w-3 transition-opacity", sortField === col.key ? 'opacity-100' : 'opacity-30 group-hover:opacity-100')} />
                            )}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex flex-col gap-2 py-3 px-3" style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}>
                {sortedData.map(row => (
                    <div
                        key={String((row as Record<string, unknown>)[rowKey as string])}
                        className={cn("items-center bg-white border border-stone-100 rounded-xl px-4 py-3 transition-colors", onRowClick ? 'cursor-pointer hover:bg-stone-50' : 'hover:bg-stone-50')}
                        style={{ display: 'grid', gridTemplateColumns: computedGridTemplate }}
                        onClick={() => onRowClick?.(row)}
                    >
                        {columns.map(col => {
                            const value = (row as Record<string, unknown>)[col.key]
                            return (
                                <span key={col.key} className={cn("flex items-center", col.align === 'center' ? 'justify-center' : col.align === 'right' ? 'justify-end' : 'justify-start')}>
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
