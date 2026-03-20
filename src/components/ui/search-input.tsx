"use client"

import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

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
 * Campo de busca padrão do sistema.
 * 
 * Especificações:
 * - Border Radius: 12px (rounded-xl)
 * - Altura: 40px (h-10)
 * - Borda: Stone-200 → primary no focus
 * - Ícone: Stone-400 → primary no focus
 * - Sombra: soft-shadow
 */
export function SearchInput({
    value,
    onChange,
    placeholder = "Buscar...",
    className
}: SearchInputProps) {
    return (
        <div className={cn(
            "w-full md:flex-1 bg-white rounded-xl border border-stone-200 soft-shadow flex items-center px-4 relative group focus-within:border-primary transition-colors h-12",
            className
        )}>
            <Search className="h-4 w-4 text-stone-400 group-focus-within:text-primary shrink-0" />
            <input
                type="text"
                placeholder={placeholder}
                className="w-full bg-transparent outline-none text-sm text-brown placeholder:text-stone-400 ml-3 h-full"
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
