import { cn } from "@/lib/utils"

/**
 * DynamicTag — Tag com cor de fundo e texto dinâmicos.
 *
 * Usado em DataTable e Modal para exibir Tipo e Classificação de PDVs
 * com cores vindas do banco de dados (não é possível usar Tailwind para cores dinâmicas).
 *
 * @example
 * ```tsx
 * import { DynamicTag } from "@/components/ui/dynamic-tag"
 *
 * <DynamicTag label={row.tipo.nome} bgColor={row.tipo.cor} fontColor={row.tipo.corFonte} />
 * ```
 */

// Cor de texto para tags com fundo claro (stone-700)
const TAG_TEXT_DARK = '#44403C'

function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 50, g: 50, b: 50 }; // Fallback escuro
}

export function DynamicTag({ label, bgColor, fontColor, variant = "solid" }: {
    label: string
    bgColor: string // Ex: #FF00FF
    fontColor: 'branco' | string
    variant?: "solid" | "glass"
}) {
    if (variant === "glass") {
        const rgb = hexToRgb(bgColor);
        return (
            <span
                className="px-2.5 py-1 rounded-full text-[11px] font-semibold inline-flex items-center"
                style={{
                    backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`,
                    color: bgColor,
                    border: `1px solid rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`
                }}
            >
                <span 
                    className="h-1.5 w-1.5 rounded-full mr-1.5"
                    style={{ backgroundColor: bgColor }}
                />
                {label}
            </span>
        )
    }

    return (
        <span
            className="px-2.5 py-0.5 rounded-xl text-xs font-semibold inline-block"
            style={{
                backgroundColor: bgColor,
                color: fontColor === 'branco' ? '#FFFFFF' : TAG_TEXT_DARK
            }}
        >
            {label}
        </span>
    )
}
