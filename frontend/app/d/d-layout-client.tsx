"use client"

import { usePathname } from 'next/navigation'
import { AuthGuard } from '@/components/auth/auth-guard'
import { AppSidebar } from '@/components/app/app-sidebar'
import { AppTopbar } from '@/components/app/app-topbar'
import { SidebarProvider, useSidebar } from '@/lib/sidebar-context'
import { ViewAsProvider } from '@/lib/view-as-context'
import { RightPaneProvider, useRightPane } from '@/lib/right-pane-context'
import { TooltipProvider } from '@/components/ui/tooltip'

const RIGHT_PANE_WIDTH = 400
const TOP_BAR_HEIGHT = 64

function AppLayoutContent({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const { isCollapsed } = useSidebar()
    const { content: rightPaneContent } = useRightPane()

    const publicRoutes: string[] = []
    const isPublicRoute = publicRoutes.includes(pathname)

    if (isPublicRoute) {
        return <>{children}</>
    }

    const sidebarWidth = isCollapsed ? 64 : 256

    return (
        <AuthGuard>
            {/* Page background: slate-50 (#F7F7F7 under .d-app) */}
            <div className="d-app min-h-screen bg-slate-50">
                {/* Top bar - Branding + Alerts (white card) */}
                <div
                    className="fixed top-0 left-0 right-0 z-50 mx-4 mt-4 rounded-2xl border border-slate-200/80 border-b-slate-200 bg-white shadow-sm flex items-center"
                    style={{ height: TOP_BAR_HEIGHT }}
                >
                    <AppTopbar />
                </div>

                {/* Left app bar - menu (white card), fixed; same width; overflow-visible so expand/collapse button is not clipped */}
                <div
                    className="fixed left-0 z-40 mt-0 ml-4 rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-visible transition-all duration-300 flex flex-col"
                    style={{
                        top: TOP_BAR_HEIGHT + 16 + 16,
                        bottom: 16,
                        width: sidebarWidth,
                    }}
                >
                    <AppSidebar variant="inline" />
                </div>

                {/* Middle pane + Right bar row - same top spacing as left app bar (gap below top bar) */}
                <div
                    className="flex gap-4 pb-4 pr-4 min-h-screen"
                    style={{
                        paddingLeft: sidebarWidth + 16 + 16,
                        paddingTop: TOP_BAR_HEIGHT + 16 + 16,
                    }}
                >
                    {/* Middle pane - main content (white card) */}
                    <main className="flex-1 min-w-0 rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-auto z-0">
                        <div className="px-6 pt-4 pb-6 w-full h-full">
                            {children}
                        </div>
                    </main>

                    {/* Right bar - multi-purpose (e.g. Shares → Chat); white card when content */}
                    {rightPaneContent ? (
                        <aside
                            className="flex-none rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden flex flex-col"
                            style={{ width: RIGHT_PANE_WIDTH }}
                        >
                            <div className="flex-1 overflow-auto min-h-0">
                                {rightPaneContent}
                            </div>
                        </aside>
                    ) : null}
                </div>
            </div>
        </AuthGuard>
    )
}

export function DLayoutClient({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <ViewAsProvider>
                <RightPaneProvider>
                    <TooltipProvider delayDuration={400}>
                        <AppLayoutContent>
                            {children}
                        </AppLayoutContent>
                    </TooltipProvider>
                </RightPaneProvider>
            </ViewAsProvider>
        </SidebarProvider>
    )
}
