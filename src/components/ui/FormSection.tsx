import { type ReactNode } from "react"
import { cn } from "../../lib/utils"

// ============================================================================
// FORM SECTION — Sub-seção visual para agrupar campos de formulário
// ============================================================================

interface FormSectionProps {
    /** Título opcional da seção */
    title?: string
    /** Conteúdo (campos, grids, etc.) */
    children: ReactNode
    /** Classes adicionais (posicionamento apenas) */
    className?: string
}

/**
 * Sub-seção padronizada para formulários.
 *
 * Características:
 * - Background: stone-50 (off-white sutil)
 * - Border: stone-100
 * - Radius: xl (12px)
 * - Padding: 16px
 * - Espaçamento interno: space-y-3
 *
 * @example
 * ```tsx
 * <FormSection title="Curva Personalizada">
 *     <ProgressBar ... />
 *     <div className="grid grid-cols-4 gap-2">
 *         {periodos.map(...)}
 *     </div>
 * </FormSection>
 * ```
 */
export function FormSection({
    title,
    children,
    className,
}: FormSectionProps) {
    return (
        <div className={cn("space-y-3 bg-stone-50 rounded-xl p-4 border border-stone-100", className)}>
            {title && (
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wide">
                    {title}
                </h4>
            )}
            {children}
        </div>
    )
}
