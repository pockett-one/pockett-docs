import { OnboardingForm } from '@/components/onboarding/onboarding-form'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { Suspense } from 'react'

export default function OnboardingPage() {
    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-slate-400 selection:text-white relative overflow-hidden flex flex-col">
            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-6 relative z-10">
                <div className="w-full max-w-md">
                    {/* Title */}
                    <div className="text-center mb-8">
                        <Link href="/" className="inline-block mb-6 hover:opacity-80 transition-opacity">
                            <Logo size="lg" variant="neutral" />
                        </Link>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">
                            Sign up
                        </h1>
                        <p className="text-slate-600">
                            Create your account and start organizing your documents
                        </p>
                    </div>

                    {/* Form */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
                        <Suspense fallback={<div className="flex justify-center p-8">Loading...</div>}>
                            <OnboardingForm />
                        </Suspense>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-sm text-slate-500 mt-6">
                        Already have an account?{' '}
                        <Link href="/signin" className="text-slate-600 hover:text-slate-800 font-medium hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </main>
        </div>
    )
}
