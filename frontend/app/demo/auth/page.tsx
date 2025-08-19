"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { FolderOpen, Loader2, CheckCircle2, Shield } from "lucide-react"
import { saveUserData, getUserData, setAuthSession } from "@/lib/auth-utils"

export default function AuthPage() {
  const [step, setStep] = useState<"email" | "signup" | "otp">("email")
  const [email, setEmail] = useState("")
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    organization: "",
    agreeToTerms: false
  })
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""])
  const [emailError, setEmailError] = useState("")
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [otpError, setOtpError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [canResend, setCanResend] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(60)
  const [showOrgField, setShowOrgField] = useState(false)

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

  const checkUserExists = async (email: string) => {
    // Simulate API call to check if user exists
    // In real app, this would hit your backend
    return email === "existing@example.com"
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
    
    // Check if user exists
    const userExists = await checkUserExists(email.trim().toLowerCase())
    
    setTimeout(() => {
      setIsLoading(false)
      if (userExists) {
        // Existing user - go to OTP
        setStep("otp")
        setResendCountdown(60)
        setCanResend(false)
      } else {
        // New user - go to signup form
        setStep("signup")
        setShowOrgField(false)
      }
    }, 1000)
  }

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errors: Record<string, string> = {}
    
    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required"
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required"
    }
    
    if (!formData.agreeToTerms) {
      errors.agreeToTerms = "You must agree to the Terms of Service and Privacy Policy"
    }
    
    setFormErrors(errors)
    
    if (Object.keys(errors).length === 0) {
      setIsLoading(true)
      
      // Save user data to localStorage
      saveUserData({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: email,
        organization: formData.organization || ""
      })
      
      setTimeout(() => {
        setShowSuccess(true)
        setTimeout(() => {
          setStep("otp")
          setIsLoading(false)
          setShowSuccess(false)
          setResendCountdown(60)
          setCanResend(false)
        }, 1500)
      }, 1000)
    }
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
      setTimeout(() => {
        document.getElementById('otp-5')?.focus()
      }, 0)
    }
  }

  const handleOtpKeyDown = (index: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
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
    
    setTimeout(() => {
      if (fullCode === "123456") {
        // For users coming from email-only step (existing users), ensure we have some user data
        const existingUserData = getUserData()
        if (!existingUserData) {
          // Save placeholder data for existing users
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
          window.location.href = "/dashboard/connectors"
        }, 1500)
      } else {
        setIsLoading(false)
        setOtpError("The code you entered is incorrect. Please check your email and try again.")
        setOtpCode(["", "", "", "", "", ""])
        document.getElementById("otp-0")?.focus()
      }
    }, 1000)
  }

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value
    
    // Smart defaults
    if (field === 'firstName' || field === 'lastName') {
      value = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
    }
    
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Progressive disclosure for organization field
    if (field === 'email' && value.includes('@') && !showOrgField) {
      setShowOrgField(true)
    }
    
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const handleResend = async () => {
    if (!canResend) return
    
    setIsLoading(true)
    
    setTimeout(() => {
      setIsLoading(false)
      setCanResend(false)
      setResendCountdown(60)
      setOtpError("")
    }, 1000)
  }

  const isSignupFormValid = formData.firstName && formData.lastName && formData.agreeToTerms && Object.keys(formErrors).length === 0

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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-normal text-gray-900 mb-2">
              {step === "email" ? "Welcome to Pockett" : 
               step === "signup" ? "Create your account" : 
               "Verify your email"}
            </h1>
            {step === "email" && (
              <p className="text-gray-600 text-sm mb-3">
                Enter your email to get started
              </p>
            )}
            {step === "signup" && (
              <p className="text-gray-600 text-sm mb-3">
                Connect your documents and unlock powerful insights in minutes
              </p>
            )}
            <div className="flex items-center justify-center text-xs text-gray-500">
              <Shield className="h-3 w-3 mr-1" />
              {step === "signup" ? "Enterprise-grade security • SOC 2 compliant" : "256-bit encrypted • Secure authentication"}
            </div>
          </div>

          {step === "email" && (
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
                    setEmail(e.target.value.trim().toLowerCase())
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
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>

              {/* Google Sign Up Alternative */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => console.log("Google auth")}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
            </form>
          )}

          {step === "signup" && (
            <form onSubmit={handleSignupSubmit} className="space-y-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <Input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleInputChange("firstName")}
                  className={formErrors.firstName ? "border-red-500" : ""}
                  placeholder="Enter your first name"
                  disabled={isLoading}
                />
                {formErrors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.firstName}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <Input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleInputChange("lastName")}
                  className={formErrors.lastName ? "border-red-500" : ""}
                  placeholder="Enter your last name"
                  disabled={isLoading}
                />
                {formErrors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.lastName}</p>
                )}
              </div>

              {showOrgField && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-1">
                    Organization <span className="text-gray-500">(Optional)</span>
                  </label>
                  <Input
                    id="organization"
                    type="text"
                    value={formData.organization}
                    onChange={handleInputChange("organization")}
                    placeholder="Enter your organization name"
                    disabled={isLoading}
                  />
                </div>
              )}

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => {
                    setFormData(prev => ({ ...prev, agreeToTerms: checked as boolean }))
                    if (formErrors.agreeToTerms) {
                      setFormErrors(prev => ({ ...prev, agreeToTerms: "" }))
                    }
                  }}
                  className={formErrors.agreeToTerms ? "border-red-500" : ""}
                />
                <div className="text-sm">
                  <label htmlFor="agreeToTerms" className="text-gray-700">
                    I agree to the{" "}
                    <button 
                      type="button"
                      onClick={() => window.open('/terms', '_blank')}
                      className="text-blue-600 hover:text-blue-500 underline"
                    >
                      Terms of Service
                    </button>{" "}
                    and{" "}
                    <button 
                      type="button"
                      onClick={() => window.open('/privacy', '_blank')}
                      className="text-blue-600 hover:text-blue-500 underline"
                    >
                      Privacy Policy
                    </button>
                  </label>
                  {formErrors.agreeToTerms && (
                    <p className="mt-1 text-red-600">{formErrors.agreeToTerms}</p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={!isSignupFormValid || isLoading}
              >
                {showSuccess ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                    Account created! Sending code...
                  </>
                ) : isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          )}

          {step === "otp" && (
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
                        onPaste={index === 0 ? handleOtpPaste : undefined}
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
                {showSuccess ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
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
                  onClick={() => setStep("email")}
                  className="text-sm text-gray-600 hover:text-gray-500"
                >
                  ← Back to email
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}