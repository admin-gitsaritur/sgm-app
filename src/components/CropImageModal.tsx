import { useState, useRef } from "react"
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import { FormModal } from "./ui/SariturModal"
import { Button } from "./ui/button"

interface CropImageModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    imageUrl: string
    onCropComplete: (croppedBase64: string) => void
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
    return centerCrop(
        makeAspectCrop(
            {
                unit: "%",
                width: 90,
            },
            aspect,
            mediaWidth,
            mediaHeight
        ),
        mediaWidth,
        mediaHeight
    )
}

export function CropImageModal({ isOpen, onOpenChange, imageUrl, onCropComplete }: CropImageModalProps) {
    const [crop, setCrop] = useState<Crop>()
    const imgRef = useRef<HTMLImageElement>(null)

    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        const { width, height } = e.currentTarget
        setCrop(centerAspectCrop(width, height, 1))
    }

    async function handleConfirm() {
        if (!imgRef.current || !crop) return

        const canvas = document.createElement("canvas")
        const scaleX = imgRef.current.naturalWidth / imgRef.current.width
        const scaleY = imgRef.current.naturalHeight / imgRef.current.height

        // Destination size
        const destSize = 256
        canvas.width = destSize
        canvas.height = destSize

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        ctx.drawImage(
            imgRef.current,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            destSize,
            destSize
        )

        const base64Image = canvas.toDataURL("image/jpeg", 0.9)
        onCropComplete(base64Image)
    }

    return (
        <FormModal
            open={isOpen}
            onOpenChange={onOpenChange}
            title="Ajustar Foto"
            description="Recorte a imagem para o seu perfil."
            onConfirm={handleConfirm}
            footer={
                <>
                    <Button variant="secondary" type="button" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button variant="primary" type="button" onClick={handleConfirm} disabled={!crop}>
                        Confirmar
                    </Button>
                </>
            }
        >
            <div className="flex flex-col items-center justify-center p-4 bg-saritur-lightgray rounded-md">
                <ReactCrop
                    crop={crop}
                    onChange={(pixelCrop) => setCrop(pixelCrop)}
                    aspect={1}
                    circularCrop
                    keepSelection
                >
                    <img
                        ref={imgRef}
                        alt="Foto para recortar"
                        src={imageUrl}
                        className="max-h-[50vh] w-auto object-contain"
                        onLoad={onImageLoad}
                    />
                </ReactCrop>
            </div>
        </FormModal>
    )
}
