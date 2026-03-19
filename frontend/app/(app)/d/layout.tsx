import { getUserFirms } from '@/lib/actions/firms'
import { DLayoutClient } from './d-layout-client'

/**
 * Server layout: Does NOT redirect - let child pages handle routing.
 * This prevents redirect() loops that trigger continuous RSC refreshes.
 * Individual pages (/d/page.tsx, /d/onboarding/page.tsx) handle their own routing logic.
 */
export default async function DLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const firms = await getUserFirms()

    return <DLayoutClient initialFirms={firms}>{children}</DLayoutClient>
}
