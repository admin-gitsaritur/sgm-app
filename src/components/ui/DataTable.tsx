

import * as React from "react"
import { cn } from "../../lib/utils"
import { Loader2, ChevronLeft, ChevronRight, MoreHorizontal, ArrowUpDown, SearchX } from "lucide-react"
import { SearchInput } from "./SearchInput"

// ============================================================================
// TIPOS
// ============================================================================

export interface Column<T> {
    key: keyof T | string
    header: string
    width?: string
    align?: "left" | "center" | "right"
    sortable?: boolean
    hiddenOnMobile?: boolean
    cellVariant?: 'primary' | 'secondary' | 'none'
    render?: (value: unknown, row: T, index: number) => React.ReactNode
}

export interface Tab {
    key: string
    label: string
    count?: number
}

export interface DataTableProps<T> {
    data: T[]
    columns: Column<T>[]
    loading?: boolean
    rowKey: keyof T | ((row: T) => string)
    emptyMessage?: string
    emptyIcon?: React.ReactNode
    onRowClick?: (row: T) => void
    sortField?: string
    sortOrder?: "asc" | "desc"
    onSortChange?: (field: string, order: "asc" | "desc") => void
    className?: string
    tabs?: Tab[]
    activeTab?: string
    onTabChange?: (tab: string) => void
    searchPlaceholder?: string
    searchValue?: string
    onSearchChange?: (value: string) => void
    hideSearch?: boolean
    actionButton?: React.ReactNode
    afterSearch?: React.ReactNode
    pagination?: {
        page: number
        pageSize: number
        total: number
        onPageChange: (page: number) => void
    }
    selectable?: boolean
    selectedIds?: string[]
    onSelect?: (ids: string[]) => void
    labels?: {
        showingPrefix?: string
        showingConnector?: string
        showingOf?: string
        showingResults?: string
    }
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function DataTable<T>({
    data,
    columns,
    loading = false,
    rowKey,
    emptyMessage = "Nenhum dado encontrado",
    emptyIcon,
    onRowClick,
    sortField,
    sortOrder = "asc",
    onSortChange,
    className,
    tabs,
    activeTab,
    onTabChange,
    searchPlaceholder = "Buscar...",
    searchValue = "",
    onSearchChange,
    hideSearch = false,
    actionButton,
    afterSearch,
    pagination,
    selectable = false,
    selectedIds = [],
    onSelect,
    labels = {},
}: DataTableProps<T>) {
    const {
        showingPrefix = "Mostrando",
        showingConnector = "a",
        showingOf = "de",
        showingResults = "resultados",
    } = labels
    const tabsRef = React.useRef<HTMLDivElement>(null)
    const [indicatorStyle, setIndicatorStyle] = React.useState({ left: 0, width: 0 })

    React.useEffect(() => {
        if (tabsRef.current && activeTab) {
            const activeElement = tabsRef.current.querySelector(`[data-tab="${activeTab}"]`) as HTMLElement
            if (activeElement) {
                setIndicatorStyle({
                    left: activeElement.offsetLeft,
                    width: activeElement.offsetWidth
                })
            }
        }
    }, [activeTab])

    const getRowKey = (row: T, index: number): string => {
        if (typeof rowKey === "function") return rowKey(row)
        return String(row[rowKey] ?? index)
    }

    const getCellValue = (row: T, key: string): unknown => {
        const keys = key.split(".")
        let value: unknown = row
        for (const k of keys) {
            if (value && typeof value === "object" && k in value) {
                value = (value as Record<string, unknown>)[k]
            } else {
                return undefined
            }
        }
        return value
    }

    const handleSort = (column: Column<T>) => {
        if (!onSortChange) return
        const field = String(column.key)
        if (sortField === field) {
            onSortChange(field, sortOrder === "asc" ? "desc" : "asc")
        } else {
            onSortChange(field, "desc")
        }
    }

    const handleSelectAll = () => {
        if (!onSelect) return
        const allIds = data.map((row, i) => getRowKey(row, i))
        onSelect(selectedIds.length === data.length ? [] : allIds)
    }

    const handleSelectRow = (id: string) => {
        if (!onSelect) return
        onSelect(selectedIds.includes(id) ? selectedIds.filter(i => i !== id) : [...selectedIds, id])
    }

    const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 1
    const startItem = pagination ? (pagination.page - 1) * pagination.pageSize + 1 : 1
    const endItem = pagination ? Math.min(pagination.page * pagination.pageSize, pagination.total) : data.length

    return (
        <div className={cn("flex flex-col h-full", className)}>
            {(!hideSearch || actionButton) && (
                <div className="flex flex-col md:flex-row gap-4 mb-6 shrink-0">
                    {!hideSearch && (
                        <SearchInput
                            value={searchValue}
                            onChange={(value) => onSearchChange?.(value)}
                            placeholder={searchPlaceholder}
                        />
                    )}
                    {actionButton && (
                        <div className="shrink-0 [&>button]:h-12 [&>button]:w-full md:[&>button]:w-auto">
                            {actionButton}
                        </div>
                    )}
                </div>
            )}

            {afterSearch && <div className="mb-6">{afterSearch}</div>}

            <div className="flex-1 bg-white rounded-[24px] border border-stone-200 shadow-[0_4px_24px_rgba(78,50,5,0.04)] flex flex-col min-h-0 relative overflow-hidden">
                {tabs && tabs.length > 0 && (
                    <div className="relative border-b border-stone-100 px-6 pt-2 shrink-0 bg-white z-20">
                        <div ref={tabsRef} className="flex space-x-6">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    data-tab={tab.key}
                                    onClick={() => onTabChange?.(tab.key)}
                                    className={cn(
                                        "py-4 text-xs font-semibold uppercase tracking-wide transition-colors",
                                        activeTab === tab.key ? "text-primary" : "text-stone-400 hover:text-primary"
                                    )}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <div className="absolute bottom-0 h-0.5 bg-primary transition-all duration-300" style={indicatorStyle} />
                    </div>
                )}

                {loading && (
                    <div className="flex-1 flex items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}

                {!loading && data.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center py-16 text-stone-400">
                        {emptyIcon || <SearchX className="h-16 w-16 mb-4 opacity-50" />}
                        <p className="text-lg font-medium">{emptyMessage}</p>
                    </div>
                )}

                {!loading && data.length > 0 && (
                    <div className="flex-1 overflow-x-auto overflow-y-auto relative">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead className="bg-white sticky top-0 z-10 border-b border-stone-100">
                                <tr>
                                    {selectable && (
                                        <th className="py-3 px-4 w-[50px] bg-white">
                                            <input type="checkbox" checked={selectedIds.length === data.length && data.length > 0} onChange={handleSelectAll}
                                                className="rounded border-stone-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer" />
                                        </th>
                                    )}
                                    {columns.map((column) => (
                                        <th key={String(column.key)}
                                            className={cn(
                                                "py-3 px-4 text-[11px] font-bold text-stone-400 uppercase tracking-wider bg-white cursor-pointer hover:text-primary transition-colors group",
                                                column.align === "center" && "text-center",
                                                column.align === "right" && "text-right",
                                                column.hiddenOnMobile && "hidden md:table-cell"
                                            )}
                                            style={column.width ? { width: column.width } : undefined}
                                            onClick={() => handleSort(column)}
                                        >
                                            <div className={cn("flex items-center gap-1.5",
                                                column.align === "center" && "justify-center",
                                                column.align === "right" && "justify-end"
                                            )}>
                                                {column.header}
                                                <ArrowUpDown className="h-3 w-3 opacity-30 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-50">
                                {data.map((row, rowIndex) => {
                                    const id = getRowKey(row, rowIndex)
                                    const isSelected = selectedIds.includes(id)
                                    return (
                                        <tr key={id}
                                            className={cn("group hover:bg-stone-50 transition-colors", onRowClick && "cursor-pointer", isSelected && "bg-primary/5")}
                                            onClick={() => onRowClick?.(row)}
                                        >
                                            {selectable && (
                                                <td className="py-3 px-4">
                                                    <input type="checkbox" checked={isSelected}
                                                        onChange={(e) => { e.stopPropagation(); handleSelectRow(id) }}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="rounded border-stone-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer" />
                                                </td>
                                            )}
                                            {columns.map((column, colIndex) => {
                                                const value = getCellValue(row, String(column.key))
                                                const variant = column.cellVariant ?? (colIndex === 0 ? 'primary' : 'secondary')
                                                const rawContent = column.render ? column.render(value, row, rowIndex) : value != null ? String(value) : "-"
                                                const content = (variant !== 'none' && rawContent != null && !React.isValidElement(rawContent))
                                                    ? variant === 'primary'
                                                        ? <DataTableCellPrimary>{rawContent}</DataTableCellPrimary>
                                                        : <DataTableCellSecondary>{rawContent}</DataTableCellSecondary>
                                                    : rawContent ?? "-"
                                                return (
                                                    <td key={String(column.key)} className={cn("py-3 px-4",
                                                        column.align === "center" && "text-center",
                                                        column.align === "right" && "text-right",
                                                        column.hiddenOnMobile && "hidden md:table-cell"
                                                    )}>
                                                        {column.align ? (
                                                            <div className={cn("flex", column.align === "center" && "justify-center", column.align === "right" && "justify-end")}>
                                                                {content}
                                                            </div>
                                                        ) : content}
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && data.length > 0 && (
                    <div className="px-6 py-5 border-t border-stone-100 bg-stone-50/30 flex items-center justify-between shrink-0 rounded-b-3xl">
                        <span className="text-xs text-stone-400">
                            {pagination ? (
                                <>{showingPrefix} <strong>{startItem.toLocaleString("pt-BR")}</strong> {showingConnector} <strong>{endItem.toLocaleString("pt-BR")}</strong> {showingOf} <strong>{pagination.total.toLocaleString("pt-BR")}</strong> {showingResults}</>
                            ) : (
                                <>{showingPrefix} <strong>{data.length.toLocaleString("pt-BR")}</strong> {showingResults}</>
                            )}
                        </span>

                        {pagination && (
                            <div className="flex items-center gap-2">
                                <button className={cn("h-9 w-9 flex items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-400 transition-colors",
                                    pagination.page === 1 ? "cursor-not-allowed opacity-50" : "hover:text-primary hover:border-primary"
                                )} disabled={pagination.page === 1} onClick={() => pagination.onPageChange(pagination.page - 1)}>
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                        let pageNum: number
                                        if (totalPages <= 5) pageNum = i + 1
                                        else if (pagination.page <= 3) pageNum = i + 1
                                        else if (pagination.page >= totalPages - 2) pageNum = totalPages - 4 + i
                                        else pageNum = pagination.page - 2 + i
                                        return (
                                            <button key={pageNum} onClick={() => pagination.onPageChange(pageNum)}
                                                className={cn("w-9 h-9 rounded-lg text-xs font-semibold flex items-center justify-center transition-all",
                                                    pageNum === pagination.page ? "bg-brown text-white shadow-md" : "bg-white border border-stone-200 text-stone-600 hover:border-primary hover:text-primary"
                                                )}>
                                                {pageNum}
                                            </button>
                                        )
                                    })}
                                    {totalPages > 5 && pagination.page < totalPages - 2 && (
                                        <>
                                            <span className="text-stone-400 text-xs px-1">...</span>
                                            <button onClick={() => pagination.onPageChange(totalPages)}
                                                className="w-9 h-9 rounded-lg text-xs font-semibold bg-white border border-stone-200 text-stone-600 hover:border-primary hover:text-primary flex items-center justify-center">
                                                {totalPages}
                                            </button>
                                        </>
                                    )}
                                </div>
                                <button className={cn("h-9 w-9 flex items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-400 transition-colors",
                                    pagination.page === totalPages ? "cursor-not-allowed opacity-50" : "hover:text-primary hover:border-primary"
                                )} disabled={pagination.page === totalPages} onClick={() => pagination.onPageChange(pagination.page + 1)}>
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

export function DataTableCellPrimary({ children, subtitle, muted = false }: { children: React.ReactNode; subtitle?: string; muted?: boolean }) {
    return (
        <div className={cn("flex flex-col", muted && "opacity-40")}>
            <span className="text-sm font-semibold text-brown group-hover:text-primary transition-colors">{children}</span>
            {subtitle && <span className="text-[10px] text-stone-400 mt-0.5">{subtitle}</span>}
        </div>
    )
}

export function DataTableCellSecondary({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
    return <span className={cn("text-sm text-stone-600", muted && "opacity-40")}>{children}</span>
}

export function DataTableStatusBadge({ status, variant = "default" }: { status: string; variant?: "success" | "warning" | "info" | "default" | "danger" }) {
    const styles = { success: "bg-emerald-50 text-emerald-600 border-emerald-100", warning: "bg-amber-50 text-amber-600 border-amber-100", info: "bg-blue-50 text-blue-600 border-blue-100", danger: "bg-red-50 text-red-600 border-red-100", default: "bg-stone-100 text-stone-500 border-stone-200" }
    const dotStyles = { success: "bg-emerald-500", warning: "bg-amber-500", info: "bg-blue-500", danger: "bg-red-500", default: "bg-stone-400" }
    return (
        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold border", styles[variant])}>
            <div className={cn("w-1.5 h-1.5 rounded-full", dotStyles[variant])} />
            {status}
        </span>
    )
}

export function DataTableBadge({ children, color = "gray" }: { children: React.ReactNode; color?: "gray" | "orange" | "green" | "red" | "blue" | "yellow" | string }) {
    const colorClasses: Record<string, string> = { gray: "bg-stone-100 text-stone-700", orange: "bg-orange-50 text-primary", green: "bg-emerald-50 text-emerald-700", red: "bg-red-50 text-red-700", blue: "bg-blue-50 text-blue-700", yellow: "bg-amber-50 text-amber-700" }
    return <span className={cn("px-3 py-1.5 rounded-xl text-xs font-bold inline-block", colorClasses[color] || colorClasses.gray)}>{children}</span>
}

export function DataTableCount({ count }: { count: number }) {
    if (count === 0) return <span className="text-stone-400">-</span>
    return <span className="px-2 py-1 rounded-xl text-xs font-medium bg-amber-100 text-amber-800">{count.toLocaleString("pt-BR")}</span>
}

export function DataTableAvatar({ name, subtitle }: { name: string; subtitle?: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-500 border border-white shadow-sm">{name.charAt(0).toUpperCase()}</div>
            <div className="flex flex-col">
                <span className="text-sm font-medium text-stone-700">{name}</span>
                {subtitle && <span className="text-[10px] text-stone-400">{subtitle}</span>}
            </div>
        </div>
    )
}

export function DataTableActions({ onClick }: { onClick?: () => void }) {
    return (
        <button onClick={(e) => { e.stopPropagation(); onClick?.() }} className="p-2 rounded-lg text-stone-300 hover:text-brown hover:bg-stone-100 transition-colors">
            <MoreHorizontal className="h-4 w-4" />
        </button>
    )
}
