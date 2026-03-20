"use client"

import { cn } from "@/lib/utils"

// ============================================================================
// SPINNER PADRÃO SARITUR CX
// ============================================================================

/**
 * Spinner circular moderno com animação de dash.
 * 
 * Características:
 * - Track: Stone-200
 * - Indicator: Saritur Orange (#F37137)
 * - Animação: dash + rotate
 * 
 * @example
 * ```tsx
 * // Tamanhos
 * <Spinner size="sm" />   // 24px
 * <Spinner size="md" />   // 40px (padrão)
 * <Spinner size="lg" />   // 56px
 * 
 * // Custom
 * <Spinner size={32} />
 * ```
 */

interface SpinnerProps {
    /** Tamanho do spinner */
    size?: "sm" | "md" | "lg" | number
    /** Classes adicionais */
    className?: string
}

const SIZES = {
    sm: 24,
    md: 40,
    lg: 56,
}

export function Spinner({ size = "md", className }: SpinnerProps) {
    const sizeValue = typeof size === "number" ? size : SIZES[size]

    return (
        <svg
            className={cn("animate-spinner-rotate", className)}
            width={sizeValue}
            height={sizeValue}
            viewBox="0 0 50 50"
        >
            {/* Track */}
            <circle
                cx="25"
                cy="25"
                r="20"
                fill="none"
                strokeWidth="4"
                className="stroke-stone-200"
            />
            {/* Indicator */}
            <circle
                cx="25"
                cy="25"
                r="20"
                fill="none"
                strokeWidth="4"
                strokeLinecap="round"
                className="stroke-primary animate-spinner-dash origin-center"
            />
        </svg>
    )
}

// ============================================================================
// PAGE LOADER (Full Page — Premium com Logo)
// ============================================================================

/**
 * Loader de página premium com logo e animações orbitais.
 * 
 * Características:
 * - Logo Saritur centralizado com efeito de respiração
 * - Anéis orbitais animados em direções opostas
 * - Background com blobs sutis
 * - Branding "SariturCX"
 * 
 * @example
 * ```tsx
 * if (loading) return <PageLoader />
 * 
 * // Sem branding
 * <PageLoader showBranding={false} />
 * ```
 */

interface PageLoaderProps {
    /** Mostrar nome "SariturCX" abaixo do loader */
    showBranding?: boolean
    /** Modo overlay: fixed fullscreen com fundo semi-transparente (para re-fetch) */
    overlay?: boolean
    /** Classes adicionais */
    className?: string
}

export function PageLoader({ showBranding = true, overlay = false, className }: PageLoaderProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center w-full fixed inset-0 z-[9999]",
                overlay
                    ? "bg-white/60 backdrop-blur-sm"
                    : "bg-white/60 backdrop-blur-md",
                className
            )}
        >
            {/* Background Blobs (apenas no modo padrão) */}
            {!overlay && (
                <>
                    <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-400/10 rounded-full blur-[100px] pointer-events-none" />
                </>
            )}

            {/* Container Central */}
            <div className="relative flex items-center justify-center w-32 h-32 mb-6">
                {/* Anel Externo (Fino, rotação normal) */}
                <div className="absolute inset-0 w-full h-full animate-[spin_3s_linear_infinite]">
                    <svg viewBox="0 0 100 100" className="w-full h-full opacity-30">
                        <circle
                            cx="50"
                            cy="50"
                            r="48"
                            fill="none"
                            stroke="#F37137"
                            strokeWidth="1"
                            strokeLinecap="round"
                            strokeDasharray="60 140"
                        />
                    </svg>
                </div>

                {/* Anel Interno (Mais forte, rotação reversa) */}
                <div className="absolute inset-2 w-28 h-28 animate-[spin_4s_linear_infinite_reverse]">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                        <circle
                            cx="50"
                            cy="50"
                            r="46"
                            fill="none"
                            stroke="#F37137"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeDasharray="80 200"
                        />
                    </svg>
                </div>

                {/* Logo Central */}
                <div className="relative z-10 w-24 h-24 flex items-center justify-center bg-white rounded-full shadow-sm border border-stone-100 overflow-hidden">
                    <img
                        src="/brands/iso_saritur_laranja.svg"
                        alt="Saritur Logo"
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>

            {/* Branding (apenas no modo padrão) */}
            {showBranding && !overlay && (
                <div className="flex flex-col items-center">
                    <h2 className="text-brown font-bold text-lg tracking-tight">
                        Saritur<span className="text-primary">CX</span>
                    </h2>
                </div>
            )}
        </div>
    )
}

/**
 * @deprecated Use `PageLoader` diretamente. Este alias existe apenas para
 * retrocompatibilidade — será removido em versão futura.
 */
export const FullPageLoader = PageLoader
