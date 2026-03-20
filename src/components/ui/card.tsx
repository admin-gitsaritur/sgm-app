"use client"

import * as React from "react"
import { TrendingUp, TrendingDown, Minus, Inbox } from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================================================
// CARD BASE
// ============================================================================

/**
 * Card base padronizado Saritur CX.
 * 
 * Especificações:
 * - Background: white
 * - Border: stone-200
 * - Radius: 24px
 * - Shadow: soft-shadow
 */
export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-white border border-stone-200 rounded-[24px] soft-shadow",
        className
      )}
      {...props}
    />
  )
}

/**
 * Header do Card com padding e espaçamento padrão.
 */
export function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("px-6 py-5 border-b border-stone-100", className)}
      {...props}
    />
  )
}

/**
 * Título do Card.
 */
export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="card-title"
      className={cn("text-lg font-bold text-brown", className)}
      {...props}
    />
  )
}

/**
 * Descrição do Card (texto secundário abaixo do título).
 */
export function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-sm text-stone-400 mt-0.5", className)}
      {...props}
    />
  )
}

/**
 * Conteúdo do Card com padding padrão.
 */
export function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6 py-5", className)}
      {...props}
    />
  )
}

/**
 * Footer do Card com padding e borda superior.
 */
export function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("px-6 py-4 border-t border-stone-100 flex items-center", className)}
      {...props}
    />
  )
}

// ============================================================================
// STATUS CARD (KPI com ícone)
// ============================================================================

type TrendDirection = "up" | "down" | "neutral"
type StatusCardColor = "default" | "orange" | "green" | "blue" | "purple"

interface StatusCardProps {
  /** Título do card */
  title: string
  /** Valor principal */
  value: string | number
  /** Ícone (ReactNode) */
  icon: React.ReactNode
  /** Direção da tendência */
  trend?: TrendDirection
  /** Valor da tendência (ex: "12%") */
  trendValue?: string
  /** Texto de contexto abaixo do valor (ex: "vs mês anterior") */
  subtext?: string
  /** Cor do ícone */
  color?: StatusCardColor
  /** Classes adicionais */
  className?: string
  /** ID para anchor links */
  id?: string
  /** Callback de click */
  onClick?: () => void
}

const ICON_COLORS: Record<StatusCardColor, string> = {
  default: "bg-stone-100 text-stone-500",
  orange: "bg-primary/10 text-primary",
  green: "bg-emerald-50 text-emerald-600",
  blue: "bg-blue-50 text-blue-600",
  purple: "bg-violet-50 text-violet-600",
}

const TREND_COLORS: Record<TrendDirection, string> = {
  up: "bg-emerald-50 text-emerald-600",
  down: "bg-rose-50 text-rose-600",
  neutral: "bg-stone-100 text-stone-500",
}

const TREND_ICONS: Record<TrendDirection, React.ReactNode> = {
  up: <TrendingUp className="w-3.5 h-3.5" />,
  down: <TrendingDown className="w-3.5 h-3.5" />,
  neutral: <Minus className="w-3.5 h-3.5" />,
}

/**
 * Card de KPI com ícone e tendência.
 * 
 * @example
 * ```tsx
 * <StatusCard
 *     title="Receita Total"
 *     value="R$ 450.230"
 *     icon={<DollarSign />}
 *     trend="up"
 *     trendValue="12%"
 *     color="orange"
 * />
 * ```
 */
export function StatusCard({
  title,
  value,
  icon,
  trend,
  trendValue,
  subtext,
  color = "default",
  className,
  id,
  onClick,
}: StatusCardProps) {
  return (
    <Card
      id={id}
      className={cn(
        "p-5 hover-lift hover:soft-shadow-md flex flex-col gap-3",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {/* Linha 1: Ícone + Badge */}
      <div className="flex justify-between items-center">
        <div className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
          "[&_svg]:w-[18px] [&_svg]:h-[18px]",
          ICON_COLORS[color]
        )}>
          {icon}
        </div>

        {trend && trendValue && (
          <span className={cn(
            "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold shrink-0",
            TREND_COLORS[trend]
          )}>
            {trendValue}
          </span>
        )}
      </div>

      {/* Linha 2: Título + Valor + Subtexto */}
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wide mb-1">
          {title}
        </p>
        <h3 className="text-2xl font-bold text-brown">
          {value}
        </h3>
        {subtext && (
          <p className="text-xs text-stone-400 mt-1">{subtext}</p>
        )}
      </div>
    </Card>
  )
}

