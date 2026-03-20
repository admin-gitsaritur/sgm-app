"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// ============================================================================
// PAGE CONTAINER - Container principal de página
// ============================================================================

interface PageContainerProps {
    children: React.ReactNode
    className?: string
}

/**
 * Container principal de página com layout flex column e altura completa.
 * 
 * @example
 * ```tsx
 * export default function MinhaPage() {
 *     return (
 *         <PageContainer>
 *             <DataTable ... />
 *             <ContentCard ... />
 *         </PageContainer>
 *     )
 * }
 * ```
 */
export function PageContainer({ children, className }: PageContainerProps) {
    return (
        <div className={cn("flex flex-col h-full", className)}>
            {children}
        </div>
    )
}

// ============================================================================
// CARD GRID - Grid responsivo para cards
// ============================================================================

interface CardGridProps {
    children: React.ReactNode
    /** Número de colunas em desktop */
    columns?: 2 | 3 | 4 | 5 | 6
    /** Número de colunas em mobile */
    mobileColumns?: 1 | 2
    /** Gap entre itens */
    gap?: "sm" | "md" | "lg"
    className?: string
}

// Mapeamento responsivo: mobile -> tablet -> desktop
const RESPONSIVE_COLS: Record<number, Record<number, string>> = {
    // { mobileColumns: { desktopColumns: classes } }
    1: {
        2: "grid-cols-1 sm:grid-cols-2",
        3: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
        4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
        5: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
        6: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
    },
    2: {
        2: "grid-cols-2",
        3: "grid-cols-2 md:grid-cols-3",
        4: "grid-cols-2 lg:grid-cols-4",
        5: "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
        6: "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
    },
}

const GRID_GAPS: Record<string, string> = {
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
}

/**
 * Grid responsivo para cards.
 * 
 * @example
 * ```tsx
 * // 4 colunas desktop, 2 mobile
 * <CardGrid columns={4} mobileColumns={2} gap="md">
 *     <SimpleInfoCard ... />
 *     <SimpleInfoCard ... />
 *     <SimpleInfoCard ... />
 *     <SimpleInfoCard ... />
 * </CardGrid>
 * ```
 */
export function CardGrid({
    children,
    columns = 4,
    mobileColumns = 2,
    gap = "md",
    className
}: CardGridProps) {
    const responsiveClass = RESPONSIVE_COLS[mobileColumns]?.[columns] || "grid-cols-2 lg:grid-cols-4"

    return (
        <div className={cn(
            "grid",
            responsiveClass,
            GRID_GAPS[gap],
            className
        )}>
            {children}
        </div>
    )
}


// ============================================================================
// LIST CONTAINER - Container para listas com espaçamento
// ============================================================================

interface ListContainerProps {
    children: React.ReactNode
    /** Espaçamento entre itens */
    gap?: "sm" | "md" | "lg"
    className?: string
}

const LIST_GAPS: Record<string, string> = {
    sm: "space-y-1",
    md: "space-y-2",
    lg: "space-y-3",
}

/**
 * Container para listas com espaçamento padronizado.
 * 
 * @example
 * ```tsx
 * <ListContainer gap="md">
 *     {items.map(item => (
 *         <ListItem key={item.id}>...</ListItem>
 *     ))}
 * </ListContainer>
 * ```
 */
export function ListContainer({
    children,
    gap = "md",
    className
}: ListContainerProps) {
    return (
        <div className={cn(LIST_GAPS[gap], className)}>
            {children}
        </div>
    )
}

// ============================================================================
// TAG WRAP - Container para múltiplas tags
// ============================================================================

interface TagWrapProps {
    children: React.ReactNode
    className?: string
}

/**
 * Container flex wrap para múltiplas tags.
 * 
 * @example
 * ```tsx
 * <TagWrap>
 *     <Tag label="Tag 1" />
 *     <Tag label="Tag 2" />
 * </TagWrap>
 * ```
 */
export function TagWrap({ children, className }: TagWrapProps) {
    return (
        <div className={cn("flex flex-wrap gap-1", className)}>
            {children}
        </div>
    )
}

// ============================================================================
// ICON SIZES - Constantes de tamanho de ícones
// ============================================================================

export const ICON_SIZES = {
    /** Ícone pequeno (16px) */
    sm: "h-4 w-4",
    /** Ícone padrão (20px) */
    md: "h-5 w-5",
    /** Ícone grande (24px) */
    lg: "h-6 w-6",
    /** Ícone extra grande para empty states (48px) */
    xl: "h-12 w-12",
    /** Ícone jumbo para empty states grandes (64px) */
    "2xl": "h-16 w-16",
} as const

export type IconSize = keyof typeof ICON_SIZES

// ============================================================================
// ICON COLORS - Cores de ícones para empty states e feedbacks
// ============================================================================

export const ICON_COLORS = {
    /** Cor de sucesso (emerald) */
    success: "text-emerald-400",
    /** Cor de alerta (amber) */
    warning: "text-amber-400",
    /** Cor de erro (red) */
    error: "text-red-400",
    /** Cor informativa (blue) */
    info: "text-blue-400",
    /** Cor neutra (stone) */
    muted: "text-stone-400",
} as const

export type IconColor = keyof typeof ICON_COLORS

// ============================================================================
// ICON OPACITY - Opacidades de ícones
// ============================================================================

export const ICON_OPACITY = {
    /** Opacidade padrão */
    default: "opacity-100",
    /** Opacidade suave para estados vazios */
    muted: "opacity-50",
    /** Opacidade para estados desativados */
    disabled: "opacity-40",
} as const

export type IconOpacity = keyof typeof ICON_OPACITY
