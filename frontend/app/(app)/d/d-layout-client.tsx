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
import { SidebarFirmsProvider } from '@/lib/sidebar-firms-context'
import { OnboardingProvider } from '@/lib/onboarding-context'
import { OnboardingSidebar } from '@/components/onboarding/onboarding-sidebar'
import { DebugFloatingTrigger } from '@/components/debug/debug-floating-trigger'
import { StandardCheckoutIntentBanner } from '@/components/billing/standard-checkout-intent-banner'

const TOP_BAR_HEIGHT = 64
const APP_BAR_GAP_PX = 10
const RIGHT_PANEL_GAP_PX = 6

function AppLayoutContent({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const { isCollapsed } = useSidebar()
    const { content: rightPaneContent, title: rightPaneTitle, clearPane, headerActions: rightPaneHeaderActions, headerIcon, headerSubtitle } = useRightPane()
    // Slim onboarding rail for the whole flow; full AppSidebar only after navigation away (e.g. to /d/f/...).
    const showOnboardingSidebar =
        pathname === '/d/onboarding' || (pathname?.startsWith('/d/onboarding/') ?? false)

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
                    className="fixed top-0 left-0 right-0 z-50 mx-3 mt-3 rounded-xl border border-slate-200/80 border-b-slate-200 bg-white shadow-sm flex items-center"
                    style={{ height: TOP_BAR_HEIGHT }}
                >
                    <AppTopbar />
                </div>

                {/* Left app bar - menu (white card), fixed; same width; overflow-visible so expand/collapse button is not clipped */}
                <div
                    className="fixed left-0 z-40 mt-0 ml-3 rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-visible transition-all duration-300 flex flex-col"
                    style={{
                        top: TOP_BAR_HEIGHT + APP_BAR_GAP_PX + APP_BAR_GAP_PX,
                        bottom: APP_BAR_GAP_PX,
                        width: sidebarWidth,
                    }}
                >
                    {showOnboardingSidebar ? (
                        <OnboardingSidebar />
                    ) : (
                        <AppSidebar variant="inline" />
                    )}
                </div>

                {/* Middle pane + Right bar row - same top spacing as left app bar (gap below top bar). When right pane open, reserve space via margin so fixed panel doesn't overlap. */}
                <div
                    className="flex gap-3 pb-3 min-h-screen"
                    style={{
                        paddingLeft: sidebarWidth + APP_BAR_GAP_PX + APP_BAR_GAP_PX,
                        paddingTop: TOP_BAR_HEIGHT + APP_BAR_GAP_PX + APP_BAR_GAP_PX,
                        paddingRight: rightPaneContent ? RIGHT_PANEL_DOCKED_WIDTH_PX + RIGHT_PANEL_GAP_PX + APP_BAR_GAP_PX : APP_BAR_GAP_PX,
                    }}
                >
                    {/* Middle pane - main content (white card) */}
                    <main className="flex-1 min-w-0 rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-auto z-0">
                        <div className="h-full w-full px-7 pt-3 pb-4 sm:px-10 md:px-12">
                            {children}
                        </div>
                    </main>
                </div>

                {/* Right panel - fixed position so width cannot be shrunk by flex; always 320px visible */}
                {rightPaneContent ? (
                    <LayoutRightPanel
                        title={rightPaneTitle || 'Document'}
                        icon={headerIcon}
                        subtitle={headerSubtitle || undefined}
                        onClose={clearPane}
                        headerActions={rightPaneHeaderActions}
                        embedContent={true}
                        dockedPosition={{ top: TOP_BAR_HEIGHT + APP_BAR_GAP_PX + APP_BAR_GAP_PX, bottom: APP_BAR_GAP_PX, right: APP_BAR_GAP_PX, widthPx: RIGHT_PANEL_DOCKED_WIDTH_PX }}
                    >
                        {rightPaneContent}
                    </LayoutRightPanel>
                ) : null}
                <StandardCheckoutIntentBanner />
                <DebugFloatingTrigger />
            </div>
        </AuthGuard>
    )
}

export function DLayoutClient({
    children,
    initialFirms,
}: {
    children: React.ReactNode
    initialFirms: { id: string; name: string; slug: string; isDefault: boolean; createdAt: string }[]
}) {
    return (
        <OnboardingProvider>
            <SidebarFirmsProvider firms={initialFirms}>
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
            </SidebarFirmsProvider>
        </OnboardingProvider>
    )
}
