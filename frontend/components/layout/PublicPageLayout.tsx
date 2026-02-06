"use client"

import { Header } from "./Header"
import { Footer } from "./Footer"
import { ReactNode } from "react"

interface PublicPageLayoutProps {
    children: ReactNode
    showFooter?: boolean
    className?: string
}

/**
 * PublicPageLayout - Standard layout for public-facing pages
 * 
 * Includes:
 * - Fixed Header with proper mobile spacing
 * - Proper top padding to account for fixed header (pt-32 mobile, pt-36 desktop)
 * - Optional Footer
 * 
 * Usage:
 * ```tsx
 * <PublicPageLayout>
 *   <YourPageContent />
 * </PublicPageLayout>
 * ```
 */
export function PublicPageLayout({ 
    children, 
    showFooter = true,
    className = ""
}: PublicPageLayoutProps) {
    return (
        <div className={`min-h-screen bg-white text-slate-900 font-sans selection:bg-purple-500 selection:text-white overflow-hidden ${className}`}>
            {/* Background Ambience - Matching Landing Page */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                {/* Dot Grid */}
                <div 
                    className="absolute inset-0 opacity-[0.4]"
                    style={{ 
                        backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', 
                        backgroundSize: '32px 32px' 
                    }}
                />
                {/* Subtle Purple Haze */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-100/40 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-slate-100/50 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />
            </div>

            <Header />
            
            <div className="relative z-10 pt-32 pb-20 lg:pt-36 lg:pb-28">
                {children}
            </div>

            {showFooter && <Footer />}
        </div>
    )
}
