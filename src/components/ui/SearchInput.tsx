

import { Search, X } from "lucide-react"
import { cn } from "../../lib/utils"

interface SearchInputProps {
    /** Valor atual da busca */
    value: string
    /** Callback quando o valor muda */
    onChange: (value: string) => void
    /** Texto placeholder */
    placeholder?: string
    /** Classes CSS adicionais */
    className?: string
}

/**
 * Campo de busca padrão Saritur.
 *
 * Focus: glow sutil (box-shadow) sem outline.
 */
export function SearchInput({
    value,
    onChange,
    placeholder = "Buscar...",
    className
}: SearchInputProps) {
    return (
        <div className={cn(
            "w-full md:flex-1 bg-white rounded-xl border border-stone-200",
            "flex items-center px-4 relative group h-12",
            "transition-all duration-200",
            "hover:border-stone-300",
            "focus-within:border-primary/40 focus-within:shadow-[0_0_0_3px_rgba(243,113,55,0.12)]",
            className
        )}>
            <Search className="h-4 w-4 text-stone-400 group-focus-within:text-primary shrink-0 transition-colors" />
            <input
                type="text"
                placeholder={placeholder}
                className="w-full bg-transparent outline-none text-sm font-medium text-brown placeholder:text-stone-300 ml-3 h-full"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
            {value && (
                <button
                    onClick={() => onChange('')}
                    className="text-stone-400 hover:text-stone-600 p-1 rounded-full hover:bg-stone-100 transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    )
}
