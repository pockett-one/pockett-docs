
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Logo from "@/components/Logo"
import { acceptInvitationAction } from "@/lib/actions/invitations"

interface InviteLandingProps {
    invitation: {
        id: string
        token: string
        email: string
        status: string
        project: {
            name: string
        }
        persona: {
            role: {
                displayLabel: string
            }
            organization: {
                name: string
            }
        }
    }
    userEmail?: string | null
}

export function InviteLandingClient({ invitation, userEmail }: InviteLandingProps) {
    const router = useRouter()
    const [status, setStatus] = useState<'IDLE' | 'JOINING' | 'REDIRECTING' | 'ERROR'>('IDLE')
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const processInvitation = async () => {
            // Give a small delay for UX so it doesn't flash too fast? 
            // Or just instant. Instant is better.

            if (invitation.status === 'JOINED') {
                // Already joined
                setStatus('REDIRECTING')
                if (userEmail) router.push('/dash')
                else router.push(`/signin?redirect=${encodeURIComponent('/dash')}`)
                return
            }

            // Invitation is ACCEPTED (because server verifies PENDING -> ACCEPTED)
            if (!userEmail) {
                // Not logged in -> Signup
                setStatus('REDIRECTING')
                const returnUrl = `/invite/${invitation.token}`
                router.replace(`/signup?next=${encodeURIComponent(returnUrl)}&email=${encodeURIComponent(invitation.email)}`)
                return
            }

            // Logged In -> Accept/Join
            // Verify user matches email? 
            // "if invitees click on the link first time or on same email link again... redirect to signup"
            // If logged in user != invite email, we should technically warn.
            // But if we want auto-join, we might just join the current user?
            // "wrong account" check is good practice. 
            // Logic: "Invite sent to X, you are Y". 
            // If strict: Show error.
            if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
                setError(`This invitation was sent to ${invitation.email}, but you are logged in as ${userEmail}. Please sign out.`)
                setStatus('ERROR')
                return
            }

            setStatus('JOINING')
            try {
                const result = await acceptInvitationAction(invitation.token)
                if (result.success && result.redirectUrl) {
                    setStatus('REDIRECTING')
                    router.replace(result.redirectUrl)
                } else {
                    throw new Error(result.error || "Failed to join project")
                }
            } catch (e: any) {
                console.error("Auto-join error", e)
                setError(e.message)
                setStatus('ERROR')
            }
        }

        processInvitation()
    }, [invitation, userEmail, router])

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
                <div className="bg-white p-8 rounded-xl shadow-lg border border-red-100 max-w-md w-full text-center">
                    <div className="mx-auto h-12 w-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 mb-2">Invitation Error</h2>
                    <p className="text-slate-600 mb-6">{error}</p>
                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={() => router.push('/api/auth/signout')}
                            variant="outline"
                        >
                            Sign Out
                        </Button>
                        <Button
                            onClick={() => window.location.reload()}
                        >
                            Retry
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 opacity-[0.4]"
                    style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/50">
                <LoadingSpinner size="md" className="mb-4" />
                <h1 className="text-xl font-semibold text-slate-900">
                    {status === 'JOINING' ? 'Joining Project...' : 'Processing Invitation...'}
                </h1>
                <p className="text-slate-500 mt-2 text-sm">
                    {invitation.project.name} • {invitation.persona.organization.name}
                </p>
            </div>
        </div>
    )
}
