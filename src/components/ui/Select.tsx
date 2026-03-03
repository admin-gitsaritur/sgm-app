

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "../../lib/utils"

// ============================================================================
// SELECT PADRÃO SARITUR CX
// ============================================================================

/**
 * Select (Dropdown) padronizado do sistema Saritur CX.
 * 
 * Características:
 * - Altura h-11 (44px)
 * - Radius rounded-xl (12px)
 * - Focus ring laranja
 * - Animação de dropdown
 * 
 * @example
 * ```tsx
 * <Select value={role} onValueChange={setRole}>
 *   <SelectTrigger>
 *     <SelectValue placeholder="Selecione..." />
 *   </SelectTrigger>
 *   <SelectContent>
 *     <SelectItem value="admin">Administrador</SelectItem>
 *     <SelectItem value="user">Usuário</SelectItem>
 *   </SelectContent>
 * </Select>
 * ```
 */

function Select({ ...props }: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectGroup({ ...props }: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />
}

function SelectValue({ ...props }: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

// ============================================================================
// SELECT TRIGGER
// ============================================================================

interface SelectTriggerProps extends React.ComponentProps<typeof SelectPrimitive.Trigger> {
  /** Ícone à esquerda do trigger */
  leftIcon?: React.ReactNode
  /** Estado de erro */
  error?: boolean
}

function SelectTrigger({
  className,
  children,
  leftIcon,
  error,
  ...props
}: SelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        // Base
        "flex w-full items-center justify-between gap-2",
        "h-11 rounded-xl border bg-white",
        "text-sm font-medium text-brown",
        // Padding
        leftIcon ? "pl-10 pr-4" : "px-4",
        // Placeholder
        "data-[placeholder]:text-stone-300",
        // Transitions
        "transition-all duration-200",
        // Default state
        "border-stone-200 hover:border-stone-300",
        // Focus/Open state (Saritur Orange)
        "focus:outline-none data-[state=open]:border-primary",
        // Error state
        error && [
          "border-rose-300 bg-rose-50/30",
          "hover:border-rose-400",
          "data-[state=open]:border-rose-500",
        ],
        // Disabled
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-stone-50",
        // Icon styling
        "[&_svg]:pointer-events-none [&_svg]:shrink-0",
        className
      )}
      {...props}
    >
      {/* Ícone à esquerda */}
      {leftIcon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 group-data-[state=open]:text-primary transition-colors pointer-events-none [&_svg]:w-[18px] [&_svg]:h-[18px]">
          {leftIcon}
        </div>
      )}

      {children}

      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 text-stone-400 transition-transform duration-200 data-[state=open]:rotate-180" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

// ============================================================================
// SELECT CONTENT
// ============================================================================

function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          // Base
          "relative z-50 max-h-60 min-w-[8rem] overflow-hidden",
          "bg-white rounded-xl border border-stone-100",
          "shadow-[0_8px_30px_rgba(0,0,0,0.12)]",
          // Animations
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
          // Popper position
          position === "popper" && [
            "data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
          ],
          className
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1.5 space-y-1",
            position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

// ============================================================================
// SELECT ITEM
// ============================================================================

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        // Base
        "relative flex w-full cursor-pointer select-none items-center justify-between",
        "rounded-xl px-3 py-2.5 text-sm font-medium",
        // Colors
        "text-stone-600",
        "outline-none",
        // Hover/Focus
        "focus:bg-stone-50 focus:text-brown",
        // Selected
        "data-[state=checked]:bg-primary/10 data-[state=checked]:text-primary",
        // Disabled
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <span className="flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-3.5 w-3.5" />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  )
}

// ============================================================================
// AUXILIARES
// ============================================================================

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("px-3 py-2 text-xs font-bold text-stone-400 uppercase tracking-wide", className)}
      {...props}
    />
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("bg-stone-100 -mx-1 my-1 h-px", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn("flex cursor-default items-center justify-center py-1", className)}
      {...props}
    >
      <ChevronUp className="h-4 w-4 text-stone-400" />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn("flex cursor-default items-center justify-center py-1", className)}
      {...props}
    >
      <ChevronDown className="h-4 w-4 text-stone-400" />
    </SelectPrimitive.ScrollDownButton>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
