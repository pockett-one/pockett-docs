"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FolderOpen, Loader2, CheckCircle2, Shield } from "lucide-react"
import Link from "next/link"
import { saveUserData, getUserData, setAuthSession } from "@/lib/auth-utils"

export default function SignInPage() {
  const [step, setStep] = useState<"email" | "otp">("email")
  const [email, setEmail] = useState("")
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""])
  const [emailError, setEmailError] = useState("")
  const [otpError, setOtpError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [canResend, setCanResend] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(60)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  // Check for email from signup page in localStorage
  useEffect(() => {
    const signupEmail = localStorage.getItem('pockett_signup_email')
    if (signupEmail) {
      setEmail(signupEmail)
      // Clear the stored email after using it
      localStorage.removeItem('pockett_signup_email')
    }
    // Set initialization complete
    setIsInitializing(false)
  }, [])

  // Handle OTP countdown
  useEffect(() => {
    if (step === "otp" && !canResend && resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(prev => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (resendCountdown === 0) {
      setCanResend(true)
    }
  }, [step, canResend, resendCountdown])

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email)
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError("")
    
    if (!email.trim()) {
      setEmailError("Email is required")
      return
    }
    
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address")
      return
    }

    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      setStep("otp")
      setResendCountdown(60)
      setCanResend(false)
    }, 1000)
  }

  const handleOtpChange = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otpCode]
      newOtp[index] = value
      setOtpCode(newOtp)
      
      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`)
        nextInput?.focus()
      }
      
      // Clear error when user starts typing
      if (otpError) {
        setOtpError("")
      }
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasteData.length === 6) {
      setOtpCode(pasteData.split(''))
      setOtpError("")
      // Focus last input after paste
      setTimeout(() => {
        document.getElementById('otp-5')?.focus()
      }, 0)
    }
  }

  const handleOtpKeyDown = (index: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setOtpError("")
    
    const fullCode = otpCode.join("")
    if (fullCode.length !== 6) {
      setOtpError("Please enter the complete 6-digit code")
      return
    }

    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      if (fullCode === "123456") {
        // For existing users signing in, check if we have their data in localStorage
        // In a real app, this would come from the backend after authentication
        const existingUserData = getUserData()
        if (!existingUserData) {
          // Save placeholder data for existing users who don't have profile data yet
          // The default organization will be set automatically by saveUserData
          saveUserData({
            firstName: "Demo",
            lastName: "User",
            email: email,
            organization: "Demo's Organization"
          })
        }
        
        // Set authentication session
        setAuthSession(true)
        
        setShowSuccess(true)
        setTimeout(() => {
          setIsLoading(false)
          window.location.href = "/demo/app/connectors"
        }, 1500)
      } else {
        setIsLoading(false)
        setOtpError("The code you entered is incorrect. Please check your email and try again.")
        setOtpCode(["", "", "", "", "", ""])
        document.getElementById("otp-0")?.focus()
      }
    }, 1000)
  }

  const handleResend = async () => {
    if (!canResend) return
    
    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      setCanResend(false)
      setResendCountdown(60)
      setOtpError("")
    }, 1000)
  }

  const handleBackToEmail = () => {
    setStep("email")
    setOtpCode(["", "", "", "", "", ""])
    setOtpError("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button 
              onClick={() => window.location.href = "/"}
              className="flex items-center space-x-2 hover:opacity-75 transition-opacity"
            >
              <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <FolderOpen className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Pockett</span>
            </button>
            <Button 
              variant="ghost" 
              className="text-gray-600 hover:text-gray-900 hover:bg-white/50 transition-all"
              onClick={() => window.location.href = "/demo/signup"}
            >
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md">
          {/* Floating Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 relative overflow-hidden">
            {/* Decorative gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 pointer-events-none" />
            
            <div className="text-center mb-8 relative">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg">
                <FolderOpen className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                Welcome back
              </h1>
              <p className="text-gray-600 mb-4">
                Sign in to access your document insights
              </p>
              <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-green-50 border border-green-200 text-xs text-green-700">
                <Shield className="h-3 w-3 mr-1" />
                256-bit encrypted • Secure authentication
              </div>
            </div>

            {step === "email" ? (
              <>
                {isInitializing ? (
                  <div className="space-y-6 relative">
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                      <p className="text-gray-600">Loading your information...</p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleEmailSubmit} className="space-y-6 relative">
                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address
                      </label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          if (emailError) setEmailError("")
                        }}
                        className={`h-12 bg-white/50 border-2 transition-all duration-200 focus:bg-white ${
                          emailError ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-blue-500"
                        }`}
                        placeholder="Enter your email address"
                        disabled={isLoading}
                      />
                      {emailError && (
                        <p className="mt-2 text-sm text-red-600 flex items-center">
                          <span className="w-4 h-4 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs mr-2">!</span>
                          {emailError}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending code...
                        </>
                      ) : (
                        "Send Login Code"
                      )}
                    </Button>
                  </form>
                )}
              </>
            ) : (
              <div className="space-y-6 relative">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-xl p-6 shadow-sm">
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                      <span className="text-2xl">📧</span>
                    </div>
                    <p className="text-sm text-blue-800 font-medium mb-2">
                      Check your email for a 6-digit code
                    </p>
                    <p className="text-xs text-blue-600 mb-4">
                      💡 Demo hint: Use code <strong>123456</strong> to continue
                    </p>
                  </div>
                
                  <form onSubmit={handleOtpSubmit}>
                    <div className="flex justify-center space-x-2 mb-6">
                      {otpCode.map((digit, index) => (
                        <Input
                          key={index}
                          id={`otp-${index}`}
                          type="text"
                          inputMode="numeric"
                          value={digit}
                          onChange={handleOtpChange(index)}
                          onKeyDown={handleOtpKeyDown(index)}
                          onPaste={index === 0 ? handleOtpPaste : undefined}
                          className={`w-12 h-12 text-center text-lg font-bold bg-white border-2 rounded-lg transition-all duration-200 ${
                            otpError ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-blue-500 focus:bg-blue-50"
                          } ${digit ? "bg-blue-50 border-blue-300" : ""}`}
                          maxLength={1}
                          disabled={isLoading}
                        />
                      ))}
                    </div>
                    
                    {otpError && (
                      <div className="text-center mb-4">
                        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 inline-flex items-center">
                          <span className="w-4 h-4 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs mr-2">!</span>
                          {otpError}
                        </p>
                      </div>
                    )}
                    
                    <div className="text-center">
                      <Button
                        type="button"
                        variant="link"
                        onClick={handleResend}
                        disabled={!canResend || isLoading}
                        className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                      >
                        {canResend 
                          ? "Resend Code" 
                          : `Resend in ${resendCountdown}s`
                        }
                      </Button>
                    </div>
                  </form>
                </div>

                <Button
                  type="submit"
                  onClick={handleOtpSubmit}
                  className={`w-full h-12 font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 ${
                    showSuccess ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700" : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  } text-white hover:shadow-xl`}
                  disabled={isLoading || otpCode.join("").length !== 6}
                >
                  {showSuccess ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Success! Redirecting...
                    </>
                  ) : isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify Code"
                  )}
                </Button>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    onClick={handleBackToEmail}
                    className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                  >
                    ← Back to email
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200/50 text-center">
              <span className="text-gray-600">Don&rsquo;t have an account? </span>
              <button 
                type="button"
                onClick={() => window.location.href = "/demo/signup"}
                className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}