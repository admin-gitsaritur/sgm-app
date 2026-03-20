"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================================================
// STEPPER
// ============================================================================

interface Step {
    /** ID único do passo */
    id: number
    /** Label do passo */
    label: string
}

interface StepperProps {
    /** Lista de passos */
    steps: Step[]
    /** Passo atual (1-indexed) */
    currentStep: number
    /** Callback ao clicar em um passo */
    onStepClick?: (step: number) => void
    /** Classes adicionais */
    className?: string
}

/**
 * Stepper com efeito radar no passo ativo.
 * 
 * @example
 * ```tsx
 * const [step, setStep] = useState(1)
 * 
 * const steps = [
 *     { id: 1, label: "Dados Básicos" },
 *     { id: 2, label: "Documentação" },
 *     { id: 3, label: "Pagamento" },
 *     { id: 4, label: "Confirmação" },
 * ]
 * 
 * <Stepper
 *     steps={steps}
 *     currentStep={step}
 *     onStepClick={(s) => setStep(s)}
 * />
 * ```
 */
export function Stepper({
    steps,
    currentStep,
    onStepClick,
    className,
}: StepperProps) {
    return (
        <div className={cn("w-full", className)}>
            <div className="flex items-center justify-between relative px-4">
                {steps.map((step, index) => {
                    const isActive = currentStep === step.id
                    const isCompleted = currentStep > step.id

                    return (
                        <React.Fragment key={step.id}>
                            {/* Step circle */}
                            <div
                                className="flex flex-col items-center relative z-10 cursor-pointer"
                                onClick={() => onStepClick?.(step.id)}
                            >
                                <div
                                    className={cn(
                                        // Base
                                        "w-8 h-8 rounded-full flex items-center justify-center",
                                        "text-xs font-bold transition-all duration-300",
                                        "border-2 border-transparent bg-white relative z-[2]",
                                        // Active (with radar effect)
                                        isActive && [
                                            "bg-primary text-white",
                                            "animate-stepper-radar",
                                        ],
                                        // Completed
                                        isCompleted && [
                                            "bg-primary text-white border-transparent",
                                        ],
                                        // Inactive
                                        !isActive && !isCompleted && [
                                            "bg-white border-stone-200 text-stone-400",
                                        ],
                                    )}
                                >
                                    {isCompleted ? (
                                        <Check className="w-4 h-4" />
                                    ) : (
                                        step.id
                                    )}
                                </div>

                                {/* Label */}
                                <span
                                    className={cn(
                                        "absolute -bottom-6 text-[10px] font-bold whitespace-nowrap transition-colors duration-300",
                                        isActive ? "text-primary" : "text-stone-400"
                                    )}
                                >
                                    {step.label}
                                </span>
                            </div>

                            {/* Connector line */}
                            {index < steps.length - 1 && (
                                <div
                                    className={cn(
                                        "flex-1 h-0.5 mx-3 rounded-full transition-colors duration-400 relative z-[1]",
                                        isCompleted ? "bg-primary" : "bg-stone-200"
                                    )}
                                />
                            )}
                        </React.Fragment>
                    )
                })}
            </div>
        </div>
    )
}
