import React from "react"
import { cn } from "../../lib/utils"

// ============================================================================
// PAGE HEADER — Cabeçalho padronizado para todas as páginas
// ============================================================================

interface PageHeaderProps {
    /** Título principal da página */
    title: string
    /** Subtítulo / descrição da página */
    subtitle?: string
    /** Conteúdo adicional à direita (ex: botões, filtros) */
    actions?: React.ReactNode
    /** Classes CSS adicionais */
    className?: string
}

/**
 * Cabeçalho padronizado para páginas do SGM.
 *
 * @example
 * ```tsx
 * <PageHeader
 *   title="Gestão de Metas"
 *   subtitle="Gerencie as metas estratégicas corporativas (Camada 1)"
 * />
 *
 * <PageHeader
 *   title="Projetos"
 *   subtitle="Acompanhe os projetos vinculados às metas"
 *   actions={<Button>Novo Projeto</Button>}
 * />
 * ```
 */
export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
    return (
        <div className={cn("mb-2", className)}>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-brown tracking-tight">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-brown/50 text-sm mt-1">
                            {subtitle}
                        </p>
                    )}
                </div>
                {actions && (
                    <div className="flex items-center gap-3">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    )
}
