import { PrivacyPolicy } from "@/components/legal/privacy-policy"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-hidden font-sans selection:bg-purple-500 selection:text-white">

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

      <Header />

      {/* Main Content */}
      <div className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12 w-full relative z-10">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center space-x-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-purple-600 transition-colors p-1 -ml-1 hover:bg-purple-50 rounded-md">
            <Home className="h-4 w-4" />
            <span className="sr-only">Home</span>
          </Link>
          <ChevronRight className="h-4 w-4 text-slate-400" />
          <span className="font-medium text-slate-900">Privacy Policy</span>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-purple-900/5 border border-slate-200 overflow-hidden">
          {/* Page Header */}
          <div className="bg-gradient-to-r from-purple-50/50 to-slate-50/50 px-8 py-12 border-b border-slate-100">
            <div className="text-center">
              <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Privacy Policy</h1>
              <p className="text-slate-500 font-medium">
                Last updated: January 2026
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-12">
            <PrivacyPolicy />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
