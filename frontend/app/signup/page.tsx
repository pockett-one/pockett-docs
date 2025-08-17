"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { FolderOpen } from "lucide-react"
import Link from "next/link"

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    organization: "",
    agreeToTerms: false
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

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
      // Simulate account creation
      console.log("Form submitted:", formData)
      // Redirect to sign in page
      setTimeout(() => {
        window.location.href = "/signin"
      }, 1000)
    }
  }

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const isFormValid = formData.firstName && formData.lastName && formData.email && formData.agreeToTerms && Object.keys(errors).length === 0

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
              onClick={() => window.location.href = "/signin"}
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-normal text-gray-900 mb-2">
              Create your account
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <Input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleInputChange("firstName")}
                className={errors.firstName ? "border-red-500" : ""}
                placeholder="Enter your first name"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
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
                className={errors.lastName ? "border-red-500" : ""}
                placeholder="Enter your last name"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange("email")}
                className={errors.email ? "border-red-500" : ""}
                placeholder="Enter your email address"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-1">
                Organization <span className="text-gray-500">(Optional)</span>
              </label>
              <Input
                id="organization"
                type="text"
                value={formData.organization}
                onChange={handleInputChange("organization")}
                placeholder="Enter your organization name"
              />
            </div>

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
                className={errors.agreeToTerms ? "border-red-500" : ""}
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
                {errors.agreeToTerms && (
                  <p className="mt-1 text-red-600">{errors.agreeToTerms}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!isFormValid}
            >
              Create Account
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
              onClick={() => console.log("Google sign up")}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>

            <div className="text-center">
              <span className="text-gray-600">Already have an account? </span>
              <button 
                type="button"
                onClick={() => window.location.href = "/signin"}
                className="text-blue-600 hover:text-blue-500 underline"
              >
                Sign In
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}