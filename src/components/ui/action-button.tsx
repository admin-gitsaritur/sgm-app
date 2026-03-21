import { LucideIcon, icons } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipTrigger, TooltipContent } from "./tooltip"

// ============================================================================
// COMPONENTE ICON
// ============================================================================

interface IconProps {
    name: string
    size?: number
    className?: string
}

/**
 * Componente Icon que renderiza ícones do Lucide pelo nome.
 * @param name - Nome do ícone (ex: "pencil", "trash-2", "link")
 * @param size - Tamanho em pixels (padrão: 18)
 * @param className - Classes CSS adicionais
 */
export function Icon({ name, size = 18, className }: IconProps) {
    // Converte nome kebab-case para PascalCase
    const lucideName = name
        .split("-")
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join("")

    const LucideIconComponent = (icons as Record<string, LucideIcon>)[lucideName]

    if (!LucideIconComponent) {
        console.warn(`Icon "${name}" not found in lucide-react`)
        return null
    }

    return <LucideIconComponent size={size} className={className} />
}

// ============================================================================
// COMPONENTE ACTION BUTTON
// ============================================================================

type ActionTheme = "indigo" | "rose" | "emerald" | "sky" | "orange" | "violet" | "stone"

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: string
    theme?: ActionTheme
    title?: string
}

/**
 * Botão de ação para tabelas com ícone e tema de cor.
 * Usa Tooltip estilizado (glassmorphism) em vez do title nativo do browser.
 */
export function ActionButton({
    icon,
    theme = "stone",
    title,
    className,
    ...props
}: ActionButtonProps) {
    const themeClasses: Record<ActionTheme, string> = {
        indigo: "hover:text-indigo-600 hover:bg-indigo-50",   // Editar
        rose: "hover:text-rose-600 hover:bg-rose-50",         // Deletar
        emerald: "hover:text-emerald-600 hover:bg-emerald-50", // Link (Vincular)
        sky: "hover:text-sky-600 hover:bg-sky-50",            // Visualizar
        orange: "hover:text-orange-600 hover:bg-orange-50",   // Unlink (Desvincular)
        violet: "hover:text-violet-600 hover:bg-violet-50",   // Gestão
        stone: "hover:text-brown hover:bg-stone-100"      // Padrão/Mais
    }

    const btn = (
        <button
            className={cn(
                "w-9 h-9 flex items-center justify-center rounded-xl text-stone-400 transition-all duration-200",
                themeClasses[theme],
                className
            )}
            {...props}
        >
            <Icon name={icon} size={18} />
        </button>
    )

    if (!title) return btn

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                {btn}
            </TooltipTrigger>
            <TooltipContent side="bottom" className="!px-3 !py-1.5">
                {title}
            </TooltipContent>
        </Tooltip>
    )
}

// ============================================================================
// SEPARADOR VERTICAL PARA AÇÕES
// ============================================================================

/**
 * Separador vertical para agrupar ações relacionadas.
 */
export function ActionSeparator() {
    return <div className="w-[1px] h-4 bg-stone-200 mx-1" />
}

// ============================================================================
// COMPONENTE ACTION GROUP
// ============================================================================

/**
 * Grupo de ações (botões) para uso em tabelas ou headers.
 */
export function ActionGroup({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("flex items-center gap-0.5", className)} {...props}>
            {children}
        </div>
    )
}
