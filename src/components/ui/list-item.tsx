"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// ============================================================================
// LIST ITEM - Item de lista para modais e listagens
// ============================================================================

interface ListItemProps {
    /** Conteúdo principal (children) */
    children: React.ReactNode
    /** Ação no lado direito (botão, switch, etc) */
    action?: React.ReactNode
    /** Callback de clique */
    onClick?: () => void
    /** Classes adicionais */
    className?: string
}

/**
 * Item de lista padronizado para modais e listagens.
 * 
 * @example
 * ```tsx
 * <ListItem>
 *     <ListItemId>#123</ListItemId>
 *     <ListItemText>Nome da Empresa</ListItemText>
 * </ListItem>
 * 
 * // Com ação
 * <ListItem action={<Button size="sm">Vincular</Button>}>
 *     <ListItemText>Item com ação</ListItemText>
 * </ListItem>
 * ```
 */
export function ListItem({
    children,
    action,
    onClick,
    className,
}: ListItemProps) {
    const Wrapper = onClick ? "button" : "div"

    return (
        <Wrapper
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 p-3 rounded-xl border border-stone-200",
                "bg-white hover:bg-stone-50 transition-colors w-full text-left",
                action && "justify-between",
                onClick && "cursor-pointer",
                className
            )}
        >
            {action ? (
                <>
                    <div className="flex items-center gap-3">{children}</div>
                    {action}
                </>
            ) : (
                children
            )}
        </Wrapper>
    )
}

// ============================================================================
// LIST ITEM ID - Código/ID do item
// ============================================================================

interface ListItemIdProps {
    children: React.ReactNode
    className?: string
}

/**
 * ID/Código do item na lista.
 */
export function ListItemId({ children, className }: ListItemIdProps) {
    return (
        <span className={cn("text-stone-400 text-sm", className)}>
            {children}
        </span>
    )
}

// ============================================================================
// LIST ITEM TEXT - Texto principal do item
// ============================================================================

interface ListItemTextProps {
    children: React.ReactNode
    /** Estado muted (cor mais clara) */
    muted?: boolean
    className?: string
}

/**
 * Texto principal do item na lista.
 */
export function ListItemText({ children, muted = false, className }: ListItemTextProps) {
    return (
        <span className={cn(
            "font-medium",
            muted ? "text-stone-400" : "text-stone-700",
            className
        )}>
            {children}
        </span>
    )
}

// ============================================================================
// LIST ITEM META - Metadados secundários do item
// ============================================================================

interface ListItemMetaProps {
    children: React.ReactNode
    className?: string
}

/**
 * Metadados secundários de um item de lista (código, fonte, etc.).
 * 
 * Especificações:
 * - Cor: Stone-400
 * - Tamanho: text-xs
 * - Margem top: 2px (mt-0.5)
 */
export function ListItemMeta({ children, className }: ListItemMetaProps) {
    return (
        <p className={cn("text-xs text-stone-400 mt-0.5", className)}>
            {children}
        </p>
    )
}

// ============================================================================
// LIST EMPTY - Estado vazio da lista
// ============================================================================

interface ListEmptyProps {
    /** Mensagem */
    message: string
    /** Ícone (opcional) */
    icon?: React.ReactNode
    /** Classes adicionais */
    className?: string
}

/**
 * Estado vazio para listas.
 */
export function ListEmpty({ message, icon, className }: ListEmptyProps) {
    return (
        <div className={cn("text-center py-8 text-stone-500", className)}>
            {icon && (
                <div className="flex justify-center mb-3">
                    {icon}
                </div>
            )}
            <p>{message}</p>
        </div>
    )
}
