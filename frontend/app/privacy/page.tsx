"use client"

import { PrivacyPolicy } from "@/components/legal/privacy-policy"
import Logo from "@/components/Logo"
import Link from "next/link"
import { Home, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function PrivacyPolicyPage() {
  const router = useRouter()

  const handleBack = () => {
    router.back()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Logo */}
            <div className="flex items-center space-x-3">
              <Logo size="sm" />
            </div>
            
            {/* Right side - Navigation */}
            <div className="flex items-center space-x-4">
              <Button 
                onClick={handleBack}
                variant="ghost" 
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <Link href="/">
                <Button 
                  variant="ghost" 
                  className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                >
                  <Home className="h-4 w-4" />
                  <span>Homepage</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Page Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-8 border-b border-gray-200">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">Privacy Policy</h1>
              <p className="text-gray-600 text-lg">
                Last updated: September 2025
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-10">
            <PrivacyPolicy />
          </div>
        </div>
      </div>
    </div>
  )
}
