"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FolderOpen } from "lucide-react"
import Link from "next/link"

export default function SignInPage() {
  const [step, setStep] = useState<"email" | "otp">("email")
  const [email, setEmail] = useState("")
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""])
  const [emailError, setEmailError] = useState("")
  const [otpError, setOtpError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [canResend, setCanResend] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(60)

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
      setIsLoading(false)
      if (fullCode === "123456") {
        // Success - redirect to connectors setup
        console.log("Sign in successful")
        window.location.href = "/setup"
      } else {
        setOtpError("Invalid code. Please try again.")
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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button 
              onClick={() => window.location.href = "/"}
              className="flex items-center space-x-2 hover:opacity-75"
            >
              <FolderOpen className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-semibold text-gray-900">Pockett</span>
            </button>
            <Button 
              variant="ghost" 
              className="text-gray-600"
              onClick={() => window.location.href = "/signup"}
            >
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-normal text-gray-900 mb-2">
              Welcome back
            </h1>
          </div>

          {step === "email" ? (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (emailError) setEmailError("")
                  }}
                  className={emailError ? "border-red-500" : ""}
                  placeholder="Enter your email address"
                  disabled={isLoading}
                />
                {emailError && (
                  <p className="mt-1 text-sm text-red-600">{emailError}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Login Code"}
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 mb-2">
                  Check your email for a 6-digit code
                </p>
                <p className="text-xs text-blue-600 mb-4">
                  💡 Demo hint: Use code <strong>123456</strong> to continue
                </p>
                
                <form onSubmit={handleOtpSubmit}>
                  <div className="flex justify-center space-x-2 mb-4">
                    {otpCode.map((digit, index) => (
                      <Input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        value={digit}
                        onChange={handleOtpChange(index)}
                        onKeyDown={handleOtpKeyDown(index)}
                        className={`w-12 h-12 text-center text-lg font-semibold ${
                          otpError ? "border-red-500" : ""
                        }`}
                        maxLength={1}
                        disabled={isLoading}
                      />
                    ))}
                  </div>
                  
                  {otpError && (
                    <p className="text-sm text-red-600 text-center mb-4">{otpError}</p>
                  )}
                  
                  <div className="text-center">
                    <Button
                      type="button"
                      variant="link"
                      onClick={handleResend}
                      disabled={!canResend || isLoading}
                      className="text-sm text-blue-600 hover:text-blue-500"
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
                className="w-full"
                disabled={isLoading || otpCode.join("").length !== 6}
              >
                {isLoading ? "Verifying..." : "Verify Code"}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={handleBackToEmail}
                  className="text-sm text-gray-600 hover:text-gray-500"
                >
                  ← Back to email
                </Button>
              </div>
            </div>
          )}

          <div className="mt-8 text-center">
            <span className="text-gray-600">Don&rsquo;t have an account? </span>
            <button 
              type="button"
              onClick={() => window.location.href = "/signup"}
              className="text-blue-600 hover:text-blue-500 underline"
            >
              Sign Up
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}