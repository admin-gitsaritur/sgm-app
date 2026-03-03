

import * as React from "react"
import { Eye, EyeOff, AlertCircle } from "lucide-react"
import { cn } from "../../lib/utils"

// ============================================================================
// INPUT PADRÃO SARITUR CX
// ============================================================================

export interface InputProps extends Omit<React.ComponentProps<"input">, "size"> {
  /** Ícone à esquerda do input */
  leftIcon?: React.ReactNode
  /** Mensagem de erro (ativa estilo de erro) */
  error?: string
  /** Tamanho do input */
  size?: "sm" | "default" | "lg"
}

/**
 * Input padronizado do sistema Saritur CX.
 * 
 * @example
 * ```tsx
 * // Básico
 * <Input placeholder="Digite aqui..." />
 * 
 * // Com ícone
 * <Input leftIcon={<User />} placeholder="Nome completo" />
 * 
 * // Senha (auto toggle)
 * <Input type="password" placeholder="••••••••" />
 * 
 * // Com erro
 * <Input error="Campo obrigatório" />
 * ```
 */
function Input({
  className,
  type,
  leftIcon,
  error,
  size = "default",
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = React.useState(false)
  const isPassword = type === "password"
  const inputType = isPassword ? (showPassword ? "text" : "password") : type

  const sizeClasses = {
    sm: "h-9 text-xs",
    default: "h-11 text-sm",
    lg: "h-12 text-base",
  }

  return (
    <div className="relative w-full">
      {/* Ícone à esquerda */}
      {leftIcon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 peer-focus:text-primary transition-colors pointer-events-none [&_svg]:w-[18px] [&_svg]:h-[18px]">
          {leftIcon}
        </div>
      )}

      <input
        type={inputType}
        data-slot="input"
        aria-invalid={!!error}
        className={cn(
          // Base
          "peer w-full rounded-xl border bg-white",
          "font-medium text-brown",
          "placeholder:text-stone-300",
          // Padding
          leftIcon ? "pl-10 pr-4" : "px-4",
          isPassword && "pr-10",
          // Size
          sizeClasses[size],
          // Transitions
          "transition-all duration-200",
          // Default state
          "border-stone-200 hover:border-stone-300",
          // Focus state (Saritur Orange)
          "focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15",
          // Error state
          error && [
            "border-rose-300 bg-rose-50/30",
            "text-rose-600 placeholder:text-rose-300",
            "hover:border-rose-400",
            "focus:border-rose-500 focus:ring-rose-500/15",
          ],
          // Disabled
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-stone-50",
          className
        )}
        {...props}
      />

      {/* Toggle de senha */}
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          tabIndex={-1}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-brown transition-colors"
        >
          {showPassword ? (
            <EyeOff className="w-[18px] h-[18px]" />
          ) : (
            <Eye className="w-[18px] h-[18px]" />
          )}
        </button>
      )}

      {/* Mensagem de erro */}
      {error && (
        <p className="flex items-center gap-1 text-xs text-rose-500 font-medium mt-1.5 ml-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  )
}

export { Input }
