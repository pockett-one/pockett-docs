import { getUserOrganizations } from '@/lib/actions/organizations'
import { redirect } from 'next/navigation'
import { DLayoutClient } from './d-layout-client'

/**
 * Server layout: redirect to /onboarding before any /d content loads when user has no orgs.
 * This avoids the client layout and page loading and then redirecting.
 */
export default async function DLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const organizations = await getUserOrganizations()
    if (organizations.length === 0) {
        redirect('/onboarding')
    }
    return <DLayoutClient>{children}</DLayoutClient>
}
