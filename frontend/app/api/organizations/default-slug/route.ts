import { NextResponse } from 'next/server'
import { getDefaultOrganizationWithOnboardingStatus } from '@/lib/actions/organizations'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const { slug, onboardingComplete } = await getDefaultOrganizationWithOnboardingStatus()
        return NextResponse.json({ slug, onboardingComplete })
    } catch (error) {
        return NextResponse.json({ slug: null, onboardingComplete: false }, { status: 200 })
    }
}
