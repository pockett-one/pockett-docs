'use client'

import { Check, Building2, Users, Briefcase, Minus } from 'lucide-react'
import { useOnboarding } from '@/lib/onboarding-context'
import { useAuth } from '@/lib/auth-context'
import { ProfileSection } from '@/components/ui/profile-section'
import { GoogleDriveIcon } from '@/components/ui/google-drive-icon'

const ONBOARDING_STEPS = [
    { id: 0, name: 'Choose Workspace', description: 'Join or create', Icon: Building2 },
    { id: 1, name: 'Connect Storage', description: 'Link Google Drive', Icon: Building2 },
    { id: 3, name: 'Organization', description: 'Create or import', Icon: Building2 },
    { id: 4, name: 'Clients', description: 'Add your clients', Icon: Users },
    { id: 5, name: 'Projects', description: 'Add your projects', Icon: Briefcase },
]

export function OnboardingSidebar() {
    const { currentStep, skippedSteps } = useOnboarding()
    const { user, signOut } = useAuth()

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
                        <div key={s.id} className="relative">
                            {/* Connecting line — shown for all steps except the last */}
                            {idx < arr.length - 1 && (
                                <div
                                    className={`absolute left-6 top-12 w-0.5 h-10 ${
                                        isPast ? 'bg-slate-300' : 'bg-slate-200'
                                    }`}
                                />
                            )}

                            <div className="flex items-start gap-3">
                                <div
                                    className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                                        isCompleted
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : isSkipped
                                            ? 'bg-slate-100 text-slate-400'
                                            : isActive
                                            ? 'bg-slate-900 text-white'
                                            : 'bg-slate-100 text-slate-400'
                                    }`}
                                >
                                    {s.id === 1 ? (
                                        <GoogleDriveIcon size={16} />
                                    ) : (
                                        <StepIcon className="h-4 w-4" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 pt-0.5">
                                    <h3
                                        className={`text-xs font-semibold leading-tight ${
                                            isActive
                                                ? 'text-slate-900'
                                                : isPast
                                                ? 'text-slate-500'
                                                : 'text-slate-400'
                                        }`}
                                    >
                                        {s.name}
                                    </h3>
                                    {isCompleted ? (
                                        <p className="flex items-center gap-0.5 text-xs text-emerald-600 mt-0.5 font-medium">
                                            <Check className="h-3 w-3" />
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
