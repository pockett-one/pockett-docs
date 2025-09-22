"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import Logo from "@/components/Logo"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { Home } from "lucide-react"

export default function AuthPage() {
  const [loading, setLoading] = useState(false)
  const { signInWithGoogle } = useAuth()

  const handleGoogleAuth = async () => {
    setLoading(true)
    try {
      await signInWithGoogle()
    } catch (error) {
      console.error('Auth error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Logo & Title */}
            <div className="flex items-center space-x-3">
              <Logo size="sm" />
            </div>
            
            {/* Right side - Return to Homepage */}
            <Link href="/">
              <Button 
                variant="ghost" 
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
              >
                <Home className="h-4 w-4" />
                <span>Return to Homepage</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg w-full">
          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-10 py-8 border-b border-gray-200">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">Welcome to Pockett Docs</h2>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Continue to Pockett Docs to access your documents and productivity tools.
                </p>
              </div>
            </div>

            {/* Card Body */}
            <div className="px-10 py-10">
              {/* Auth Form */}
              <div className="space-y-8">
                <Button
                  onClick={handleGoogleAuth}
                  disabled={loading}
                  className="w-full bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 flex items-center justify-center space-x-3 py-5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md text-base font-medium"
                >
                  <svg className="h-6 w-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="font-medium">{loading ? 'Continuing...' : 'Continue with Google'}</span>
                </Button>

                {/* Divider */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-6 bg-white text-gray-500 font-medium">Secure Authentication</span>
                  </div>
                </div>

                {/* Terms */}
                <div className="text-center pt-2">
                  <p className="text-sm text-gray-500 leading-relaxed">
                    By continuing, you agree to our{' '}
                    <Link href="/terms" className="text-blue-600 hover:text-blue-700 underline font-medium">Terms of Service</Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="text-blue-600 hover:text-blue-700 underline font-medium">Privacy Policy</Link>.
                  </p>
                </div>
              </div>
            </div>

            {/* Card Footer */}
            <div className="bg-gray-50 px-10 py-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-sm text-gray-500 font-medium">
                  🔒 Your data is protected with enterprise-grade security
                </p>
              </div>
            </div>
          </div>

          {/* Additional Info Section */}
          <div className="mt-8 text-center">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Why Choose Pockett Docs?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600">
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">📊</span>
                  </div>
                  <span className="font-medium">Analytics</span>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">👥</span>
                  </div>
                  <span className="font-medium">Collaboration</span>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-bold">🔒</span>
                  </div>
                  <span className="font-medium">Security</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
