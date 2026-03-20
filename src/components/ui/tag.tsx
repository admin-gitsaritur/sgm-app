"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import * as icons from "lucide-react"
import type { LucideIcon } from "lucide-react"

// ============================================================================
// TIPOS
// ============================================================================

type TagColor =
    // Marcas
    | "saritur-orange" | "saritur-brown"
    | "transnorte-dark" | "transnorte-light"
    // Funcionais
    | "slate" | "gray" | "zinc" | "neutral" | "stone"
    | "red" | "amber" | "yellow" | "lime" | "green" | "emerald"
    | "teal" | "cyan" | "sky" | "blue" | "indigo"
    | "violet" | "purple" | "fuchsia" | "pink" | "rose"

type TagVariant = "soft" | "outline" | "dot"

interface TagProps {
    /** Texto do label */
    label: string
    /** Cor da tag (20+ opções do colorMap) */
    color?: TagColor
    /** Cor hex customizada para o fundo (ex: "#6B7280"). Sobrescreve o colorMap. */
    customColor?: string
    /** Cor hex customizada para o texto (ex: "#ffffff"). Usado com customColor. */
    customTextColor?: string
    /** Variante de estilo */
    variant?: TagVariant
    /** Nome do ícone Lucide (opcional) */
    icon?: string
    /** Animação de pulso suave no dot (para estados ativos) */
    animateDot?: boolean
    /** Piscar rígido no dot (para offline/pausado) */
    blinkRigid?: boolean
    /** Estado muted/desativado (opacity-40) */
    muted?: boolean
    /** Classes CSS adicionais */
    className?: string
}

// ============================================================================
// MAPA DE CORES
// ============================================================================

const colorMap: Record<TagColor, [string, string, string, string]> = {
    // [bgClass, textClass, borderClass, dotClass]

    // --- MARCAS ---
    "saritur-orange": ["bg-primary/10", "text-primary", "border-primary/20", "bg-primary"],
    "saritur-brown": ["bg-brown/10", "text-brown", "border-brown/20", "bg-brown"],
    "transnorte-dark": ["bg-transnorte-dark/10", "text-transnorte-dark", "border-transnorte-dark/20", "bg-transnorte-dark"],
    "transnorte-light": ["bg-transnorte-light/20", "text-transnorte-dark", "border-transnorte-light/40", "bg-transnorte-light"],

    // --- FUNCIONAIS ---
    "slate": ["bg-slate-100", "text-slate-700", "border-slate-200", "bg-slate-500"],
    "gray": ["bg-gray-100", "text-gray-700", "border-gray-200", "bg-gray-500"],
    "zinc": ["bg-zinc-100", "text-zinc-700", "border-zinc-200", "bg-zinc-500"],
    "neutral": ["bg-neutral-100", "text-neutral-700", "border-neutral-200", "bg-neutral-500"],
    "stone": ["bg-stone-100", "text-stone-700", "border-stone-200", "bg-stone-500"],

    "red": ["bg-red-50", "text-red-700", "border-red-200", "bg-red-500"],
    "amber": ["bg-amber-50", "text-amber-700", "border-amber-200", "bg-amber-500"],
    "yellow": ["bg-yellow-50", "text-yellow-700", "border-yellow-200", "bg-yellow-500"],
    "lime": ["bg-lime-50", "text-lime-700", "border-lime-200", "bg-lime-500"],
    "green": ["bg-green-50", "text-green-700", "border-green-200", "bg-green-500"],
    "emerald": ["bg-emerald-50", "text-emerald-700", "border-emerald-200", "bg-emerald-500"],
    "teal": ["bg-teal-50", "text-teal-700", "border-teal-200", "bg-teal-500"],
    "cyan": ["bg-cyan-50", "text-cyan-700", "border-cyan-200", "bg-cyan-500"],
    "sky": ["bg-sky-50", "text-sky-700", "border-sky-200", "bg-sky-500"],
    "blue": ["bg-blue-50", "text-blue-700", "border-blue-200", "bg-blue-500"],
    "indigo": ["bg-indigo-50", "text-indigo-700", "border-indigo-200", "bg-indigo-500"],
    "violet": ["bg-violet-50", "text-violet-700", "border-violet-200", "bg-violet-500"],
    "purple": ["bg-purple-50", "text-purple-700", "border-purple-200", "bg-purple-500"],
    "fuchsia": ["bg-fuchsia-50", "text-fuchsia-700", "border-fuchsia-200", "bg-fuchsia-500"],
    "pink": ["bg-pink-50", "text-pink-700", "border-pink-200", "bg-pink-500"],
    "rose": ["bg-rose-50", "text-rose-700", "border-rose-200", "bg-rose-500"],
}