// ============================================================================
// SIMPLE INFO CARD (Sem ícone)
// ============================================================================

type SimpleInfoCardVariant = "default" | "yellow" | "blue" | "orange" | "green" | "red" | "purple"
type SimpleInfoCardAlign = "left" | "center"

interface SimpleInfoCardProps {
  /** Título do card */
  title: string
  /** Valor principal (string, número ou componente) */
  value: string | number | React.ReactNode
  /** Texto auxiliar */
  subtext?: string
  /** Ícone opcional renderizado acima do título */
  icon?: React.ReactNode
  /** Variante de cor */
  variant?: SimpleInfoCardVariant
  /** Alinhamento do conteúdo */
  align?: SimpleInfoCardAlign
  /** Callback de clique (torna o card clicável) */
  onClick?: () => void
  /** Classes adicionais */
  className?: string
}

const CARD_VARIANTS: Record<SimpleInfoCardVariant, { border: string; bg: string; hover: string; text: string }> = {
  default: {
    border: "border-stone-200",
    bg: "bg-white",
    hover: "hover:bg-stone-50",
    text: "text-stone-700",
  },
  yellow: {
    border: "border-saritur-yellow",
    bg: "bg-amber-50",
    hover: "hover:bg-amber-100",
    text: "text-amber-800",
  },
  blue: {
    border: "border-blue-400",
    bg: "bg-blue-50",
    hover: "hover:bg-blue-100",
    text: "text-blue-700",
  },
  orange: {
    border: "border-primary",
    bg: "bg-orange-50",
    hover: "hover:bg-orange-100",
    text: "text-primary",
  },
  green: {
    border: "border-emerald-400",
    bg: "bg-emerald-50",
    hover: "hover:bg-emerald-100",
    text: "text-emerald-700",
  },
  red: {
    border: "border-red-400",
    bg: "bg-red-50",
    hover: "hover:bg-red-100",
    text: "text-red-600",
  },
  purple: {
    border: "border-purple-400",
    bg: "bg-purple-50",
    hover: "hover:bg-purple-100",
    text: "text-purple-700",
  },
}

const ALIGN_CLASSES: Record<SimpleInfoCardAlign, string> = {
  left: "text-left items-start",
  center: "text-center items-center",
}

/**
 * Card de informação simples sem ícone.
 * 
 * @example
 * ```tsx
 * // Estático
 * <SimpleInfoCard
 *     title="Média Diária"
 *     value="450"
 *     subtext="Passageiros/dia"
 * />
 * 
 * // Clicável com cor e centralizado
 * <SimpleInfoCard
 *     title="Empresas Livres"
 *     value="12"
 *     variant="yellow"
 *     align="center"
 *     onClick={() => setModalOpen(true)}
 * />
 * ```
 */
