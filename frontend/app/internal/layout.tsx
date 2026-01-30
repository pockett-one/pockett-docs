"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { ShieldAlert, PanelLeft } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { InternalSidebar } from "./internal-sidebar"
import { Outfit } from "next/font/google"
import { SidebarProvider, useSidebar } from "@/lib/sidebar-context"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"

const internalFont = Outfit({ subsets: ["latin"] })

const ALLOWED_ROLE = "SYS_ADMIN"

function InternalLayoutContent({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [isAuthorized, setIsAuthorized] = useState(false)
    const { isCollapsed, toggleSidebar } = useSidebar()

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
                        <LoadingSpinner size="md" className="mb-4" />
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
            <main className={`flex-1 transition-all duration-300 min-h-screen flex flex-col w-full ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
                {/* Header Row - Aligned with Sidebar Header */}
                <div className="h-16 border-b border-gray-200 flex items-center px-4 bg-white sticky top-0 z-30 gap-4">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 h-8 w-8">
                                <PanelLeft className="h-5 w-5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{isCollapsed ? 'Open sidebar' : 'Close sidebar'}</p>
                        </TooltipContent>
                    </Tooltip>

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

export default function InternalLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <SidebarProvider>
            <TooltipProvider>
                <InternalLayoutContent>
                    {children}
                </InternalLayoutContent>
            </TooltipProvider>
        </SidebarProvider>
    )
}