// ============================================================================
// COMPONENTE TAG
// ============================================================================

/**
 * Tag/Bullet para categorização, status e labels.
 * 
 * @example
 * ```tsx
 * // Soft (padrão)
 * <Tag label="Categoria" color="blue" />
 * 
 * // Com dot animado (status online)
 * <Tag label="Online" color="emerald" variant="dot" animateDot />
 * 
 * // Outline com ícone
 * <Tag label="Admin" color="violet" variant="outline" icon="shield" />
 * ```
 */
export function Tag({
    label,
    color = "stone",
    customColor,
    customTextColor,
    variant = "soft",
    icon,
    animateDot = false,
    blinkRigid = false,
    muted = false,
    className
}: TagProps) {
    const [bgClass, textClass, borderClass, dotClass] = colorMap[color] || colorMap.stone
    const useCustom = !!customColor

    // Renderizar ícone se especificado
    const renderIcon = () => {
        if (!icon) return null
        const lucideName = icon
            .split("-")
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join("")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const LucideIcon = (icons as any)[lucideName] as LucideIcon | undefined
        if (!LucideIcon) return null
        return <LucideIcon size={12} className="mr-0.5" />
    }

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all border",
                // Variantes (classes do colorMap, ignoradas quando customColor está presente)
                !useCustom && variant === "soft" && `${bgClass} ${textClass} ${borderClass}`,
                !useCustom && variant === "outline" && `${bgClass} ${textClass} ${borderClass} shadow-sm`,
                !useCustom && variant === "dot" && `${bgClass} ${textClass} ${borderClass} pl-2 pr-3`,
                // Custom color (borda transparente para manter layout)
                useCustom && "border-transparent",
                useCustom && variant === "dot" && "pl-2 pr-3",
                // Muted
                muted && "opacity-40",
                className
            )}
            style={useCustom ? {
                backgroundColor: customColor,
                color: customTextColor || '#ffffff'
            } : undefined}
        >
            {/* Dot com animações */}
            {variant === "dot" && (
                <span className="relative flex h-1.5 w-1.5 mr-0.5">
                    {/* Animação Suave (Ping) */}
                    {animateDot && !blinkRigid && (
                        <span className={cn(
                            "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                            dotClass
                        )} />
                    )}
                    {/* Bolinha Principal */}
                    <span className={cn(
                        "relative inline-flex rounded-full h-1.5 w-1.5",
                        dotClass,
                        blinkRigid && "animate-rigid-blink"
                    )} />
                </span>
            )}

            {/* Ícone */}
            {renderIcon()}

            {/* Label */}
            {label}
        </span>
    )
}

// ============================================================================
// ATALHOS PRÉ-CONFIGURADOS
// ============================================================================

/** Status Online (dot verde pulsando) */
export function TagOnline({ label = "Online" }: { label?: string }) {
    return <Tag label={label} color="emerald" variant="dot" animateDot />
}

/** Status Offline (dot cinza piscando) */
export function TagOffline({ label = "Offline" }: { label?: string }) {
    return <Tag label={label} color="stone" variant="dot" blinkRigid />
}

/** Tag Saritur */
export function TagSaritur({ label = "Saritur", muted }: { label?: string; muted?: boolean }) {
    return <Tag label={label} color="saritur-orange" muted={muted} />
}

/** Tag Transnorte */
export function TagTransnorte({ label = "Transnorte", muted }: { label?: string; muted?: boolean }) {
    return <Tag label={label} color="transnorte-dark" muted={muted} />
}