export function SimpleInfoCard({
  title,
  value,
  subtext,
  icon,
  variant = "default",
  align = "left",
  onClick,
  className,
}: SimpleInfoCardProps) {
  const colors = CARD_VARIANTS[variant]
  const isClickable = !!onClick
  const alignClass = ALIGN_CLASSES[align]

  const cardContent = (
    <>
      {icon && (
        <div className={cn(
          "mb-2 [&>svg]:h-5 [&>svg]:w-5",
          variant === "default" ? "text-stone-400" : colors.text
        )}>
          {icon}
        </div>
      )}
      <p className={cn(
        "text-xs font-bold uppercase tracking-wide mb-2",
        variant === "default" ? "text-stone-400" : colors.text
      )}>
        {title}
      </p>
      <h3 className={cn("text-3xl font-bold", colors.text)}>
        {value}
      </h3>
      {subtext && (
        <p className={cn("text-sm mt-1 font-medium", colors.text, "opacity-80")}>
          {subtext}
        </p>
      )}
    </>
  )

  if (isClickable) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "p-5 rounded-[20px] border min-h-[100px] flex flex-col justify-center transition-colors w-full",
          alignClass,
          colors.border,
          colors.bg,
          colors.hover,
          className
        )}
      >
        {cardContent}
      </button>
    )
  }

  // Variantes não-default aplicam bg e border coloridos mesmo sem onClick
  if (variant !== "default") {
    return (
      <div
        className={cn(
          "p-5 rounded-[20px] border min-h-[100px] flex flex-col justify-center",
          alignClass,
          colors.border,
          colors.bg,
          className
        )}
      >
        {cardContent}
      </div>
    )
  }

  return (
    <Card className={cn(
      "p-6 min-h-[120px] flex flex-col justify-center",
      alignClass,
      className
    )}>
      {cardContent}
    </Card>
  )
}

// ============================================================================
// CONTENT CARD (Container com header)
// ============================================================================

interface ContentCardProps {
  /** Título do card */
  title?: string
  /** Subtítulo */
  subtitle?: string
  /** Ícone exibido ao lado do título */
  icon?: React.ReactNode
  /** Ação no header (botão, link) */
  action?: React.ReactNode
  /** Margem superior */
  marginTop?: "none" | "sm" | "md" | "lg"
  /** Impedir shrink */
  shrink?: boolean
  /** Conteúdo do card */
  children: React.ReactNode
  /** Classes adicionais */
  className?: string
  /** ID para anchor links */
  id?: string
}

const MARGIN_TOP: Record<string, string> = {
  none: "",
  sm: "mt-3",
  md: "mt-6",
  lg: "mt-8",
}

/**
 * Container de conteúdo com header opcional.
 * 
 * @example
 * ```tsx
 * <ContentCard
 *     title="Vendas Recentes"
 *     subtitle="Transações processadas hoje."
 *     action={<Button variant="ghost">Ver Todas</Button>}
 *     marginTop="md"
 * >
 *     <DataTable ... />
 * </ContentCard>
 * ```
 */
export function ContentCard({
  title,
  subtitle,
  icon,
  action,
  marginTop = "none",
  shrink = true,
  children,
  className,
  id,
}: ContentCardProps) {
  return (
    <Card id={id} className={cn(
      "flex flex-col",
      MARGIN_TOP[marginTop],
      !shrink && "shrink-0",
      className
    )}>
      {/* Header */}
      {(title || action) && (
        <div className="px-6 pt-5 pb-2 flex items-center justify-between">
          <div>
            {title && (
              <h3 className="text-lg font-bold text-brown flex items-center gap-2">
                {icon && <span className="text-primary [&>svg]:h-5 [&>svg]:w-5">{icon}</span>}
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-stone-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}

      {/* Content */}
      <div className="p-6 flex-1">
        {children}
      </div>
    </Card>
  )
}

// ============================================================================
// EMPTY STATE
// ============================================================================

interface EmptyStateProps {
  /** Título */
  title: string
  /** Descrição */
  description: string
  /** Ícone (ReactNode) */
  icon?: React.ReactNode
  /** Classes adicionais */
  className?: string
}

/**
 * Placeholder para estados vazios.
 * 
 * @example
 * ```tsx
 * <EmptyState
 *     title="Tudo limpo!"
 *     description="Não há novos alertas para revisar."
 *     icon={<BellOff />}
 * />
 * ```
 */
export function EmptyState({
  title,
  description,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 text-center h-full",
      className
    )}>
      <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mb-4 border border-stone-100">
        <span className="text-stone-300 [&_svg]:w-8 [&_svg]:h-8">
          {icon || <Inbox className="w-8 h-8" />}
        </span>
      </div>
      <h4 className="text-sm font-bold text-brown">
        {title}
      </h4>
      <p className="text-xs text-stone-400 mt-1 max-w-[200px]">
        {description}
      </p>
    </div>
  )
}

// Re-export dos componentes básicos para compatibilidade
export {
  Card as CardBase,
}
