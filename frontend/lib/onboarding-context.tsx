'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface OnboardingContextType {
    isOnboarding: boolean
    currentStep: number | null
    skippedSteps: Set<number>
    setOnboarding: (isOnboarding: boolean, step?: number | null) => void
    markStepSkipped: (stepId: number) => void
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: ReactNode }) {
    const [isOnboarding, setIsOnboardingState] = useState(false)
    const [currentStep, setCurrentStepState] = useState<number | null>(null)
    const [skippedSteps, setSkippedSteps] = useState<Set<number>>(new Set())

    const setOnboarding = (isOnboarding: boolean, step?: number | null) => {
        setIsOnboardingState(isOnboarding)
        if (step !== undefined) {
            setCurrentStepState(step)
        }
    }

    const markStepSkipped = (stepId: number) => {
        setSkippedSteps(prev => {
            const next = new Set(prev)
            next.add(stepId)
            return next
        })
    }

    return (
        <OnboardingContext.Provider value={{ isOnboarding, currentStep, skippedSteps, setOnboarding, markStepSkipped }}>
            {children}
        </OnboardingContext.Provider>
    )
}

export function useOnboarding() {
    const context = useContext(OnboardingContext)
    if (context === undefined) {
        throw new Error('useOnboarding must be used within OnboardingProvider')
    }
    return context
}
