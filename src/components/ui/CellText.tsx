import { cn } from "../../lib/utils"

// ============================================================================
// CELL TEXT — Texto padronizado para células de DataTable
// ============================================================================

type CellTextVariant = "default" | "muted" | "label"

interface CellTextProps {
    /** Conteúdo textual */
    children: React.ReactNode
    /** Variante de estilo */
    variant?: CellTextVariant
    /** Classes adicionais */
    className?: string
}

const VARIANT_CLASSES: Record<CellTextVariant, string> = {
    default: "text-sm text-stone-700",
    muted: "text-sm text-stone-500",
    label: "text-[11px] font-medium text-brown/40 uppercase",
}

/**
 * Texto padronizado para células de DataTable e labels contextuais.
 *
 * @example
 * ```tsx
 * <CellText variant="muted">01/01/25 – 31/12/25</CellText>
 * <CellText variant="label">Jan</CellText>
 * ```
 */
export function CellText({
    children,
    variant = "default",
    className,
}: CellTextProps) {
    return (
        <span className={cn(VARIANT_CLASSES[variant], className)}>
            {children}
        </span>
    )
}
