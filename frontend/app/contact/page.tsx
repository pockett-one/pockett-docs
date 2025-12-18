"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import Logo from "@/components/Logo"
import { Check, ChevronRight, Send, ArrowRight } from "lucide-react"
import { createClient } from '@supabase/supabase-js'
import { Turnstile } from '@marsidev/react-turnstile'
import { submitContactForm } from "@/app/actions/submit-contact"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { PRICING_PLANS } from "@/config/pricing"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ContactPage() {
    const [formData, setFormData] = useState({
        plan: "free",
        email: "", // Added email
        role: "",
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

        // 2. Mandatory Fields Check (1 of 3 required)
        if (!formData.painPoint.trim() && !formData.featureRequest.trim() && !formData.comments.trim()) {
            setFormError('Please provide at least one piece of feedback: Pain Point, Feature Request, or Additional Comments.')
            return
        }

        setIsSubmitting(true)

        try {
            // Let's use a hidden input in the form and get it via FormData construction from e.target
            const formElement = e.target as HTMLFormElement

            // Re-construct FormData manually to match Server Action expectation
            const payload = new FormData()
            payload.append('email', formData.email) // Append email
            payload.append('plan', formData.plan)
            payload.append('role', formData.role)
            payload.append('teamSize', formData.teamSize)
            payload.append('painPoint', formData.painPoint)
            payload.append('featureRequest', formData.featureRequest)
            payload.append('comments', formData.comments)

            // Get honeypot from the form element directly to catch auto-fillers
            const honeypotVal = (formElement.elements.namedItem('website') as HTMLInputElement)?.value
            if (honeypotVal) payload.append('website', honeypotVal)

            const result = await submitContactForm(payload, turnstileToken)

            if (!result.success) {
                throw new Error(result.message)
            }

            setSubmitted(true)
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 font-sans relative">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
                <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>
            {/* Header */}
            <Header />

            <main className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
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
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                    name="email"
                                />
                            </div>

                            {/* Plan Selection */}
                            <div>
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

                            {/* PMF Section */}
                            <div className="space-y-6 pt-6 border-t border-slate-100">
                                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider text-opacity-50">About You (Optional)</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Primary Role
                                        </label>
                                        <select
                                            className="w-full rounded-lg border-slate-200 text-slate-900 py-2.5 px-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors text-sm"
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            name="role" // Added name attribute
                                        >
                                            <option value="">Select a role...</option>
                                            <option value="freelancer">Freelancer</option>
                                            <option value="agency_owner">Agency Owner</option>
                                            <option value="founder">Founder</option>
                                            <option value="project_manager">Project Manager</option>
                                            <option value="internal_tools">Internal Tools / Ops</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Team Size
                                        </label>
                                        <select
                                            className="w-full rounded-lg border-slate-200 text-slate-900 py-2.5 px-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors text-sm"
                                            value={formData.teamSize}
                                            onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                                            name="teamSize" // Added name attribute
                                        >
                                            <option value="">Select size...</option>
                                            <option value="1">Just me</option>
                                            <option value="2-5">2-5 people</option>
                                            <option value="6-20">6-20 people</option>
                                            <option value="21-50">21-50 people</option>
                                            <option value="50+">50+ people</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Biggest Google Drive Pain Point
                                    </label>
                                    <textarea
                                        rows={3}
                                        placeholder="e.g. Finding shared files, permission mess..."
                                        value={formData.painPoint}
                                        onChange={(e) => setFormData({ ...formData, painPoint: e.target.value })}
                                        className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white transition-all resize-none"
                                        name="painPoint"
                                    />
                                </div>
                            </div>

                            {/* Feedback Section */}
                            <div className="space-y-6 pt-6 border-t border-slate-100">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                                        Feature Request
                                    </label>
                                    <p className="text-xs text-slate-500 mb-3">Is there a specific feature that would make Pockett a "must-have" for you?</p>
                                    <textarea
                                        rows={3}
                                        className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white transition-all resize-none"
                                        placeholder="I wish Pockett could..."
                                        value={formData.featureRequest}
                                        onChange={(e) => setFormData({ ...formData, featureRequest: e.target.value })}
                                        name="featureRequest" // Added name attribute
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                                        Additional Comments
                                    </label>
                                    <textarea
                                        rows={3}
                                        className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white transition-all resize-none"
                                        placeholder="Any other thoughts?"
                                        value={formData.comments}
                                        onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                                        name="comments" // Added name attribute
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
