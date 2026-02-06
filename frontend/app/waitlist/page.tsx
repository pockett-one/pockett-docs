"use client"

import React, { useState, useEffect, useCallback, Suspense } from "react"
import { submitWaitlistForm } from "@/app/actions/submit-waitlist"
import { getWaitlistStatus } from "@/app/actions/get-waitlist-status"
import { getWaitlistLeaderboard } from "@/app/actions/get-waitlist-leaderboard"
import { getWaitlistCount } from "@/app/actions/get-waitlist-count"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, Loader2, ArrowRight, Users, TrendingUp, Share2, Copy, Check, Gift, Zap, Trophy, Medal, Crown, Pencil, Lock, Star, Award } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { StdCTAButton } from "@/components/ui/StdCTAButton"
import { Turnstile } from "@marsidev/react-turnstile"

interface WaitlistStatus {
    exists: boolean
    position: number | null
    ahead: number | null
    behind: number | null
    plan: string | null
    createdAt: Date | null
    referralCode: string | null
    referralCount: number | null
    positionBoost: number | null
    upgradedToProPlus: boolean | null
}

function WaitlistPageContent() {
    const searchParams = useSearchParams()
    const referralCodeFromUrl = searchParams.get('ref')
    const planFromUrl = searchParams.get('plan') || 'Standard'

    const [turnstileToken, setTurnstileToken] = useState<string>("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string>("")
    const [newReferralCode, setNewReferralCode] = useState<string | null>(null) // Store referral code from new signup
    const [waitlistStatus, setWaitlistStatus] = useState<WaitlistStatus | null>(null)
    const [checkingStatus, setCheckingStatus] = useState(false)
    const [emailInput, setEmailInput] = useState<string>("")
    const [referralLinkCopied, setReferralLinkCopied] = useState(false)
    const [leaderboard, setLeaderboard] = useState<any>(null)
    const [waitlistCount, setWaitlistCount] = useState<{ total: number; recentJoiners: any[] } | null>(null)
    const [loadingLeaderboard, setLoadingLeaderboard] = useState(false)
    const [emailLocked, setEmailLocked] = useState(false)
    const [isEditingEmail, setIsEditingEmail] = useState(false)

    // Get Turnstile site key with fallback
    const turnstileSiteKey = (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY as string) || '1x00000000000000000000AA'

    // Load leaderboard and count on mount
    useEffect(() => {
        const loadData = async () => {
            setLoadingLeaderboard(true)
            try {
                const [leaderboardResult, countResult] = await Promise.all([
                    getWaitlistLeaderboard(emailInput || undefined),
                    getWaitlistCount(),
                ])

                if (leaderboardResult.success && leaderboardResult.data) {
                    setLeaderboard(leaderboardResult.data)
                } else if (leaderboardResult.error) {
                    // Silently handle errors - don't show leaderboard if it fails
                    console.warn('Failed to load leaderboard:', leaderboardResult.error)
                }

                if (countResult.success && countResult.data) {
                    setWaitlistCount(countResult.data)
                } else if (countResult.error) {
                    // Silently handle errors - don't show count if it fails
                    console.warn('Failed to load waitlist count:', countResult.error)
                }
            } catch (error) {
                // Silently handle errors - don't break the page if leaderboard/count fails
                console.warn('Failed to load leaderboard/count:', error)
            } finally {
                setLoadingLeaderboard(false)
            }
        }

        loadData()
    }, [emailInput])

    const [emailCheckError, setEmailCheckError] = useState<string | null>(null)

    // Check waitlist status when email is entered
    const checkStatus = useCallback(async (email: string) => {
        if (!email || !email.includes('@')) {
            setWaitlistStatus(null)
            setCheckingStatus(false)
            setEmailLocked(false)
            setIsEditingEmail(false)
            setEmailCheckError(null)
            return
        }

        setCheckingStatus(true)
        setEmailCheckError(null)
        // Clear previous status while checking to prevent flickering
        setWaitlistStatus(null)
        try {
            const result = await getWaitlistStatus(email)
            if (result.success && result.data) {
                // Set status first, then unlock checking
                setWaitlistStatus(result.data)
                setEmailLocked(true)
                setIsEditingEmail(false)
            } else {
                // If there's an error, don't lock the email and show error message
                setWaitlistStatus(null)
                setEmailLocked(false)
                setIsEditingEmail(false)
                if (result.error) {
                    setEmailCheckError(result.error)
                }
            }
        } catch (error) {
            // Handle unexpected errors
            setWaitlistStatus(null)
            setEmailLocked(false)
            setIsEditingEmail(false)
            setEmailCheckError(error instanceof Error ? error.message : 'Failed to check email. Please try again.')
        } finally {
            // Use requestAnimationFrame to ensure state updates are processed before hiding loading
            requestAnimationFrame(() => {
                setCheckingStatus(false)
            })
        }
    }, [])

    // Handle email edit unlock
    const handleUnlockEmail = () => {
        setIsEditingEmail(true)
        setEmailLocked(false)
        setWaitlistStatus(null) // Clear status when editing
        setEmailCheckError(null) // Clear any errors when editing
    }

    // Handle manual check trigger
    const handleCheckClick = () => {
        if (emailInput && emailInput.includes('@')) {
            if (isEditingEmail) {
                setIsEditingEmail(false)
            }
            checkStatus(emailInput)
        }
    }

    // Handle Enter key in email input
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleCheckClick()
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setFormError(null)

        // Prevent submission if already on waitlist
        if (waitlistStatus?.exists) {
            setFormError("You're already on the waitlist! Check your status above.")
            return
        }

        if (!turnstileToken) {
            setFormError("Please complete the verification.")
            return
        }

        setIsSubmitting(true)

        try {
            const formElement = e.currentTarget
            const formData = new FormData(formElement)

            // Ensure email is set from emailInput state (in case hidden field doesn't work)
            if (emailInput) {
                formData.set('email', emailInput)
            }

            formData.append('plan', planFromUrl)

            // Add referral code from URL if present
            if (referralCodeFromUrl) {
                formData.append('referralCode', referralCodeFromUrl.toUpperCase())
            }

            const result = await submitWaitlistForm(formData, turnstileToken)

            if (!result.success) {
                throw new Error(result.error || 'Failed to submit form')
            }

            // If duplicate, show status instead of success message
            if (result.data?.isDuplicate && result.data?.status) {
                const email = formData.get('email') as string
                setWaitlistStatus({
                    exists: true,
                    position: result.data.status.position,
                    ahead: result.data.status.ahead,
                    behind: result.data.status.behind,
                    plan: result.data.status.plan,
                    createdAt: null,
                    referralCode: null,
                    referralCount: null,
                    positionBoost: null,
                    upgradedToProPlus: null,
                })
                setEmailInput(email)
                setEmailLocked(true) // Lock email after submission
                setIsEditingEmail(false)
                setSubmitted(false) // Don't show success message, show status instead
                setFormError(null) // Clear any errors

                // Refresh leaderboard and count (silently handle errors)
                try {
                    const [leaderboardResult, countResult] = await Promise.all([
                        getWaitlistLeaderboard(email),
                        getWaitlistCount(),
                    ])
                    if (leaderboardResult.success && leaderboardResult.data) setLeaderboard(leaderboardResult.data)
                    if (countResult.success && countResult.data) setWaitlistCount(countResult.data)
                } catch (error) {
                    // Silently handle errors - don't break the flow
                    console.warn('Failed to refresh leaderboard/count:', error)
                }
            } else {
                setSuccessMessage(result.data?.message || "Thank you for joining the waitlist! We'll notify you when Pro plan features are ready.")
                setNewReferralCode(result.data?.referralCode || null) // Store referral code from new signup
                setSubmitted(true)
                setEmailLocked(true) // Lock email after successful submission
                setIsEditingEmail(false)
                setWaitlistStatus(null) // Clear any previous status

                // Refresh leaderboard and count after successful signup (silently handle errors)
                try {
                    const [leaderboardResult, countResult] = await Promise.all([
                        getWaitlistLeaderboard(emailInput || undefined),
                        getWaitlistCount(),
                    ])
                    if (leaderboardResult.success && leaderboardResult.data) setLeaderboard(leaderboardResult.data)
                    if (countResult.success && countResult.data) setWaitlistCount(countResult.data)
                } catch (error) {
                    // Silently handle errors - don't break the flow
                    console.warn('Failed to refresh leaderboard/count:', error)
                }
            }
        } catch (error) {
            console.error('Error submitting form:', error)
            setFormError(error instanceof Error ? error.message : 'Failed to submit form. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-white text-gray-900">
            <Header />
            <section className="pt-16 pb-8 lg:pt-20 lg:pb-10">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 rounded-lg px-4 py-2 text-xs font-semibold tracking-wider uppercase mb-6">
                            <Star className="w-3.5 h-3.5 stroke-2" />
                            Early Access
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-2 tracking-tight">
                            Join the waitlist
                        </h1>
                        <p className="text-lg text-gray-600 max-w-xl mx-auto leading-relaxed">
                            We're building Pro plan features now. Be the first to know when they're ready.
                        </p>
                    </div>
                </div>
            </section>

            <section className="pb-20 lg:pb-32">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Social Proof Counter - Show when > 25 */}
                {waitlistCount && waitlistCount.total > 25 && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
                        <div className="flex items-center justify-center gap-4 flex-wrap">
                            {/* Avatars */}
                            <div className="flex items-center -space-x-2">
                                {waitlistCount.recentJoiners.slice(0, 3).map((joiner, idx) => {
                                    const initials = joiner.email.substring(0, 2).toUpperCase()
                                    return (
                                        <div
                                            key={idx}
                                            className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-sm"
                                            title={joiner.maskedEmail}
                                        >
                                            {initials}
                                        </div>
                                    )
                                })}
                                {waitlistCount.total > 3 && (
                                    <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-slate-600 text-xs font-bold shadow-sm">
                                        +{waitlistCount.total - 3}
                                    </div>
                                )}
                            </div>
                            <div className="text-slate-700">
                                <span className="text-3xl font-black text-slate-900">{waitlistCount.total}</span>
                                <span className="ml-2 font-semibold">people have already joined</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Leaderboard Section - Table Format */}
                {leaderboard && leaderboard.entries.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 shadow-sm">
                        <div className="bg-gray-100 rounded-xl p-3 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                                    <Trophy className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 tracking-tight">Leaderboard</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">Top referrers ranked by points</p>
                                </div>
                            </div>
                        </div>

                        {/* Leaderboard Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">POSITION</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">EMAIL</th>
                                        <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">POINTS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaderboard.entries.map((entry: any, idx: number) => {
                                        const isCurrentUser = entry.isCurrentUser || false
                                        const showEllipsis = idx === 10 && leaderboard.userRank && leaderboard.userRank > 10

                                        const getRankBadge = (rank: number) => {
                                            if (rank === 1) return <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">#{rank}</div>
                                            if (rank === 2) return <div className="w-8 h-8 rounded-full bg-slate-400 flex items-center justify-center text-white font-bold text-sm shadow-sm">#{rank}</div>
                                            if (rank === 3) return <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">#{rank}</div>
                                            return <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">#{rank}</div>
                                        }

                                        return (
                                            <React.Fragment key={entry.email}>
                                                {showEllipsis && (
                                                    <tr key={`ellipsis-${idx}`} className="border-b border-slate-200">
                                                        <td colSpan={3} className="py-2 px-4 text-center text-xs text-slate-400">
                                                            ...
                                                        </td>
                                                    </tr>
                                                )}
                                                <tr
                                                    key={entry.email}
                                                    className={`border-b border-slate-100 last:border-0 ${isCurrentUser ? 'bg-purple-50/50' : ''
                                                        } hover:bg-slate-50/50 transition-colors`}
                                                >
                                                    <td className="py-3 px-4">
                                                        {getRankBadge(entry.rank)}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="font-medium text-slate-900">
                                                            {isCurrentUser ? 'You' : entry.maskedEmail}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <span className="font-bold text-slate-900">{entry.points || 0}</span>
                                                    </td>
                                                </tr>
                                            </React.Fragment>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Pro Plus Upgrade Banner with Referral Benefits - Moved Above Email Field */}
                <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 shadow-sm">
                    <div className="bg-gray-100 rounded-xl p-3 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
                                <Award className="w-5 h-5 text-white stroke-2" />
                            </div>
                            <h3 className="font-bold text-lg text-gray-900">Special Early Access Offer</h3>
                        </div>
                    </div>
                    <div className="flex-1">
                            <div className="space-y-3">
                                {/* Referral Benefits Section - 70:30 Layout */}
                                <div className="grid grid-cols-1 md:grid-cols-[7fr_3fr] gap-3 mt-4">
                                    <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                                        <div className="flex items-start gap-2 mb-2">
                                            <Gift className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                                            <div className="font-semibold text-slate-900">For You:</div>
                                        </div>
                                        <ul className="text-slate-700 text-xs space-y-1">
                                            <li>• Join the waitlist for the <strong className="text-purple-700">Pro plan</strong> and get automatically upgraded to <strong className="text-purple-700">Pro Plus</strong> when it launches—at no extra cost!</li>
                                            <li>• Move up 3 positions per referral</li>
                                            <li>• Unlock Pro Plus at 5 referrals</li>
                                            <li>• Earn 30 points per referral</li>
                                            <li>• 20% off first 3 months</li>
                                        </ul>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                                        <div className="flex items-start gap-2 mb-2">
                                            <Users className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                                            <div className="font-semibold text-slate-900">For Friends:</div>
                                        </div>
                                        <ul className="text-slate-700 text-xs space-y-1">
                                            <li>• Skip ahead 10 positions</li>
                                            <li>• Priority early access</li>
                                            <li>• 15% off first 3 months</li>
                                        </ul>
                                    </div>
                                </div>

                                {referralCodeFromUrl && (
                                    <div className="mt-3 bg-gray-100 border border-gray-200 rounded-lg p-2.5 text-xs text-gray-700">
                                        <span className="font-semibold">✨ You were referred!</span> You'll skip ahead 10 positions when you sign up.
                                    </div>
                                )}
                            </div>
                    </div>
                </div>

                {/* Fixed Email Field - Always Visible */}
                <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 shadow-sm">
                    <Label htmlFor="email-check" className="text-base font-semibold text-slate-900 mb-3 block">
                        Enter your email
                    </Label>
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Input
                                id="email-check"
                                type="email"
                                placeholder="you@company.com"
                                value={emailInput}
                                onChange={(e) => setEmailInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={emailLocked && !isEditingEmail}
                                className={`flex-1 ${emailLocked && !isEditingEmail ? 'bg-slate-50 pr-10' : 'pr-12'}`}
                            />
                            {/* Actions Group - Right Aligned in Input */}
                            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                {!checkingStatus && !emailLocked && (
                                    <Button
                                        size="sm"
                                        className="h-8 w-8 p-0 rounded-full bg-slate-900 hover:bg-slate-800"
                                        onClick={handleCheckClick}
                                        type="button"
                                        disabled={!emailInput || !emailInput.includes('@')}
                                    >
                                        <ArrowRight className="w-4 h-4 text-white" />
                                    </Button>
                                )}

                                {emailLocked && !isEditingEmail && (
                                    <>
                                        <Lock className="w-4 h-4 text-slate-400 mr-1" />
                                        <button
                                            type="button"
                                            onClick={handleUnlockEmail}
                                            className="p-1.5 hover:bg-slate-200 rounded-full transition-colors"
                                            aria-label="Edit email"
                                        >
                                            <Pencil className="w-3.5 h-3.5 text-slate-600" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                        {checkingStatus && (
                            <div className="flex items-center text-sm text-slate-500 px-4">
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Checking...
                            </div>
                        )}
                    </div>
                    {emailCheckError && (
                        <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-sm text-yellow-800">
                                {emailCheckError}
                            </p>
                        </div>
                    )}
                    {emailInput && !checkingStatus && !waitlistStatus?.exists && emailInput.includes('@') && emailLocked && !emailCheckError && !submitted && (
                        <p className="text-sm text-slate-500 mt-2">
                            Not on the waitlist yet. Fill out the form below to join.
                        </p>
                    )}
                </div>

                {/* Dynamic Content Branching Based on Email Check */}
                {checkingStatus ? (
                    /* Show loading state while checking */
                    <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-600 mb-4" />
                        <p className="text-gray-600">Checking waitlist status...</p>
                    </div>
                ) : waitlistStatus?.exists && emailInput ? (
                    /* BRANCH 1: Show Waitlist Status (Email Found) */
                    <div className="space-y-6">
                        {/* User Status Card */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <div className="text-center mb-6">
                                <CheckCircle2 className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">You're on the waitlist!</h2>
                            </div>

                            {/* User Stats - Matching Reference Design */}
                            <div className="bg-gray-100 rounded-xl p-6 mb-6 border border-gray-200">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-600 font-semibold">Your current position:</span>
                                        <span className="text-2xl font-black text-purple-600">#{waitlistStatus.position}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-600 font-semibold">Your current points:</span>
                                        <span className="text-2xl font-black text-purple-600">
                                            {leaderboard?.userPoints || 0}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-600 font-semibold">Your referrals:</span>
                                        <span className="text-2xl font-black text-purple-600">
                                            {waitlistStatus.referralCount || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Points to Move Up Message */}
                            {leaderboard && leaderboard.userRank && leaderboard.userRank > 1 && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-2">
                                    <Zap className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-slate-700">
                                        {(() => {
                                            const nextRankPoints = leaderboard.entries.find((e: any) => e.rank === leaderboard.userRank! - 1)?.points || 0
                                            const pointsNeeded = nextRankPoints - (leaderboard.userPoints || 0)
                                            if (pointsNeeded > 0) {
                                                return `You need ${pointsNeeded} more points to move up! Refer friends to earn 30 points per referral.`
                                            }
                                            return "Keep referring to move up the leaderboard!"
                                        })()}
                                    </div>
                                </div>
                            )}

                            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold text-slate-700">Selected Plan:</span>
                                    <span className="text-sm font-bold text-slate-900">
                                        {waitlistStatus.upgradedToProPlus ? 'Pro Plus ✨' : waitlistStatus.plan}
                                    </span>
                                </div>
                                {waitlistStatus.upgradedToProPlus ? (
                                    <div className="mt-2 text-xs text-slate-700 bg-amber-50 rounded p-2 border border-amber-200">
                                        <span className="font-semibold">🎉 You've earned Pro Plus upgrade</span> with {waitlistStatus.referralCount} referrals!
                                    </div>
                                ) : waitlistStatus.plan === 'Pro' && (
                                    <div className="mt-2 text-xs text-slate-700 bg-purple-50 rounded p-2 border border-purple-100">
                                        ✨ Get 5 referrals to automatically upgrade to Pro Plus!
                                    </div>
                                )}
                            </div>

                            {/* Referral Stats */}
                            {waitlistStatus.referralCount !== null && waitlistStatus.referralCount > 0 && (
                                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-slate-700">Referrals:</span>
                                        <span className="text-sm font-bold text-slate-900">{waitlistStatus.referralCount}</span>
                                    </div>
                                    {waitlistStatus.positionBoost !== null && waitlistStatus.positionBoost > 0 && (
                                        <div className="mt-2 text-xs text-slate-600">
                                            ⬆️ You've moved up {waitlistStatus.positionBoost} positions from referrals!
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Referral Section */}
                        {waitlistStatus.referralCode && (
                            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
                                        <Gift className="w-5 h-5 text-white stroke-2" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg mb-2 text-slate-900">Share Your Referral Link</h3>
                                        <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                                            Invite others and move up 3 positions for each referral! Get 5 referrals to unlock Pro Plus upgrade.
                                        </p>

                                        {/* Referral Link */}
                                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 flex items-center gap-2">
                                            <code className="text-xs font-mono text-slate-700 flex-1 break-all">
                                                {typeof window !== 'undefined' ? `${window.location.origin}/waitlist?ref=${waitlistStatus.referralCode}&utm_source=referral&utm_medium=link&utm_campaign=waitlist` : `https://pockett.io/waitlist?ref=${waitlistStatus.referralCode}&utm_source=referral&utm_medium=link&utm_campaign=waitlist`}
                                            </code>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={async () => {
                                                    const link = typeof window !== 'undefined'
                                                        ? `${window.location.origin}/waitlist?ref=${waitlistStatus.referralCode}&utm_source=referral&utm_medium=link&utm_campaign=waitlist`
                                                        : `https://pockett.io/waitlist?ref=${waitlistStatus.referralCode}&utm_source=referral&utm_medium=link&utm_campaign=waitlist`
                                                    try {
                                                        await navigator.clipboard.writeText(link)
                                                        setReferralLinkCopied(true)
                                                        setTimeout(() => setReferralLinkCopied(false), 2000)
                                                    } catch (err) {
                                                        // Fallback
                                                    }
                                                }}
                                                className="bg-slate-900 text-white hover:bg-slate-800 border-0"
                                            >
                                                {referralLinkCopied ? (
                                                    <>
                                                        <Check className="w-4 h-4 mr-1" />
                                                        Copied!
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="w-4 h-4 mr-1" />
                                                        Copy
                                                    </>
                                                )}
                                            </Button>
                                        </div>

                                        {/* Referral Benefits */}
                                        <div className="grid grid-cols-1 md:grid-cols-[7fr_3fr] gap-3 text-sm">
                                            <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                                                <div className="flex items-start gap-2 mb-2">
                                                    <Gift className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                                                    <div className="font-semibold text-slate-900">For You:</div>
                                                </div>
                                                <ul className="text-slate-700 text-xs space-y-1">
                                                    <li>• Join the waitlist for the <strong className="text-purple-700">Pro plan</strong> and get automatically upgraded to <strong className="text-purple-700">Pro Plus</strong> when it launches—at no extra cost!</li>
                                                    <li>• +3 positions per referral</li>
                                                    <li>• Pro Plus at 5 referrals</li>
                                                    <li>• 20% off first 3 months</li>
                                                </ul>
                                            </div>
                                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                                                <div className="flex items-start gap-2 mb-2">
                                                    <Users className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                                                    <div className="font-semibold text-slate-900">For Friends:</div>
                                                </div>
                                                <ul className="text-slate-700 text-xs space-y-1">
                                                    <li>• Skip ahead 10 positions</li>
                                                    <li>• Priority early access</li>
                                                    <li>• 15% off first 3 months</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : submitted ? (
                    /* Success Message After Submission */
                    <div className="space-y-6">
                        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
                            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">You're on the list!</h2>
                            <p className="text-slate-600">{successMessage}</p>
                        </div>

                        {/* Referral Link Section - Show after first-time signup */}
                        {newReferralCode && (
                            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
                                        <Gift className="w-5 h-5 text-white stroke-2" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg mb-2 text-slate-900">Share Your Referral Link</h3>
                                        <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                                            Invite others and move up 3 positions for each referral! Get 5 referrals to unlock Pro Plus upgrade.
                                        </p>

                                        {/* Referral Link */}
                                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 flex items-center gap-2">
                                            <code className="text-xs font-mono text-slate-700 flex-1 break-all">
                                                {typeof window !== 'undefined'
                                                    ? `${window.location.origin}/waitlist?ref=${newReferralCode}&utm_source=referral&utm_medium=link&utm_campaign=waitlist`
                                                    : `https://pockett.io/waitlist?ref=${newReferralCode}&utm_source=referral&utm_medium=link&utm_campaign=waitlist`
                                                }
                                            </code>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={async () => {
                                                    const link = typeof window !== 'undefined'
                                                        ? `${window.location.origin}/waitlist?ref=${newReferralCode}&utm_source=referral&utm_medium=link&utm_campaign=waitlist`
                                                        : `https://pockett.io/waitlist?ref=${newReferralCode}&utm_source=referral&utm_medium=link&utm_campaign=waitlist`
                                                    try {
                                                        await navigator.clipboard.writeText(link)
                                                        setReferralLinkCopied(true)
                                                        setTimeout(() => setReferralLinkCopied(false), 2000)
                                                    } catch (err) {
                                                        // Fallback for older browsers
                                                        const textArea = document.createElement('textarea')
                                                        textArea.value = link
                                                        textArea.style.position = 'fixed'
                                                        textArea.style.opacity = '0'
                                                        document.body.appendChild(textArea)
                                                        textArea.select()
                                                        try {
                                                            document.execCommand('copy')
                                                            setReferralLinkCopied(true)
                                                            setTimeout(() => setReferralLinkCopied(false), 2000)
                                                        } catch (fallbackErr) {
                                                            console.error('Failed to copy:', fallbackErr)
                                                        }
                                                        document.body.removeChild(textArea)
                                                    }
                                                }}
                                                className="bg-slate-900 text-white hover:bg-slate-800 border-0"
                                            >
                                                {referralLinkCopied ? (
                                                    <>
                                                        <Check className="w-4 h-4 mr-1" />
                                                        Copied!
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="w-4 h-4 mr-1" />
                                                        Copy
                                                    </>
                                                )}
                                            </Button>
                                        </div>

                                        {/* Referral Benefits */}
                                        <div className="grid grid-cols-1 md:grid-cols-[7fr_3fr] gap-3 text-sm">
                                            <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                                                <div className="flex items-start gap-2 mb-2">
                                                    <Gift className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                                                    <div className="font-semibold text-slate-900">For You:</div>
                                                </div>
                                                <ul className="text-slate-700 text-xs space-y-1">
                                                    <li>• Join the waitlist for the <strong className="text-purple-700">Pro plan</strong> and get automatically upgraded to <strong className="text-purple-700">Pro Plus</strong> when it launches—at no extra cost!</li>
                                                    <li>• +3 positions per referral</li>
                                                    <li>• Pro Plus at 5 referrals</li>
                                                    <li>• 20% off first 3 months</li>
                                                </ul>
                                            </div>
                                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                                                <div className="flex items-start gap-2 mb-2">
                                                    <Users className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                                                    <div className="font-semibold text-slate-900">For Friends:</div>
                                                </div>
                                                <ul className="text-slate-700 text-xs space-y-1">
                                                    <li>• Skip ahead 10 positions</li>
                                                    <li>• Priority early access</li>
                                                    <li>• 15% off first 3 months</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : emailInput && !waitlistStatus?.exists && emailInput.includes('@') && emailLocked && !emailCheckError ? (
                    /* BRANCH 2: Show New Waitlist Joining Form (Email Not Found) */
                    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-slate-900 mb-2">Complete Your Profile</h2>
                            <p className="text-sm text-slate-600">Fill out the form below to join the waitlist.</p>
                        </div>
                        <div className="space-y-6">
                            {/* Email - Pre-filled from email check (hidden, value comes from emailInput state) */}
                            <input type="hidden" name="email" value={emailInput} />
                            {referralCodeFromUrl && (
                                <input type="hidden" name="referralCode" value={referralCodeFromUrl.toUpperCase()} />
                            )}

                            {/* Company Name - Optional */}
                            <div>
                                <Label htmlFor="companyName" className="text-base font-semibold">
                                    Company Name
                                </Label>
                                <Input
                                    id="companyName"
                                    name="companyName"
                                    type="text"
                                    placeholder="Your Company"
                                    className="mt-2"
                                />
                            </div>

                            {/* Company Size - Optional */}
                            <div>
                                <Label htmlFor="companySize" className="text-base font-semibold">
                                    Company Size
                                </Label>
                                <Select name="companySize">
                                    <SelectTrigger className="mt-2">
                                        <SelectValue placeholder="Select size" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="solo">Just me (Solo)</SelectItem>
                                        <SelectItem value="2-10">2-10 employees</SelectItem>
                                        <SelectItem value="11-50">11-50 employees</SelectItem>
                                        <SelectItem value="51-200">51-200 employees</SelectItem>
                                        <SelectItem value="200+">200+ employees</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Role - Optional */}
                            <div>
                                <Label htmlFor="role" className="text-base font-semibold">
                                    Your Role
                                </Label>
                                <Input
                                    id="role"
                                    name="role"
                                    type="text"
                                    placeholder="e.g., Consultant, Accountant, Founder"
                                    className="mt-2"
                                />
                            </div>

                            {/* Comments - Optional */}
                            <div>
                                <Label htmlFor="comments" className="text-base font-semibold">
                                    Tell us what you're looking for (optional)
                                </Label>
                                <Textarea
                                    id="comments"
                                    name="comments"
                                    placeholder="What problems are you trying to solve? What features are you most excited about?"
                                    rows={4}
                                    className="mt-2"
                                />
                            </div>

                            {/* Honeypot */}
                            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" />

                            {/* Turnstile */}
                            <div className="flex justify-center">
                                <Turnstile
                                    siteKey={turnstileSiteKey}
                                    onSuccess={(token) => setTurnstileToken(token)}
                                    onError={() => setTurnstileToken("")}
                                    onExpire={() => setTurnstileToken("")}
                                />
                            </div>

                            {/* Error Message */}
                            {formError && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                                    {formError}
                                </div>
                            )}

                            {/* Submit Button - same hover spread as pricing CTAs */}
                            <StdCTAButton
                                type="submit"
                                variant="black"
                                disabled={!turnstileToken || isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    "Join waitlist"
                                )}
                            </StdCTAButton>
                        </div>
                    </form>
                ) : null}
                </div>
            </section>
            <Footer />
        </div>
    )
}

export default function WaitlistPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white">
                <Header />
                <div className="max-w-3xl mx-auto px-4 py-24 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-600" />
                </div>
                <Footer />
            </div>
        }>
            <WaitlistPageContent />
        </Suspense>
    )
}
