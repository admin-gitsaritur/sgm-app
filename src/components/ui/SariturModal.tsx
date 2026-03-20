/**
 * SariturModal — Modais padronizados do design system Saritur CX
 *
 * Contém 3 componentes:
 *
 * ## 1. FormModal
 * Modal de formulário com header/body/footer.
 * DESIGN:
 * • Container: rounded-2xl, border stone-100, overflow-hidden
 * • Header: px-6 py-5, border-b stone-100, title text-lg font-bold text-brown
 *   – Botão X: rounded-lg, hover bg-stone-100
 *   – Descrição opcional: text-xs text-stone-400
 * • Body: px-6, max-h-[60vh] overflow-y-auto, space-y-5, custom-scroll
 *   – Scrollbar visível apenas durante scroll ativo ("is-scrolling" class)
 * • Footer: bg-stone-50, border-t stone-100, px-6 py-5, flex justify-end gap-3
 * • Enter para confirmar (ignora textarea)
 * • maxWidth: sm | md | lg | xl | 2xl | 3xl | 4xl | 60vw
 *
 * ## 2. AlertModal
 * Modal de alerta/confirmação com ícone + tipo semântico.
 * DESIGN:
 * • Tipos: danger (rose), warning (amber), success (emerald), info (blue)
 * • Ícone: 48x48 rounded-xl com bg/border/text coloridos
 * • max-w-[440px]
 * • Title: text-lg font-bold text-brown
 * • Message: text-sm text-stone-500 leading-relaxed
 * • Actions: flex justify-end gap-3, cancel ghost + confirm colored
 *
 * ## 3. FormField
 * Wrapper para campos de formulário.
 * DESIGN:
 * • Label: text-xs font-bold uppercase tracking-wide stone-500, ml-1
 *   – Focus-within: text → primary (Saritur Orange)
 * • Required: asterisco rose-500
 * • Hint: text-xs stone-400
 * • Error: text-xs rose-500
 */

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "./button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "./dialog"

// ============================================================================
// TIPOS
// ============================================================================

export interface FormModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description?: string
    maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "60vw"
    children: React.ReactNode
    footer?: React.ReactNode
    showCloseButton?: boolean
    onConfirm?: () => void
}

export interface AlertModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    type: "danger" | "warning" | "success" | "info"
    title: string
    message: string | React.ReactNode
    confirmText?: string
    cancelText?: string
    onConfirm?: () => void
    icon?: React.ReactNode
    isLoading?: boolean
}

export interface FormFieldProps {
    label: string
    required?: boolean
    error?: string
    hint?: string
    children: React.ReactNode
    className?: string
}

// ============================================================================
// CONSTANTES
// ============================================================================

const MAX_WIDTH_MAP: Record<string, string> = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
    "2xl": "sm:max-w-2xl",
    "3xl": "sm:max-w-3xl",
    "4xl": "sm:max-w-4xl",
    "60vw": "sm:w-[60vw] sm:max-w-[60vw]",
}

const ALERT_CONFIG = {
    danger: {
        iconBg: "bg-rose-50 border-rose-100",
        iconColor: "text-rose-600",
        buttonVariant: "destructive" as const,
    },
    warning: {
        iconBg: "bg-amber-50 border-amber-100",
        iconColor: "text-amber-600",
        buttonVariant: "outline" as const,
    },
    success: {
        iconBg: "bg-emerald-50 border-emerald-100",
        iconColor: "text-emerald-600",
        buttonVariant: "default" as const,
    },
    info: {
        iconBg: "bg-blue-50 border-blue-100",
        iconColor: "text-blue-600",
        buttonVariant: "default" as const,
    },
}

// ============================================================================
// FORM MODAL
// ============================================================================

