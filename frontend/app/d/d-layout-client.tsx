"use client"

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { AuthGuard } from '@/components/auth/auth-guard'
import { AppSidebar } from '@/components/app/app-sidebar'
import { AppTopbar } from '@/components/app/app-topbar'
import { LayoutRightPanel, RIGHT_PANEL_DOCKED_WIDTH_PX } from '@/components/app/layout-right-panel'
import { SidebarProvider, useSidebar } from '@/lib/sidebar-context'
import { ViewAsProvider } from '@/lib/view-as-context'
import { RightPaneProvider, useRightPane } from '@/lib/right-pane-context'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SidebarOrganizationsProvider } from '@/lib/sidebar-organizations-context'
import { OnboardingProvider, useOnboarding } from '@/lib/onboarding-context'
import { OnboardingSidebar } from '@/components/onboarding/onboarding-sidebar'

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
    const { isOnboarding } = useOnboarding()

    // Reset right pane on navigation or reload so state is not persisted
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
                    {isOnboarding ? (
                        <OnboardingSidebar />
                    ) : (
                        <AppSidebar variant="inline" />
                    )}
                </div>

                {/* Middle pane + Right bar row - same top spacing as left app bar (gap below top bar). When right pane open, reserve space via margin so fixed panel doesn't overlap. */}
                <div
                    className="flex gap-4 pb-4 min-h-screen"
                    style={{
                        paddingLeft: sidebarWidth + 16 + 16,
                        paddingTop: TOP_BAR_HEIGHT + 16 + 16,
                        paddingRight: rightPaneContent ? RIGHT_PANEL_DOCKED_WIDTH_PX + RIGHT_PANEL_GAP_PX + 16 : 16,
                    }}
                >
                    {/* Middle pane - main content (white card) */}
                    <main className="flex-1 min-w-0 rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-auto z-0">
                        <div className="px-6 pt-4 pb-6 w-full h-full">
                            {children}
                        </div>
                    </main>
                </div>

                {/* Right panel - fixed position so width cannot be shrunk by flex; always 320px visible */}
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

export function DLayoutClient({
    children,
    initialOrganizations,
}: {
    children: React.ReactNode
    initialOrganizations: { id: string; name: string; slug: string; isDefault: boolean; createdAt: string }[]
}) {
    return (
        <OnboardingProvider>
            <SidebarOrganizationsProvider organizations={initialOrganizations}>
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
            </SidebarOrganizationsProvider>
        </OnboardingProvider>
    )
}
