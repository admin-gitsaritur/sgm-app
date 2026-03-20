"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================================================
// VARIANTES (Padrão Saritur CX v3.3)
// ============================================================================

const buttonVariants = cva(
  // Base
  `inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold
     transition-all duration-200 ease-in-out outline-none
     disabled:pointer-events-none disabled:opacity-50
     [&_svg]:pointer-events-none [&_svg]:shrink-0`,
  {
    variants: {
      variant: {
        // Primary (Saritur Orange)
        primary: `bg-primary text-white shadow-sm border border-transparent
                         hover:saturate-[1.2] hover:shadow-[0_0_0_3px_var(--ring-primary)]
                         active:scale-[0.96] active:shadow-none active:saturate-100`,

        // Default (Alias para Primary - compatibilidade com shadcn/ui)
        default: `bg-primary text-white shadow-sm border border-transparent
                         hover:saturate-[1.2] hover:shadow-[0_0_0_3px_var(--ring-primary)]
                         active:scale-[0.96] active:shadow-none active:saturate-100`,

        // Secondary (Outline)
        secondary: `bg-white border border-stone-200 text-stone-600 shadow-sm
                           hover:bg-stone-50 hover:text-primary hover:border-primary/30
                           active:bg-stone-100`,

        // Outline (Alias para Secondary - compatibilidade com shadcn/ui)
        outline: `bg-white border border-stone-200 text-stone-600 shadow-sm
                           hover:bg-stone-50 hover:text-primary hover:border-primary/30
                           active:bg-stone-100`,

        // Ghost (Text Only)
        ghost: `bg-transparent text-stone-500
                       hover:bg-stone-100 hover:text-brown
                       active:bg-stone-200`,

        // Destructive Outline (Danger com borda)
        destructive: `bg-white border border-rose-200 text-rose-600 shadow-sm
                             hover:bg-rose-50 hover:border-rose-300
                             active:bg-rose-100`,

        // Danger (Vermelho sólido - para modais destrutivos)
        danger: `bg-rose-600 text-white shadow-sm border border-transparent
                        hover:saturate-[1.2] hover:shadow-[0_0_0_3px_var(--ring-danger)]
                        active:scale-[0.96] active:shadow-none active:saturate-100`,

        // Warning (Amber sólido - para modais de aviso)
        warning: `bg-amber-500 text-white shadow-sm border border-transparent
                         hover:saturate-[1.2] hover:shadow-[0_0_0_3px_var(--ring-warning)]
                         active:scale-[0.96] active:shadow-none active:saturate-100`,

        // Success (Verde sólido - para modais de sucesso)
        success: `bg-emerald-600 text-white shadow-sm border border-transparent
                         hover:saturate-[1.2] hover:shadow-[0_0_0_3px_var(--ring-success)]
                         active:scale-[0.96] active:shadow-none active:saturate-100`,

        // Link
        link: `text-primary underline-offset-4 hover:underline bg-transparent`,
      },

      size: {
        // Small: 32px, radius 12px, icon 16px
        sm: "h-8 px-3 text-xs rounded-xl [&_svg]:w-4 [&_svg]:h-4",

        // Default: 40px, radius 12px, icon 20px
        default: "h-10 px-4 py-2 text-sm rounded-xl [&_svg]:w-5 [&_svg]:h-5",

        // Large: 48px (mesmo que SearchInput), radius 12px, icon 20px
        lg: "h-12 px-6 text-sm rounded-xl [&_svg]:w-5 [&_svg]:h-5",

        // Icon only (square)
        icon: "h-10 w-10 rounded-xl [&_svg]:w-5 [&_svg]:h-5",
        "icon-sm": "h-8 w-8 rounded-xl [&_svg]:w-4 [&_svg]:h-4",
        "icon-lg": "h-10 w-10 rounded-xl [&_svg]:w-5 [&_svg]:h-5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

// ============================================================================
// TIPOS
// ============================================================================

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  /** Usar como Slot (para Next.js Link, etc.) */
  asChild?: boolean
  /** Estado de loading */
  isLoading?: boolean
  /** Ícone à esquerda */
  leftIcon?: React.ReactNode
  /** Ícone à direita */
  rightIcon?: React.ReactNode
}

// ============================================================================
// COMPONENTE BUTTON
// ============================================================================

/**
 * Botão padrão do sistema Saritur CX.
 * 
 * @example
 * ```tsx
 * // Primary (padrão)
 * <Button>Nova Solicitação</Button>
 * 
 * // Com ícone
 * <Button leftIcon={<Plus />}>Adicionar</Button>
 * 
 * // Secondary
 * <Button variant="secondary">Cancelar</Button>
 * 
 * // Loading
 * <Button isLoading>Processando</Button>
 * ```
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  className,
  variant = "primary",
  size = "default",
  asChild = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  ...props
}, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      ref={ref as React.Ref<HTMLButtonElement>}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <Loader2 className="animate-spin" />}
      {!isLoading && leftIcon}
      {children}
      {!isLoading && rightIcon}
    </Comp>
  )
})

Button.displayName = "Button"

export { Button, buttonVariants }
