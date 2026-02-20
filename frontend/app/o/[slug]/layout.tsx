"use client"

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { AuthGuard } from '@/components/auth/auth-guard'
import { AppSidebar } from '@/components/app/app-sidebar'
import { AppTopbar } from '@/components/app/app-topbar'
import { LayoutRightPanel, RIGHT_PANEL_DOCKED_WIDTH_PX } from '@/components/app/layout-right-panel'
import { SidebarProvider, useSidebar } from '@/lib/sidebar-context'
import { RightPaneProvider, useRightPane } from '@/lib/right-pane-context'
import { TooltipProvider } from '@/components/ui/tooltip'

const TOP_BAR_HEIGHT = 64
const RIGHT_PANEL_GAP_PX = 16

function AppLayoutContent({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const { isCollapsed } = useSidebar()
    const { content: rightPaneContent, title: rightPaneTitle, clearPane } = useRightPane()

    useEffect(() => {
      clearPane()
    }, [pathname])

    const publicRoutes: string[] = []
    const isPublicRoute = publicRoutes.includes(pathname)

    if (isPublicRoute) {
        return <>{children}</>
    }

    const sidebarWidth = isCollapsed ? 64 : 256

    return (
        <AuthGuard>
            <div className="min-h-screen bg-[#E7E5E4]">
                <div
                    className="fixed top-0 left-0 right-0 z-50 mx-4 mt-4 rounded-2xl border border-slate-200/80 border-b-slate-200 bg-white shadow-sm flex items-center"
                    style={{ height: TOP_BAR_HEIGHT }}
                >
                    <AppTopbar />
                </div>

                <div
                    className="fixed left-0 z-40 mt-4 ml-4 rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-visible transition-all duration-300 flex flex-col"
                    style={{
                        top: TOP_BAR_HEIGHT + 16 + 16,
                        bottom: 16,
                        width: sidebarWidth,
                    }}
                >
                    <AppSidebar variant="inline" />
                </div>

                <div
                    className="flex gap-4 pb-4 min-h-screen"
                    style={{
                        paddingLeft: sidebarWidth + 32,
                        paddingTop: TOP_BAR_HEIGHT + 16 + 16,
                        paddingRight: rightPaneContent ? RIGHT_PANEL_DOCKED_WIDTH_PX + RIGHT_PANEL_GAP_PX + 16 : 16,
                    }}
                >
                    <main className="flex-1 min-w-0 rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-auto z-0">
                        <div className="px-6 pt-4 pb-6 w-full h-full">
                            {children}
                        </div>
                    </main>
                </div>

                {rightPaneContent ? (
                    <LayoutRightPanel
                        title={rightPaneTitle || 'Document'}
                        onClose={clearPane}
                        embedContent={true}
                        dockedPosition={{ top: TOP_BAR_HEIGHT + 16 + 16, bottom: 16, right: 16, widthPx: RIGHT_PANEL_DOCKED_WIDTH_PX }}
                    >
                        {rightPaneContent}
                    </LayoutRightPanel>
                ) : null}
            </div>
        </AuthGuard>
    )
}

export default function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <SidebarProvider>
            <RightPaneProvider>
                <TooltipProvider>
                    <AppLayoutContent>
                        {children}
                    </AppLayoutContent>
                </TooltipProvider>
            </RightPaneProvider>
        </SidebarProvider>
    )
}
