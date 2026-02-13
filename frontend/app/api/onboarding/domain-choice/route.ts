import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { OrganizationService } from '@/lib/organization-service'
import { getDomainOnboardingOptions } from '@/lib/actions/domain-onboarding'

/**
 * GET /api/onboarding/domain-choice
 * Returns whether the current user should be sent to the domain-choice onboarding page.
 * Only true when onboarding is not complete (no default org) and there's a real choice.
 */
export async function GET() {
    const supabase = await createClient()
    const {
        data: { user },
        error
    } = await supabase.auth.getUser()
    if (error || !user?.email) {
        return NextResponse.json({ show: false })
    }
    // If user already has a default org, onboarding is complete — never show domain-choice
    const defaultOrg = await OrganizationService.getDefaultOrganization(user.id)
    if (defaultOrg?.slug) {
        return NextResponse.json({ show: false })
    }
    const options = await getDomainOnboardingOptions(user.id, user.email)
    const show =
        options.orgsToJoin.length > 0 || options.orgsAlreadyIn.length > 1
    return NextResponse.json({ show })
}
