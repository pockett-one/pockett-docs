"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Loader2, ShieldAlert } from "lucide-react"
import { InternalSidebar } from "./internal-sidebar"
import { Outfit } from "next/font/google"

const internalFont = Outfit({ subsets: ["latin"] })

const ALLOWED_ROLE = "SYS_ADMIN"

export default function InternalLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [isAuthorized, setIsAuthorized] = useState(false)

    useEffect(() => {
        if (!loading) {
            if (!user) {
                // Not logged in -> Redirect to sign in
                router.push("/signin?redirect=/internal/links")
            } else {
                // Check for SUPER_ADMIN role in app_metadata
                const userRole = user.app_metadata?.role

                if (userRole !== ALLOWED_ROLE) {
                    // Logged in but not authorized -> Redirect to dash
                    router.push("/dash")
                } else {
                    // Authorized
                    setIsAuthorized(true)
                }
            }
        }
    }, [user, loading, router])

    if (loading || !isAuthorized) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
                {loading ? (
                    <div className="flex flex-col items-center">
                        <Loader2 className="h-8 w-8 text-slate-400 animate-spin mb-4" />
                        <p className="text-slate-500 text-sm">Verifying access...</p>
                    </div>
                ) : (
                    null // Redirecting...
                )}
            </div>
        )
    }

    // Double safe check for rendering
    if (!user || user.app_metadata?.role !== ALLOWED_ROLE) {
        return null
    }

    return (
        <div className={`min-h-screen bg-white flex ${internalFont.className}`}>
            {/* Sidebar */}
            <InternalSidebar />

            {/* Main Content Area */}
            <main className="flex-1 ml-64 min-h-screen flex flex-col w-full">
                {/* Header Row - Aligned with Sidebar Header */}
                <div className="h-16 border-b border-gray-200 flex items-center px-8 bg-white sticky top-0 z-30">
                    {/* Future quick access/notifications can go here */}
                    <div className="flex-1" />
                    {/* We can re-add the profile here if we wanted, but it's in sidebar */}
                </div>

                {/* Page Content */}
                <div className="w-full p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
