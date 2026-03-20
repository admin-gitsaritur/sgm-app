"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"

// ============================================================================
// SWITCH PADRÃO SARITUR CX
// ============================================================================

/**
 * Switch (Toggle) padronizado do sistema Saritur CX.
 * 
 * Características:
 * - Cor checked: Saritur Orange (primary)
 * - Cor unchecked: Stone-200
 * - Animação suave 300ms
 * 
 * @example
 * ```tsx
 * // Controlado
 * <Switch checked={enabled} onCheckedChange={setEnabled} />
 * 
 * // Com label (wrapper externo)
 * <label className="flex items-center gap-3">
 *   <Switch checked={dark} onCheckedChange={setDark} />
 *   <span>Modo Escuro</span>
 * </label>
 * ```
 */
function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        // Base
        "peer inline-flex shrink-0 cursor-pointer items-center",
        "rounded-full border-2 border-transparent",
        // Size: 48x28px
        "h-7 w-12",
        // Colors
        "bg-stone-200 data-[state=checked]:bg-primary",
        // Transition
        "transition-colors duration-300",
        // Focus
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15",
        // Disabled
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          // Base
          "pointer-events-none block rounded-full bg-white shadow-sm",
          // Size: 20x20px
          "h-5 w-5",
          // Transition
          "transition-transform duration-300",
          // Position
          "data-[state=unchecked]:translate-x-0.5",
          "data-[state=checked]:translate-x-[22px]"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
