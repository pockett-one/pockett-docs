"use client"

import { usePathname } from 'next/navigation'
import { AuthGuard } from '@/components/auth/auth-guard'
import { AppSidebar } from '@/components/app/app-sidebar'
import { AppTopbar } from '@/components/app/app-topbar'
import { SidebarProvider, useSidebar } from '@/lib/sidebar-context'
import { ViewAsProvider } from '@/lib/view-as-context'
import { TooltipProvider } from '@/components/ui/tooltip'

function AppLayoutContent({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const { isCollapsed } = useSidebar()

    const publicRoutes: string[] = []
    const isPublicRoute = publicRoutes.includes(pathname)

    if (isPublicRoute) {
        return <>{children}</>
    }

    return (
        <AuthGuard>
            <div className="min-h-screen bg-white">
                <AppTopbar />
                <div className="flex pt-16">
                    <AppSidebar />
                    <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
                        <div className="px-6 pt-3 pb-6 w-full">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </AuthGuard>
    )
}

export function DLayoutClient({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <ViewAsProvider>
                <TooltipProvider>
                    <AppLayoutContent>
                        {children}
                    </AppLayoutContent>
                </TooltipProvider>
            </ViewAsProvider>
        </SidebarProvider>
    )
}
