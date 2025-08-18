"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { FolderOpen, Loader2, CheckCircle2, Shield } from "lucide-react"
import Link from "next/link"
import { saveUserData, setAuthSession } from "@/lib/auth-utils"

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    organization: "",
    agreeToTerms: false
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showOrgField, setShowOrgField] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required"
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required"
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }
    
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the Terms of Service and Privacy Policy"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      setIsLoading(true)
      
      // Save user data to localStorage
      saveUserData({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        organization: formData.organization
      })
      
      // Set authentication session for new user
      setAuthSession(true)
      
      // Simulate account creation
      console.log("Form submitted:", formData)
      
              setTimeout(() => {
          setShowSuccess(true)
          setTimeout(() => {
            setIsLoading(false)
            // Store email in localStorage for seamless signin experience
            localStorage.setItem('pockett_signup_email', formData.email)
            window.location.href = "/signin"
          }, 1500)
        }, 1000)
    }
  }

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value
    
    // Smart defaults
    if (field === 'firstName' || field === 'lastName') {
      value = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
    }
    if (field === 'email') {
      value = value.trim().toLowerCase()
    }
    
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Progressive disclosure for organization field
    if (field === 'email' && value.includes('@') && !showOrgField) {
      setShowOrgField(true)
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const isFormValid = formData.firstName && formData.lastName && formData.email && formData.agreeToTerms && Object.keys(errors).length === 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex flex-col">
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
              onClick={() => {
                // Store email in localStorage if user has entered it
                if (formData.email) {
                  localStorage.setItem('pockett_signup_email', formData.email)
                }
                window.location.href = "/signin"
              }}
            >
              Sign In
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
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 to-blue-600/5 pointer-events-none" />
            
            <div className="text-center mb-8 relative">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl mb-4 shadow-lg">
                <FolderOpen className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                Create your account
              </h1>
              <p className="text-gray-600 mb-4">
                Connect your documents and unlock powerful insights in minutes
              </p>
              <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs text-blue-700">
                <Shield className="h-3 w-3 mr-1" />
                Enterprise-grade security • SOC 2 compliant
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-2">
                    First Name
                  </label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange("firstName")}
                    className={`h-12 bg-white/50 border-2 transition-all duration-200 focus:bg-white ${
                      errors.firstName ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-indigo-500"
                    }`}
                    placeholder="Enter first name"
                    disabled={isLoading}
                  />
                  {errors.firstName && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <span className="w-4 h-4 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs mr-2">!</span>
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-2">
                    Last Name
                  </label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange("lastName")}
                    className={`h-12 bg-white/50 border-2 transition-all duration-200 focus:bg-white ${
                      errors.lastName ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-indigo-500"
                    }`}
                    placeholder="Enter last name"
                    disabled={isLoading}
                  />
                  {errors.lastName && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <span className="w-4 h-4 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs mr-2">!</span>
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange("email")}
                  className={`h-12 bg-white/50 border-2 transition-all duration-200 focus:bg-white ${
                    errors.email ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-indigo-500"
                  }`}
                  placeholder="Enter your email address"
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <span className="w-4 h-4 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs mr-2">!</span>
                    {errors.email}
                  </p>
                )}
              </div>

              {showOrgField && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <label htmlFor="organization" className="block text-sm font-semibold text-gray-700 mb-2">
                    Organization <span className="text-gray-500 font-normal">(Optional)</span>
                  </label>
                  <Input
                    id="organization"
                    type="text"
                    value={formData.organization}
                    onChange={handleInputChange("organization")}
                    className="h-12 bg-white/50 border-2 border-gray-200 focus:border-indigo-500 transition-all duration-200 focus:bg-white"
                    placeholder="Enter your organization name"
                    disabled={isLoading}
                  />
                </div>
              )}

              <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => {
                      setFormData(prev => ({ ...prev, agreeToTerms: checked as boolean }))
                      if (errors.agreeToTerms) {
                        setErrors(prev => ({ ...prev, agreeToTerms: "" }))
                      }
                    }}
                    className={`mt-0.5 ${errors.agreeToTerms ? "border-red-500" : "border-gray-300"}`}
                  />
                  <div className="text-sm">
                    <label htmlFor="agreeToTerms" className="text-gray-700 leading-relaxed">
                      I agree to the{" "}
                      <button 
                        type="button"
                        onClick={() => window.open('/terms', '_blank')}
                        className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                      >
                        Terms of Service
                      </button>{" "}
                      and{" "}
                      <button 
                        type="button"
                        onClick={() => window.open('/privacy', '_blank')}
                        className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                      >
                        Privacy Policy
                      </button>
                    </label>
                    {errors.agreeToTerms && (
                      <p className="mt-2 text-red-600 flex items-center text-xs">
                        <span className="w-4 h-4 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs mr-2">!</span>
                        {errors.agreeToTerms}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className={`w-full h-12 font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 ${
                  showSuccess ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700" : "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
                } text-white hover:shadow-xl`}
                disabled={!isFormValid || isLoading}
              >
                {showSuccess ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Account created! Redirecting...
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

              {/* Google Sign Up Alternative */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">or</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 font-semibold rounded-xl transition-all duration-200 hover:shadow-md"
                onClick={() => console.log("Google sign up")}
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>

              <div className="pt-6 border-t border-gray-200/50 text-center">
                <span className="text-gray-600">Already have an account? </span>
                <button 
                  type="button"
                  onClick={() => {
                    // Store email in localStorage if user has entered it
                    if (formData.email) {
                      localStorage.setItem('pockett_signup_email', formData.email)
                    }
                    window.location.href = "/signin"
                  }}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
                >
                  Sign In
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}