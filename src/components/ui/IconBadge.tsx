import { type ReactNode } from "react"
import { cn } from "../../lib/utils"

// ============================================================================
// ICON BADGE — Ícone com fundo arredondado para tabelas/listas
// ============================================================================

type IconBadgeTheme = "primary" | "emerald" | "rose" | "amber" | "sky" | "violet" | "stone"

interface IconBadgeProps {
    /** Ícone ReactNode (ex: <Gauge className="w-4 h-4" />) */
    icon: ReactNode
    /** Tema de cor */
    theme?: IconBadgeTheme
    /** Tamanho */
    size?: "sm" | "md" | "lg"
    /** Classes adicionais */
    className?: string
}

const THEME_CLASSES: Record<IconBadgeTheme, string> = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
    amber: "bg-amber-50 text-amber-600",
    sky: "bg-sky-50 text-sky-600",
    violet: "bg-violet-50 text-violet-600",
    stone: "bg-stone-100 text-stone-500",
}

const SIZE_CLASSES: Record<string, string> = {
    sm: "w-7 h-7 rounded-lg",
    md: "w-9 h-9 rounded-xl",
    lg: "w-11 h-11 rounded-xl",
}

/**
 * Ícone com fundo arredondado — uso em tabelas, listas, cards.
 *
 * @example
 * ```tsx
 * <IconBadge icon={<Gauge className="w-4 h-4" />} theme="primary" />
 * <IconBadge icon={<Users className="w-4 h-4" />} theme="emerald" size="lg" />
 * ```
 */
export function IconBadge({
    icon,
    theme = "primary",
    size = "md",
    className,
}: IconBadgeProps) {
    return (
        <div
            className={cn(
                "flex items-center justify-center shrink-0",
                THEME_CLASSES[theme],
                SIZE_CLASSES[size],
                className
            )}
        >
            {icon}
        </div>
    )
}