export function FormModal({
    open,
    onOpenChange,
    title,
    description,
    maxWidth = "md",
    children,
    footer,
    showCloseButton = true,
    onConfirm,
}: FormModalProps) {
    React.useEffect(() => {
        if (!open || !onConfirm) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "Enter") return
            const target = e.target as HTMLElement
            if (target.tagName === "TEXTAREA") return
            if (e.shiftKey || e.ctrlKey || e.metaKey) return
            e.preventDefault()
            onConfirm()
        }
        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [open, onConfirm])

    const bodyRef = React.useRef<HTMLDivElement>(null)
    React.useEffect(() => {
        const el = bodyRef.current
        if (!el || !open) return
        let timer: ReturnType<typeof setTimeout>
        const onScroll = () => {
            el.classList.add("is-scrolling")
            clearTimeout(timer)
            timer = setTimeout(() => el.classList.remove("is-scrolling"), 800)
        }
        el.addEventListener("scroll", onScroll, { passive: true })
        return () => { el.removeEventListener("scroll", onScroll); clearTimeout(timer) }
    }, [open])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className={cn("p-0 gap-0 rounded-2xl border-stone-100 overflow-hidden", MAX_WIDTH_MAP[maxWidth])}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
                    <div>
                        <DialogTitle className="text-lg font-bold text-brown">{title}</DialogTitle>
                        {description && (
                            <DialogDescription className="text-xs text-stone-400 mt-0.5">{description}</DialogDescription>
                        )}
                    </div>
                    {showCloseButton && (
                        <button onClick={() => onOpenChange(false)} className="text-stone-400 hover:text-stone-600 p-2 rounded-lg hover:bg-stone-100 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Body */}
                <div ref={bodyRef} className="p-6 overflow-y-auto max-h-[60vh] space-y-5 bg-white">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="px-6 py-5 bg-stone-50 border-t border-stone-100 flex justify-end gap-3">
                        {footer}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

// ============================================================================
// ALERT MODAL
// ============================================================================

export function AlertModal({
    open,
    onOpenChange,
    type,
    title,
    message,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    onConfirm,
    icon,
    isLoading = false,
}: AlertModalProps) {
    const config = ALERT_CONFIG[type]

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showCloseButton={false} className="p-0 gap-0 rounded-2xl border-stone-100 max-w-[440px]">
                <DialogHeader className="sr-only">
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{typeof message === 'string' ? message : 'Confirmação de ação'}</DialogDescription>
                </DialogHeader>

                <div className="p-6 flex flex-col gap-6 bg-white">
                    <div className="flex gap-4 items-start">
                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border shrink-0", config.iconBg)}>
                            <span className={config.iconColor}>
                                {icon || <span className="w-6 h-6 flex items-center justify-center font-bold text-lg">!</span>}
                            </span>
                        </div>
                        <div className="flex-1 pt-1">
                            <h3 className="text-lg font-bold text-brown mb-2">{title}</h3>
                            <div className="text-sm text-stone-500 leading-relaxed">{message}</div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        {type !== "success" && type !== "info" && (
                            <Button variant="outline" onClick={() => onOpenChange(false)}>{cancelText}</Button>
                        )}
                        <Button
                            variant={config.buttonVariant}
                            onClick={() => {
                                onConfirm?.()
                                if (type === "success" || type === "info") onOpenChange(false)
                            }}
                            isLoading={isLoading}
                        >
                            {confirmText}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// ============================================================================
// FORM FIELD
// ============================================================================

export function FormField({
    label,
    required = false,
    error,
    hint,
    children,
    className,
}: FormFieldProps) {
    return (
        <div className={cn("space-y-1.5 group", className)}>
            <label className="text-xs font-bold text-stone-500 uppercase tracking-wide ml-1 transition-colors group-focus-within:text-primary">
                {label}
                {required && <span className="text-rose-500 ml-0.5">*</span>}
            </label>
            {children}
            {hint && !error && <p className="text-xs text-stone-400 ml-1">{hint}</p>}
            {error && <p className="text-xs text-rose-500 ml-1">{error}</p>}
        </div>
    )
}
