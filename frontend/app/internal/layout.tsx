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

/** Fallback: app_metadata.role when DB check hasn't run yet. Source of truth: org_admin of System Management org. */
const JWT_ADMIN_ROLE = "SYS_ADMIN"

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
                router.push("/signin?redirect=/internal/links")
            } else {
                // Source of truth: org_admin of System Management org. Fast path: app_metadata.role if set.
                const jwtRole = user.app_metadata?.role
                if (jwtRole === JWT_ADMIN_ROLE) {
                    setIsAuthorized(true)
                    return
                }
                fetch("/api/permissions/is-system-admin")
                    .then((r) => r.ok ? r.json() : { isSystemAdmin: false })
                    .then((data) => {
                        if (data.isSystemAdmin) {
                            setIsAuthorized(true)
                        } else {
                            router.push("/d")
                        }
                    })
                    .catch(() => router.push("/d"))
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

    // Double safe check for rendering (isAuthorized already validated via API or JWT)
    if (!user || !isAuthorized) {
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
