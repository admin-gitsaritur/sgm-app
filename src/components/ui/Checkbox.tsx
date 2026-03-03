

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"
import { cn } from "../../lib/utils"

// ============================================================================
// CHECKBOX PADRÃO SARITUR CX
// ============================================================================

/**
 * Checkbox padronizado do sistema Saritur CX.
 * 
 * Características:
 * - Cor checked: Saritur Orange (primary)
 * - Radius: 6px (rounded-md)
 * - Focus ring laranja
 * 
 * @example
 * ```tsx
 * // Controlado
 * <Checkbox checked={agreed} onCheckedChange={setAgreed} />
 * 
 * // Com label
 * <Checkbox label="Lembrar minhas credenciais" />
 * 
 * // Desabilitado
 * <Checkbox label="Opção indisponível" disabled />
 * ```
 */
interface CheckboxProps extends React.ComponentProps<typeof CheckboxPrimitive.Root> {
  /** Label opcional ao lado do checkbox */
  label?: string
}

function Checkbox({
  className,
  label,
  disabled,
  ...props
}: CheckboxProps) {
  const id = React.useId()

  const checkbox = (
    <CheckboxPrimitive.Root
      id={id}
      data-slot="checkbox"
      disabled={disabled}
      className={cn(
        // Base
        "peer inline-flex items-center justify-center shrink-0",
        "h-5 w-5 rounded-md border-2",
        // Colors
        "border-stone-300 bg-white",
        "data-[state=checked]:bg-primary data-[state=checked]:border-primary",
        // Transitions
        "transition-all duration-200",
        // Focus
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15",
        // Hover
        "hover:border-stone-400 data-[state=checked]:hover:bg-primary/90",
        // Disabled
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-white"
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )

  if (!label) return checkbox

  return (
    <label
      htmlFor={id}
      className={cn(
        "flex items-center gap-3 cursor-pointer select-none group",
        disabled && "opacity-50 pointer-events-none"
      )}
    >
      {checkbox}
      <span className="text-sm font-medium text-stone-600 group-hover:text-brown transition-colors">
        {label}
      </span>
    </label>
  )
}

export { Checkbox }
