"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"

// ============================================================================
// TIPOS
// ============================================================================

export interface FormModalProps {
    /** Controle de abertura do modal */
    open: boolean
    /** Callback ao fechar */
    onOpenChange: (open: boolean) => void
    /** Título do modal */
    title: string
    /** Descrição opcional */
    description?: string
    /** Largura máxima do modal */
    maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "60vw"
    /** Conteúdo do formulário */
    children: React.ReactNode
    /** Botões do footer */
    footer?: React.ReactNode
    /** Mostrar botão X no header */
    showCloseButton?: boolean
    /** Callback de confirmação (acionado via Enter) */
    onConfirm?: () => void
}

export interface AlertModalProps {
    /** Controle de abertura do modal */
    open: boolean
    /** Callback ao fechar */
    onOpenChange: (open: boolean) => void
    /** Tipo de alerta */
    type: "danger" | "warning" | "success" | "info"
    /** Título */
    title: string
    /** Mensagem */
    message: string | React.ReactNode
    /** Texto do botão primário */
    confirmText?: string
    /** Texto do botão secundário */
    cancelText?: string
    /** Callback ao confirmar */
    onConfirm?: () => void
    /** Ícone customizado */
    icon?: React.ReactNode
    /** Loading no botão confirmar */
    isLoading?: boolean
}

// ============================================================================
// CONSTANTES
// ============================================================================

const MAX_WIDTH_MAP = {
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
        buttonVariant: "danger" as const,
    },
    warning: {
        iconBg: "bg-amber-50 border-amber-100",
        iconColor: "text-amber-600",
        buttonVariant: "warning" as const,
    },
    success: {
        iconBg: "bg-emerald-50 border-emerald-100",
        iconColor: "text-emerald-600",
        buttonVariant: "success" as const,
    },
    info: {
        iconBg: "bg-blue-50 border-blue-100",
        iconColor: "text-blue-600",
        buttonVariant: "primary" as const,
    },
}

// ============================================================================
// FORM MODAL
// ============================================================================

/**
 * Modal de formulário padronizado.
 * 
 * @example
 * ```tsx
 * <FormModal
 *     open={isOpen}
 *     onOpenChange={setIsOpen}
 *     title="Nova Empresa"
 *     description="Preencha os dados para cadastro"
 *     footer={
 *         <>
 *             <Button variant="secondary" onClick={() => setIsOpen(false)}>Cancelar</Button>
 *             <Button onClick={handleSubmit}>Salvar</Button>
 *         </>
 *     }
 * >
 *     <FormField label="Nome" required>
 *         <Input value={name} onChange={...} />
 *     </FormField>
 * </FormModal>
 * ```
 */
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
    // Enter para confirmar (ignora textarea e campos multi-linha)
    React.useEffect(() => {
        if (!open || !onConfirm) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "Enter") return
            const target = e.target as HTMLElement
            // Não capturar Enter em textareas
            if (target.tagName === "TEXTAREA") return
            // Não capturar se Shift/Ctrl pressionados (ex: nova linha)
            if (e.shiftKey || e.ctrlKey || e.metaKey) return

            e.preventDefault()
            onConfirm()
        }

        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [open, onConfirm])

    // Scroll listener: mostra scrollbar apenas durante scroll ativo
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
        return () => {
            el.removeEventListener("scroll", onScroll)
            clearTimeout(timer)
        }
    }, [open])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className={cn(
                    "p-0 gap-0 rounded-2xl border-stone-100 overflow-hidden",
                    MAX_WIDTH_MAP[maxWidth]
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
                    <div>
                        <DialogTitle className="text-lg font-bold text-brown">
                            {title}
                        </DialogTitle>
                        {description && (
                            <DialogDescription className="text-xs text-stone-400 mt-0.5">
                                {description}
                            </DialogDescription>
                        )}
                    </div>
                    {showCloseButton && (
                        <button
                            onClick={() => onOpenChange(false)}
                            className="text-stone-400 hover:text-stone-600 p-2 rounded-lg hover:bg-stone-100 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Body */}
                <div ref={bodyRef} className="p-6 overflow-y-auto max-h-[60vh] space-y-5 custom-scroll bg-white">
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

/**
 * Modal de alerta/confirmação padronizado.
 * 
 * @example
 * ```tsx
 * <AlertModal
 *     open={isOpen}
 *     onOpenChange={setIsOpen}
 *     type="danger"
 *     title="Excluir Registro?"
 *     message="Esta ação não pode ser desfeita."
 *     confirmText="Sim, excluir"
 *     cancelText="Cancelar"
 *     onConfirm={handleDelete}
 *     icon={<Trash2 />}
 * />
 * ```
 */
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
            <DialogContent
                showCloseButton={false}
                className="p-0 gap-0 rounded-2xl border-stone-100 max-w-[440px]"
            >
                {/* Título para acessibilidade (visualmente oculto) */}
                <DialogHeader className="sr-only">
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {typeof message === 'string' ? message : 'Confirmação de ação'}
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 flex gap-4 items-start">
                    {/* Icon */}
                    <div
                        className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center border shrink-0",
                            config.iconBg
                        )}
                    >
                        <span className={config.iconColor}>
                            {icon || (
                                <span className="w-6 h-6 flex items-center justify-center">!</span>
                            )}
                        </span>
                    </div>

                    {/* Text */}
                    <div className="flex-1 pt-1">
                        <h3 className="text-lg font-bold text-brown mb-2">
                            {title}
                        </h3>
                        <div className="text-sm text-stone-500 leading-relaxed">
                            {message}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="px-6 py-5 bg-stone-50 border-t border-stone-100 flex justify-end gap-3 rounded-b-2xl">
                    {type !== "success" && type !== "info" && (
                        <Button
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                        >
                            {cancelText}
                        </Button>
                    )}
                    <Button
                        variant={config.buttonVariant}
                        onClick={() => {
                            onConfirm?.()
                            if (type === "success" || type === "info") {
                                onOpenChange(false)
                            }
                        }}
                        isLoading={isLoading}
                    >
                        {confirmText}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// ============================================================================
// FORM FIELD
// ============================================================================

export interface FormFieldProps {
    /** Label do campo */
    label: string
    /** Campo obrigatório */
    required?: boolean
    /** Mensagem de erro */
    error?: string
    /** Hint/dica */
    hint?: string
    /** Conteúdo (Input, Select, etc.) */
    children: React.ReactNode
    /** Classes adicionais */
    className?: string
}

/**
 * Wrapper padronizado para campos de formulário.
 * 
 * Características:
 * - Label uppercase, bold, tracking-wide
 * - Label muda para Saritur Orange no focus
 * - Suporte a required, error e hint
 * 
 * @example
 * ```tsx
 * <FormField label="Email" required error={errors.email}>
 *     <Input type="email" value={email} onChange={...} />
 * </FormField>
 * ```
 */
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
            {hint && !error && (
                <p className="text-xs text-stone-400 ml-1">{hint}</p>
            )}
            {error && (
                <p className="text-xs text-rose-500 ml-1">{error}</p>
            )}
        </div>
    )
}
