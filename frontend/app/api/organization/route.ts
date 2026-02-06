import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { OrganizationService } from '@/lib/organization-service'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Get the current user from the session
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get organization ID / Slug from query params
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    let organization;

    if (slug) {
      // Fetch specific organization by slug
      // We need to resolve the organizationId from the slug + userId access check
      // Ideally OrganizationService has a method for this, or we search manually
      const memberships = await OrganizationService.getUserOrganizations(user.id)
      organization = memberships.find(o => o.slug === slug)
    } else {
      // Get default organization for the user (DO NOT auto-create)
      organization = await OrganizationService.getDefaultOrganization(user.id)
    }

    if (!organization) {
      // Return 200 with null to avoid browser 404 console errors during onboarding checks
      return NextResponse.json({ organization: null })
    }

    return NextResponse.json(organization)
  } catch (error) {
    console.error('Organization API error:', error)
    return NextResponse.json(
      { error: 'Failed to load organization' },
      { status: 500 }
    )
  }
}



