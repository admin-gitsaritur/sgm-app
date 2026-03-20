"use client"

import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner"
import { CheckCircle2, XCircle, AlertTriangle, Info, Loader2, X } from "lucide-react"

// ============================================================================
// TOASTER PROVIDER (Adicionar no layout)
// ============================================================================

/**
 * Provider do sistema de toasts Saritur CX.
 * Adicione este componente no seu layout ou providers.
 * 
 * @example
 * ```tsx
 * // No layout.tsx ou providers.tsx
 * import { Toaster } from "@/components/ui/toast"
 * 
 * <Toaster />
 * ```
 */
export function Toaster() {
    return (
        <SonnerToaster
            position="top-right"
            expand={false}
            richColors={false}
            gap={12}
            toastOptions={{
                unstyled: true,
                classNames: {
                    toast: `
                        group relative w-full max-w-sm bg-white rounded-xl shadow-lg 
                        border border-stone-100 overflow-hidden pointer-events-auto 
                        flex items-start gap-3 p-4 border-l-4
                    `,
                    title: "text-sm font-bold",
                    description: "text-xs text-stone-500 mt-1 leading-relaxed font-medium",
                    success: "border-l-emerald-500 [&_[data-title]]:text-emerald-900",
                    error: "border-l-rose-500 [&_[data-title]]:text-rose-900",
                    warning: "border-l-amber-500 [&_[data-title]]:text-amber-900",
                    info: "border-l-blue-500 [&_[data-title]]:text-blue-900",
                    loading: "border-l-primary [&_[data-title]]:text-brown",
                },
            }}
        />
    )
}

// ============================================================================
// TIPOS DE TOAST
// ============================================================================

type ToastType = "success" | "error" | "warning" | "info" | "loading"

interface ToastOptions {
    title: string
    description?: string
    duration?: number
}

// ============================================================================
// ÍCONES E CORES POR TIPO
// ============================================================================

const TOAST_CONFIG: Record<ToastType, {
    icon: React.ReactNode
    bgClass: string
    textClass: string
    closeBg: string
    closeHover: string
    closeText: string
}> = {
    success: {
        icon: <CheckCircle2 className="w-[18px] h-[18px]" />,
        bgClass: "bg-emerald-50",
        textClass: "text-emerald-600",
        closeBg: "bg-emerald-50",
        closeHover: "hover:bg-emerald-100",
        closeText: "text-emerald-500 hover:text-emerald-700",
    },
    error: {
        icon: <XCircle className="w-[18px] h-[18px]" />,
        bgClass: "bg-rose-50",
        textClass: "text-rose-600",
        closeBg: "bg-rose-50",
        closeHover: "hover:bg-rose-100",
        closeText: "text-rose-500 hover:text-rose-700",
    },
    warning: {
        icon: <AlertTriangle className="w-[18px] h-[18px]" />,
        bgClass: "bg-amber-50",
        textClass: "text-amber-600",
        closeBg: "bg-amber-50",
        closeHover: "hover:bg-amber-100",
        closeText: "text-amber-500 hover:text-amber-700",
    },
    info: {
        icon: <Info className="w-[18px] h-[18px]" />,
        bgClass: "bg-blue-50",
        textClass: "text-blue-600",
        closeBg: "bg-blue-50",
        closeHover: "hover:bg-blue-100",
        closeText: "text-blue-500 hover:text-blue-700",
    },
    loading: {
        icon: <Loader2 className="w-[18px] h-[18px] animate-spin" />,
        bgClass: "bg-primary/10",
        textClass: "text-primary",
        closeBg: "bg-primary/10",
        closeHover: "hover:bg-primary/20",
        closeText: "text-primary/60 hover:text-primary",
    },
}

// ============================================================================
// COMPONENTE DE CONTEÚDO DO TOAST
// ============================================================================

function ToastContent({ type, title, description, toastId }: { type: ToastType; title: string; description?: string; toastId?: string | number }) {
    const config = TOAST_CONFIG[type]

    return (
        <div className="flex items-start gap-3 w-full">
            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${config.bgClass} ${config.textClass}`}>
                {config.icon}
            </div>
            <div className="flex-1 pt-0.5 pr-6">
                <p data-title className="text-sm font-bold">{title}</p>
                {description && (
                    <p className="text-xs text-stone-500 mt-1 leading-relaxed font-medium">
                        {description}
                    </p>
                )}
            </div>
            {type !== "loading" && (
                <button
                    onClick={() => sonnerToast.dismiss(toastId)}
                    className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-colors cursor-pointer ${config.closeBg} ${config.closeHover} ${config.closeText}`}
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    )
}

// ============================================================================
// FUNÇÕES DE TOAST
// ============================================================================

/**
 * Exibe um toast de sucesso.
 * 
 * @example
 * ```tsx
 * toast.success({ title: "Salvo!", description: "Registro salvo com sucesso." })
 * ```
 */
function success({ title, description, duration = 5000 }: ToastOptions) {
    return sonnerToast.custom(
        (id) => <ToastContent type="success" title={title} description={description} toastId={id} />,
        { duration, className: "border-l-emerald-500" }
    )
}

/**
 * Exibe um toast de erro.
 * 
 * @example
 * ```tsx
 * toast.error({ title: "Erro!", description: "Não foi possível salvar." })
 * ```
 */
function error({ title, description, duration = 5000 }: ToastOptions) {
    return sonnerToast.custom(
        (id) => <ToastContent type="error" title={title} description={description} toastId={id} />,
        { duration, className: "border-l-rose-500" }
    )
}

/**
 * Exibe um toast de aviso.
 * 
 * @example
 * ```tsx
 * toast.warning({ title: "Atenção!", description: "Sua sessão irá expirar." })
 * ```
 */
function warning({ title, description, duration = 5000 }: ToastOptions) {
    return sonnerToast.custom(
        (id) => <ToastContent type="warning" title={title} description={description} toastId={id} />,
        { duration, className: "border-l-amber-500" }
    )
}

/**
 * Exibe um toast informativo.
 * 
 * @example
 * ```tsx
 * toast.info({ title: "Novidade!", description: "Sistema atualizado." })
 * ```
 */
function info({ title, description, duration = 5000 }: ToastOptions) {
    return sonnerToast.custom(
        (id) => <ToastContent type="info" title={title} description={description} toastId={id} />,
        { duration, className: "border-l-blue-500" }
    )
}

/**
 * Exibe um toast de loading.
 * Retorna o ID do toast para poder atualizá-lo depois.
 * 
 * @example
 * ```tsx
 * const toastId = toast.loading({ title: "Processando..." })
 * // Depois de completar:
 * toast.dismiss(toastId)
 * toast.success({ title: "Concluído!" })
 * ```
 */
function loading({ title, description }: Omit<ToastOptions, "duration">) {
    return sonnerToast.custom(
        (id) => <ToastContent type="loading" title={title} description={description} toastId={id} />,
        { duration: Infinity, className: "border-l-primary" }
    )
}

/**
 * Fecha um toast pelo ID.
 */
function dismiss(toastId?: string | number) {
    sonnerToast.dismiss(toastId)
}

// ============================================================================
// EXPORT
// ============================================================================

export const toast = {
    success,
    error,
    warning,
    info,
    loading,
    dismiss,
}
