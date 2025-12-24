import { OnboardingForm } from '@/components/onboarding/onboarding-form'
import Link from 'next/link'

export default function OnboardingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
            {/* Header */}
            <header className="p-6">
                <Link href="/" className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">
                        P
                    </div>
                    <span className="text-xl font-semibold">Pockett</span>
                </Link>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                    {/* Title */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Sign up for Pockett
                        </h1>
                        <p className="text-gray-600">
                            Create your account and start organizing your documents
                        </p>
                    </div>

                    {/* Form */}
                    <div className="bg-white rounded-lg shadow-lg p-8">
                        <OnboardingForm />
                    </div>

                    {/* Footer */}
                    <p className="text-center text-sm text-gray-500 mt-6">
                        Already have an account?{' '}
                        <Link href="/auth/login" className="text-blue-600 hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </main>
        </div>
    )
}
