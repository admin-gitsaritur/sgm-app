import { LucideIcon, icons } from "lucide-react"
import { cn } from "../../lib/utils"

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
 * 
 * @param icon - Nome do ícone Lucide (ex: "pencil", "trash-2")
 * @param theme - Tema de cor:
 *   - sky: Visualizar (azul claro)
 *   - indigo: Editar (azul escuro)
 *   - emerald: Vincular (verde)
 *   - orange: Desvincular (laranja)
 *   - violet: Gestão (roxo)
 *   - rose: Deletar (vermelho)
 *   - stone: Padrão/Mais opções (cinza)
 * @param title - Tooltip do botão
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

    return (
        <button
            className={cn(
                "w-9 h-9 flex items-center justify-center rounded-xl text-stone-400 transition-all duration-200",
                themeClasses[theme],
                className
            )}
            title={title}
            {...props}
        >
            <Icon name={icon} size={18} />
        </button>
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
