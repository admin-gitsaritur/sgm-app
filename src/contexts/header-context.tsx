"use client"

import { createContext, useContext, useState, ReactNode, useCallback } from "react"

interface HeaderInfo {
    title: string
    subtitle: string
}

interface HeaderContextType {
    headerInfo: HeaderInfo | null
    setHeaderInfo: (info: HeaderInfo | null) => void
    period: string
    setPeriod: (period: string) => void
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined)

export function HeaderProvider({ children }: { children: ReactNode }) {
    const [headerInfo, setHeaderInfo] = useState<HeaderInfo | null>(null)
    const [period, setPeriodState] = useState("last-month")

    const setPeriod = useCallback((p: string) => {
        setPeriodState(p)
    }, [])

    return (
        <HeaderContext.Provider value={{ headerInfo, setHeaderInfo, period, setPeriod }}>
            {children}
        </HeaderContext.Provider>
    )
}

export function useHeader() {
    const context = useContext(HeaderContext)
    if (context === undefined) {
        throw new Error("useHeader must be used within a HeaderProvider")
    }
    return context
}
