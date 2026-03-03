

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { cn } from "../../lib/utils"

// ============================================================================
// RADIO GROUP PADRÃO SARITUR CX
// ============================================================================

/**
 * RadioGroup padronizado do sistema Saritur CX.
 * 
 * Características:
 * - Indicador: Saritur Orange (primary)
 * - Focus ring laranja
 * - Animação scale no indicador
 * 
 * @example
 * ```tsx
 * <RadioGroup value={view} onValueChange={setView}>
 *   <RadioGroupItem value="list" label="Visualização em Lista" />
 *   <RadioGroupItem value="grid" label="Visualização em Grade" />
 * </RadioGroup>
 * ```
 */

const RadioGroup = React.forwardRef<
    React.ElementRef<typeof RadioGroupPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
    return (
        <RadioGroupPrimitive.Root
            className={cn("grid gap-3", className)}
            {...props}
            ref={ref}
        />
    )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

// ============================================================================
// RADIO GROUP ITEM
// ============================================================================

interface RadioGroupItemProps extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
    /** Label opcional ao lado do radio */
    label?: string
}

const RadioGroupItem = React.forwardRef<
    React.ElementRef<typeof RadioGroupPrimitive.Item>,
    RadioGroupItemProps
>(({ className, label, ...props }, ref) => {
    const id = React.useId()

    const radio = (
        <RadioGroupPrimitive.Item
            ref={ref}
            id={id}
            data-slot="radio-item"
            className={cn(
                // Base
                "peer relative inline-flex items-center justify-center shrink-0",
                "h-5 w-5 rounded-full border-2",
                // Colors
                "border-stone-300 bg-white",
                "data-[state=checked]:border-primary",
                // Transitions
                "transition-all duration-200",
                // Focus
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15",
                // Hover
                "hover:border-stone-400 data-[state=checked]:hover:border-primary",
                // Disabled
                "disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            {...props}
        >
            <RadioGroupPrimitive.Indicator
                data-slot="radio-indicator"
                className="flex items-center justify-center"
            >
                <div className="h-2.5 w-2.5 rounded-full bg-primary scale-0 data-[state=checked]:scale-100 transition-transform duration-200" />
            </RadioGroupPrimitive.Indicator>
        </RadioGroupPrimitive.Item>
    )

    if (!label) return radio

    return (
        <label
            htmlFor={id}
            className={cn(
                "flex items-center gap-3 cursor-pointer select-none group",
                props.disabled && "opacity-50 pointer-events-none"
            )}
        >
            {radio}
            <span className="text-sm font-medium text-stone-600 group-hover:text-brown transition-colors">
                {label}
            </span>
        </label>
    )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }
