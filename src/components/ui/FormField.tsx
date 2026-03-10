import { type ReactNode } from "react"
import { cn } from "../../lib/utils"

// ============================================================================
// FORM FIELD — Wrapper padronizado para campos de formulário
// ============================================================================

interface FormFieldProps {
    /** Label do campo */
    label: string
    /** Campo obrigatório */
    required?: boolean
    /** Mensagem de erro */
    error?: string
    /** Hint/dica */
    hint?: string
    /** Conteúdo (Input, Select, etc.) */
    children: ReactNode
    /** Classes adicionais */
    className?: string
}

/**
 * Wrapper padronizado para campos de formulário.
 *
 * Características:
 * - Label com estilo padrão Saritur CX
 * - Suporte a required, error e hint
 *
 * @example
 * ```tsx
 * <FormField label="Email" required error={errors.email}>
 *     <Input type="email" value={email} onChange={...} />
 * </FormField>
 * ```
 */
export function FormField({
    label,
    required = false,
    error,
    hint,
    children,
    className,
}: FormFieldProps) {
    return (
        <div className={cn("space-y-1.5", className)}>
            <label className="text-sm font-medium text-brown/70 ml-0.5">
                {label}
                {required && <span className="text-rose-500 ml-0.5">*</span>}
            </label>
            {children}
            {hint && !error && (
                <p className="text-xs text-stone-400 ml-0.5">{hint}</p>
            )}
            {error && (
                <p className="text-xs text-rose-500 ml-0.5">{error}</p>
            )}
        </div>
    )
}
