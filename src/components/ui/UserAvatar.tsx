import { useState } from "react"
import { cn } from "../../lib/utils"

// ============================================================================
// USER AVATAR — Avatar com foto ou iniciais do usuário
// ============================================================================

type AvatarSize = "sm" | "md" | "lg"

interface UserAvatarProps {
    /** Nome completo do usuário (usado para gerar iniciais como fallback) */
    name: string
    /** URL da foto (ex: Google profile photo) */
    imageUrl?: string
    /** Tamanho */
    size?: AvatarSize
    /** Classes adicionais */
    className?: string
}

const SIZE_CLASSES: Record<AvatarSize, string> = {
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-11 h-11 text-base",
}

/**
 * Avatar com foto do usuário ou iniciais como fallback.
 *
 * @example
 * ```tsx
 * <UserAvatar name="Carlos Matos" imageUrl="https://..." />
 * <UserAvatar name="Carlos Matos" />
 * ```
 */
export function UserAvatar({ name, imageUrl, size = "md", className }: UserAvatarProps) {
    const [imgError, setImgError] = useState(false)

    const initials = name
        ?.split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase() || "?"

    const showImage = imageUrl && !imgError

    return (
        <div
            className={cn(
                "rounded-full shrink-0 shadow-sm overflow-hidden",
                !showImage && "bg-saritur-yellow flex items-center justify-center text-brown font-bold",
                SIZE_CLASSES[size],
                className
            )}
        >
            {showImage ? (
                <img
                    src={imageUrl}
                    alt={name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={() => setImgError(true)}
                />
            ) : (
                initials
            )}
        </div>
    )
}
