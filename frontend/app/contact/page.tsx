"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import Logo from "@/components/Logo"
import { Check, ChevronRight, Send, ArrowRight, Home } from "lucide-react"
import { createClient } from '@supabase/supabase-js'
import { Turnstile } from '@marsidev/react-turnstile'
import { submitContactForm } from "@/app/actions/submit-contact"
import { sendEvent, ANALYTICS_EVENTS } from "@/lib/analytics"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { PRICING_PLANS } from "@/config/pricing"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ContactPage() {
    const [formData, setFormData] = useState({
        plan: "pro", // Default to Pro
        email: "",
        role: "",
        otherRole: "", // Capture "Other" text
        teamSize: "",
        painPoint: "",
        featureRequest: "",
        comments: "",
    })

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [turnstileToken, setTurnstileToken] = useState<string>("")
    const [formError, setFormError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormError(null)

        // 1. Email Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email)) {
            setFormError('Please enter a valid work email address.')
            return
        }

        // 2. Required Fields Check
        if (!formData.role) {
            setFormError('Please select your primary role.')
            return
        }
        if (formData.role === 'Other' && !formData.otherRole.trim()) {
            setFormError('Please specify your role.')
            return
        }
        if (!formData.teamSize) {
            setFormError('Please select your team size.')
            return
        }
        if (!formData.painPoint.trim()) {
            setFormError('Please describe your pain points.')
            return
        }

        setIsSubmitting(true)

        try {
            // Re-construct FormData manually
            const payload = new FormData()
            payload.append('email', formData.email)
            payload.append('plan', formData.plan) // Will be "pro"

            // Handle Role
            let finalRole = formData.role
            if (formData.role === 'Other') {
                finalRole = `Other - ${formData.otherRole}`
            }
            payload.append('role', finalRole)

            payload.append('teamSize', formData.teamSize)
            payload.append('painPoint', formData.painPoint)
            payload.append('featureRequest', formData.featureRequest)
            payload.append('comments', formData.comments)

            // Get honeypot
            const formElement = e.target as HTMLFormElement
            const honeypotVal = (formElement.elements.namedItem('website') as HTMLInputElement)?.value
            if (honeypotVal) payload.append('website', honeypotVal)

            const result = await submitContactForm(payload, turnstileToken)

            if (!result.success) {
                throw new Error(result.message)
            }

            setSubmitted(true)

            // Analytics
            sendEvent({
                action: ANALYTICS_EVENTS.CONTACT_SUBMIT,
                category: 'Engagement',
                label: 'Contact Form',
                plan: formData.plan,
                role: payload.get('role') as string
            })
        } catch (error) {
            console.error('Error submitting form:', error)
            setFormError(error instanceof Error ? error.message : 'Failed to submit form.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Message Received!</h2>
                    <p className="text-slate-600 mb-8">
                        Thanks for your feedback. We read every single message to build a better product for you.
                    </p>
                    <Link href="/">
                        <Button className="w-full">Back to Home</Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-purple-500 selection:text-white relative overflow-hidden">
            {/* Background Ambience */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                {/* Dot Grid */}
                <div className="absolute inset-0 opacity-[0.4]"
                    style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
                </div>
                {/* Subtle Purple Haze */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-100/40 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-slate-100/50 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />
            </div>

            {/* Header */}
            <Header />

            {/* Breadcrumb */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 relative z-20 w-full mb-8">
                <div className="flex items-center justify-start space-x-2 text-sm text-slate-500">
                    <Link href="/" className="hover:text-purple-600 transition-colors p-1 -ml-1 hover:bg-purple-50 rounded-md">
                        <Home className="h-4 w-4" />
                        <span className="sr-only">Home</span>
                    </Link>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                    <span className="font-medium text-slate-900">Contact</span>
                </div>
            </div>

            <main className="pt-4 pb-16 px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-4">
                            Help us build Pockett
                        </h1>
                        <p className="text-lg text-slate-600 max-w-lg mx-auto">
                            We're building the most user-friendly Google Drive interface. Your feedback helps verify our roadmap.
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <form onSubmit={handleSubmit} className="p-8 space-y-8">

                            {/* Email Field */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-800 mb-2">
                                    Work Email
                                </label>
                                <Input
                                    type="email"
                                    required
                                    placeholder="name@company.com"
                                    value={formData.email}
                                    onChange={(e) => {
                                        setFormData({ ...formData, email: e.target.value })
                                        e.target.setCustomValidity('')
                                    }}
                                    onInvalid={(e) => {
                                        (e.target as HTMLInputElement).setCustomValidity('Please enter a valid email address.')
                                    }}
                                    className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                    name="email"
                                />
                            </div>

                            {/* Plan Selection (HIDDEN) */}
                            <div className="hidden">
                                <label className="block text-sm font-semibold text-slate-800 mb-4">
                                    Which plan interests you most?
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {PRICING_PLANS.map((plan) => (
                                        <label
                                            key={plan.id}
                                            className={`
                        relative flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                        ${formData.plan === plan.id
                                                    ? 'border-blue-600 bg-blue-50/50'
                                                    : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}
                      `}
                                        >
                                            <input
                                                type="radio"
                                                name="plan"
                                                value={plan.id}
                                                checked={formData.plan === plan.id}
                                                onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                                                className="sr-only"
                                            />
                                            <span className="capitalize font-semibold text-slate-900 mb-1">{plan.title}</span>
                                            <span className="text-xs text-slate-500 text-center">{plan.description}</span>

                                            {formData.plan === plan.id && (
                                                <div className="absolute top-2 right-2 text-blue-600">
                                                    <Check className="h-4 w-4" />
                                                </div>
                                            )}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* About You Section */}
                            <div className="space-y-6 pt-6 border-t border-slate-100">
                                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider text-opacity-50">About You</h3>

                                {/* Stacked Layout for Role & Team Size */}
                                <div className="space-y-6">

                                    {/* Primary Role */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Primary Role
                                        </label>
                                        <select
                                            className="w-full rounded-lg border-slate-200 text-slate-900 py-2.5 px-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors text-sm"
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            name="role"
                                            required
                                        >
                                            <option value="">Select a role...</option>
                                            <option value="Strategic Advisor">Strategic Advisor</option>
                                            <option value="Process Consultant">Process Consultant / Implementation</option>
                                            <option value="Fractional Executive">Fractional Executive</option>
                                            <option value="Firm Owner">Firm Owner</option>
                                            <option value="Agency Owner">Agency Owner</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>

                                    {/* Other Role Input (Conditional) */}
                                    {formData.role === 'Other' && (
                                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Please specify role
                                            </label>
                                            <Input
                                                type="text"
                                                required
                                                placeholder="e.g. Operations Manager"
                                                value={formData.otherRole}
                                                onChange={(e) => setFormData({ ...formData, otherRole: e.target.value })}
                                                className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                            />
                                        </div>
                                    )}

                                    {/* Team Size */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Team Size
                                        </label>
                                        <select
                                            className="w-full rounded-lg border-slate-200 text-slate-900 py-2.5 px-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors text-sm"
                                            value={formData.teamSize}
                                            onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                                            name="teamSize"
                                            required
                                        >
                                            <option value="">Select size...</option>
                                            <option value="1">Just me</option>
                                            <option value="2-20">2 - 20 members</option>
                                            <option value="21-50">21 - 50 members</option>
                                            <option value="51-100">51 - 100 members</option>
                                            <option value="100+">100+ members</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Biggest Challenge when Sharing Files with Clients
                                    </label>
                                    <textarea
                                        rows={3}
                                        placeholder="e.g. Finding shared files, permission mess..."
                                        value={formData.painPoint}
                                        onChange={(e) => setFormData({ ...formData, painPoint: e.target.value })}
                                        className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white transition-all resize-none"
                                        name="painPoint"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Feedback Section */}
                            <div className="space-y-6 pt-6 border-t border-slate-100">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                                        Feature Request <span className="font-normal text-slate-400 ml-1">(Optional)</span>
                                    </label>
                                    <p className="text-xs text-slate-500 mb-3">Is there a specific feature that would make Pockett Docs a "must-have" for you?</p>
                                    <textarea
                                        rows={3}
                                        className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white transition-all resize-none"
                                        placeholder="I wish Pockett could..."
                                        value={formData.featureRequest}
                                        onChange={(e) => setFormData({ ...formData, featureRequest: e.target.value })}
                                        name="featureRequest"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                                        Additional Comments <span className="font-normal text-slate-400 ml-1">(Optional)</span>
                                    </label>
                                    <textarea
                                        rows={3}
                                        className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white transition-all resize-none"
                                        placeholder="Any other thoughts?"
                                        value={formData.comments}
                                        onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                                        name="comments"
                                    />
                                </div>
                            </div>

                            {/* Honeypot & Captcha */}
                            <div className="space-y-4 pt-4">
                                {/* Expects 'website' hidden field */}
                                <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />

                                <div className="flex justify-center">
                                    <Turnstile
                                        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                                        onSuccess={(token) => setTurnstileToken(token)}
                                    />
                                </div>

                                {formError && (
                                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm text-center">
                                        {formError}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full h-12 text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/10"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center">
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white mr-2"></div>
                                            Sending...
                                        </span>
                                    ) : (
                                        <span className="flex items-center">
                                            Send Feedback <Send className="ml-2 h-4 w-4" />
                                        </span>
                                    )}
                                </Button>
                            </div>

                        </form>
                    </div>

                    <div className="text-center mt-8">
                        <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 font-medium transition-colors flex items-center justify-center">
                            Back to Home
                        </Link>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
