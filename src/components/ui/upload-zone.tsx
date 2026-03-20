"use client"

import * as React from "react"
import { UploadCloud } from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================================================
// UPLOAD ZONE
// ============================================================================

interface UploadZoneProps {
    /** Callback ao receber arquivo(s) */
    onFileDrop?: (files: FileList) => void
    /** Tipos de arquivo aceitos (ex: ".csv,.xlsx") */
    accept?: string
    /** Tamanho máximo em MB */
    maxSizeMB?: number
    /** Se permite múltiplos arquivos */
    multiple?: boolean
    /** Classes adicionais */
    className?: string
}

/**
 * Zona de upload com drag and drop.
 * 
 * @example
 * ```tsx
 * <UploadZone
 *     accept=".csv,.xlsx,.xml"
 *     maxSizeMB={10}
 *     onFileDrop={(files) => handleUpload(files)}
 * />
 * ```
 */
export function UploadZone({
    onFileDrop,
    accept = ".csv,.xlsx,.xml",
    maxSizeMB = 10,
    multiple = false,
    className,
}: UploadZoneProps) {
    const [isDragging, setIsDragging] = React.useState(false)
    const inputRef = React.useRef<HTMLInputElement>(null)

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = () => {
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        if (e.dataTransfer.files?.length) {
            onFileDrop?.(e.dataTransfer.files)
        }
    }

    const handleClick = () => {
        inputRef.current?.click()
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            onFileDrop?.(e.target.files)
        }
    }

    const acceptText = accept
        .split(",")
        .map((a) => a.replace(".", "").toUpperCase())
        .join(", ")

    return (
        <div
            className={cn(
                // Base
                "rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer group",
                "border-2 border-dashed border-stone-200 bg-stone-50/50",
                "transition-all duration-200",
                // Hover
                "hover:border-primary hover:bg-primary/[0.02]",
                // Dragging
                isDragging && "border-primary bg-primary/5",
                className
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
        >
            {/* Hidden input */}
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                multiple={multiple}
                onChange={handleFileChange}
                className="hidden"
            />

            {/* Icon */}
            <div
                className={cn(
                    "w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4",
                    "transition-all duration-300",
                    isDragging ? "scale-110 rotate-12" : "group-hover:scale-110"
                )}
            >
                <UploadCloud className="w-6 h-6 text-primary" />
            </div>

            {/* Text */}
            <h4 className="text-sm font-bold text-brown">
                {isDragging ? "Solte o arquivo aqui" : "Clique para upload ou arraste"}
            </h4>
            <p className="text-xs text-stone-400 mt-1 mb-4">
                Arquivos {acceptText} (Max. {maxSizeMB}MB)
            </p>

            {/* Button (visual only) */}
            <span
                className={cn(
                    "text-xs font-bold bg-white border border-stone-200 text-stone-600",
                    "px-4 py-2 rounded-lg shadow-sm pointer-events-none",
                    "transition-colors group-hover:border-primary group-hover:text-primary"
                )}
            >
                Selecionar Arquivo
            </span>
        </div>
    )
}
