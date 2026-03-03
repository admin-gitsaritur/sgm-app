import clsx from 'clsx';

// ============================================================================
// SPINNER PADRÃO SARITUR CX
// ============================================================================

interface SpinnerProps {
    size?: "sm" | "md" | "lg" | number;
    className?: string;
}

const SIZES = { sm: 24, md: 40, lg: 56 };

export function Spinner({ size = "md", className }: SpinnerProps) {
    const sizeValue = typeof size === "number" ? size : SIZES[size];

    return (
        <svg
            className={clsx("animate-spin", className)}
            width={sizeValue}
            height={sizeValue}
            viewBox="0 0 50 50"
        >
            <circle cx="25" cy="25" r="20" fill="none" strokeWidth="4" className="stroke-stone-200" />
            <circle
                cx="25" cy="25" r="20" fill="none" strokeWidth="4"
                strokeLinecap="round"
                className="stroke-primary"
                strokeDasharray="60 126"
            />
        </svg>
    );
}

// ============================================================================
// PAGE LOADER (Full Page — Premium com Logo)
// ============================================================================

interface PageLoaderProps {
    showBranding?: boolean;
    overlay?: boolean;
    className?: string;
}

export function PageLoader({ showBranding = true, overlay = false, className }: PageLoaderProps) {
    return (
        <div
            className={clsx(
                "flex flex-col items-center justify-center w-full relative",
                overlay
                    ? "fixed inset-0 z-50 bg-white/60 backdrop-blur-[1px]"
                    : "min-h-[60vh]",
                className
            )}
        >
            {/* Background Blobs */}
            {!overlay && (
                <>
                    <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-400/10 rounded-full blur-[100px] pointer-events-none" />
                </>
            )}

            {/* Container Central */}
            <div className="relative flex items-center justify-center w-32 h-32 mb-6">
                {/* Anel Externo */}
                <div className="absolute inset-0 w-full h-full animate-[spin_3s_linear_infinite]">
                    <svg viewBox="0 0 100 100" className="w-full h-full opacity-30">
                        <circle cx="50" cy="50" r="48" fill="none" stroke="#F37137" strokeWidth="1" strokeLinecap="round" strokeDasharray="60 140" />
                    </svg>
                </div>

                {/* Anel Interno (rotação reversa) */}
                <div className="absolute inset-2 w-28 h-28" style={{ animation: 'spin 4s linear infinite reverse' }}>
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                        <circle cx="50" cy="50" r="46" fill="none" stroke="#F37137" strokeWidth="2" strokeLinecap="round" strokeDasharray="80 200" />
                    </svg>
                </div>

                {/* Logo Central */}
                <div className="relative z-10 w-24 h-24 flex items-center justify-center bg-white rounded-full shadow-sm border border-stone-100 overflow-hidden">
                    <img src="/brands/iso_saritur_laranja.svg" alt="SGM" className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                </div>
            </div>

            {/* Branding */}
            {showBranding && !overlay && (
                <div className="flex flex-col items-center">
                    <h2 className="text-brown font-bold text-lg tracking-tight">
                        Saritur<span className="text-primary">SGM</span>
                    </h2>
                </div>
            )}
        </div>
    );
}

export const FullPageLoader = PageLoader;
