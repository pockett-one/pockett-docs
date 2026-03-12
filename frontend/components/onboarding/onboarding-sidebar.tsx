'use client'

import { useEffect, useRef } from 'react'
import { Building2, Lock, FolderTree, PlusCircle, Minus } from 'lucide-react'
import { useOnboarding } from '@/lib/onboarding-context'
import { useAuth } from '@/lib/auth-context'
import { ProfileSection } from '@/components/ui/profile-section'
import { GoogleDriveIcon } from '@/components/ui/google-drive-icon'

const ONBOARDING_STEPS = [
    { id: 1, name: 'Connect Cloud Storage', description: 'Link Google Drive', Icon: Building2 },
    { id: 2, name: 'Sandbox Organization', description: 'Mandatory test workspace', Icon: Lock },
    { id: 3, name: 'Import Organization', description: 'Import existing structure', Icon: FolderTree },
    { id: 4, name: 'Create Organization', description: 'Set up real workspace', Icon: PlusCircle },
]

export function OnboardingSidebar() {
    const { currentStep, skippedSteps } = useOnboarding()
    const { user, signOut } = useAuth()
    const activeStepRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        activeStepRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
    }, [currentStep])

    return (
        <div className="flex flex-col h-full bg-white border-r border-stone-200 rounded-2xl overflow-hidden">
            {/* Steps */}
            <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar px-4 py-4 pt-4">
                {ONBOARDING_STEPS.filter(s => s.id !== 0).map((s, idx, arr) => {
                    const StepIcon = s.Icon
                    const isActive = currentStep === s.id
                    const isPast = currentStep !== null && currentStep > s.id
                    const isSkipped = isPast && skippedSteps.has(s.id)
                    const isCompleted = isPast && !isSkipped

                    return (
                        <div key={s.id} ref={isActive ? activeStepRef : undefined} className="relative">
                            {/* Connecting line — shown for all steps except the last */}
                            {idx < arr.length - 1 && (
                                <div
                                    className={`absolute left-5 top-12 w-0.5 h-12 ${isPast ? 'bg-slate-300' : 'bg-slate-200'
                                        }`}
                                />
                            )}

                            <div className="flex items-start gap-3 min-h-[52px]">
                                <div
                                    className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${isCompleted
                                        ? 'border-2 border-slate-900'
                                        : isSkipped
                                            ? 'border-2 border-slate-300 bg-slate-50'
                                            : isActive
                                                ? 'border-2 border-slate-300 bg-slate-50'
                                                : 'border-2 border-slate-300 bg-slate-50'
                                        }`}
                                >
                                    {isCompleted ? (
                                        s.id === 1 ? (
                                            <GoogleDriveIcon size={20} />
                                        ) : (
                                            <StepIcon className="h-4 w-4 text-slate-900" />
                                        )
                                    ) : isSkipped ? (
                                        <Minus className="h-4 w-4 text-slate-600" strokeWidth={2.5} />
                                    ) : s.id === 1 ? (
                                        <GoogleDriveIcon size={16} />
                                    ) : (
                                        <StepIcon className="h-4 w-4" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 pt-0.5">
                                    <h3
                                        className={`text-xs font-semibold leading-tight ${isActive
                                            ? 'text-slate-900'
                                            : isPast
                                                ? 'text-slate-500'
                                                : 'text-slate-400'
                                            }`}
                                    >
                                        {s.name}
                                    </h3>
                                    {isCompleted ? (
                                        <p className="text-xs text-slate-900 mt-0.5 font-medium">
                                            Completed
                                        </p>
                                    ) : isSkipped ? (
                                        <p className="flex items-center gap-0.5 text-xs text-slate-400 mt-0.5">
                                            <Minus className="h-3 w-3" />
                                            Skipped
                                        </p>
                                    ) : (
                                        <p className={`text-xs mt-0.5 ${isActive ? 'text-slate-500' : 'text-slate-400'}`}>
                                            {s.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Profile Section with logout functionality */}
            {user && <ProfileSection user={user} signOut={signOut} isCollapsed={false} />}
        </div>
    )
}
