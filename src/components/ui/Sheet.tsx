/**
 * Sheet — Painel lateral deslizante (Saritur CX)
 *
 * DESIGN VISUAL:
 * • Baseado em Radix Dialog (portal + overlay)
 * • Overlay: bg-black/50, fade-in/fade-out
 * • Content: bg-white, shadow-lg, slide-in/slide-out por lado
 *   – Lados: right (padrão), left, top, bottom
 *   – Right/Left: w-3/4, max-w-sm, inset-y-0, border-l ou border-r
 *   – Top/Bottom: inset-x-0, h-auto, border-b ou border-t
 *   – Duration: 500ms open, 300ms close
 * • Close button: top-4 right-4, XIcon h-4 w-4, hover opacity-100
 * • Header: flex-col gap-1.5, p-4
 * • Footer: mt-auto, flex-col gap-2, p-4
 * • Title: font-semibold text-brown
 * • Description: text-sm text-stone-500
 */

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "../../lib/utils"

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
    return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({ ...props }: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
    return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({ ...props }: React.ComponentProps<typeof SheetPrimitive.Close>) {
    return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({ ...props }: React.ComponentProps<typeof SheetPrimitive.Portal>) {
    return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
    className,
    ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
    return (
        <SheetPrimitive.Overlay
            data-slot="sheet-overlay"
            className={cn(
                "data-[state=open]:animate-in data-[state=closed]:animate-out",
                "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                "fixed inset-0 z-50 bg-black/50",
                className
            )}
            {...props}
        />
    )
}

function SheetContent({
    className,
    children,
    side = "right",
    showCloseButton = true,
    ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
    side?: "top" | "right" | "bottom" | "left"
    showCloseButton?: boolean
}) {
    return (
        <SheetPortal>
            <SheetOverlay />
            <SheetPrimitive.Content
                data-slot="sheet-content"
                className={cn(
                    "bg-white fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out",
                    "data-[state=closed]:duration-300 data-[state=open]:duration-500",
                    "data-[state=open]:animate-in data-[state=closed]:animate-out",
                    side === "right" && "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l border-stone-100 sm:max-w-sm",
                    side === "left" && "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r border-stone-100 sm:max-w-sm",
                    side === "top" && "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b border-stone-100",
                    side === "bottom" && "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t border-stone-100",
                    className
                )}
                {...props}
            >
                {children}
                {showCloseButton && (
                    <SheetPrimitive.Close className="absolute top-4 right-4 rounded-lg p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors focus:outline-none">
                        <XIcon className="h-4 w-4" />
                        <span className="sr-only">Fechar</span>
                    </SheetPrimitive.Close>
                )}
            </SheetPrimitive.Content>
        </SheetPortal>
    )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
    return <div data-slot="sheet-header" className={cn("flex flex-col gap-1.5 p-4", className)} {...props} />
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
    return <div data-slot="sheet-footer" className={cn("mt-auto flex flex-col gap-2 p-4", className)} {...props} />
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
    return <SheetPrimitive.Title data-slot="sheet-title" className={cn("font-semibold text-brown", className)} {...props} />
}

function SheetDescription({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Description>) {
    return <SheetPrimitive.Description data-slot="sheet-description" className={cn("text-sm text-stone-500", className)} {...props} />
}

export {
    Sheet,
    SheetTrigger,
    SheetClose,
    SheetContent,
    SheetHeader,
    SheetFooter,
    SheetTitle,
    SheetDescription,
}
