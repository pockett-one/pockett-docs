import { OnboardingForm } from '@/components/onboarding/onboarding-form'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { Suspense } from 'react'

export default function OnboardingPage() {
    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-purple-500 selection:text-white relative overflow-hidden flex flex-col">
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

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-6 relative z-10">
                <div className="w-full max-w-md">
                    {/* Title */}
                    <div className="text-center mb-8">
                        <Link href="/" className="inline-block mb-6 hover:opacity-80 transition-opacity">
                            <Logo size="lg" />
                        </Link>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">
                            Sign up for Pockett
                        </h1>
                        <p className="text-slate-600">
                            Create your account and start organizing your documents
                        </p>
                    </div>

                    {/* Form */}
                    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-slate-200/60">
                        <Suspense fallback={<div className="flex justify-center p-8">Loading...</div>}>
                            <OnboardingForm />
                        </Suspense>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-sm text-slate-500 mt-6">
                        Already have an account?{' '}
                        <Link href="/signin" className="text-purple-600 hover:text-purple-700 font-medium hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </main>
        </div>
    )
}
