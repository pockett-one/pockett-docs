import { NextRequest, NextResponse } from 'next/server'
import { OrganizationService } from '@/lib/organization-service'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { email, firstName, lastName, organizationName } = body

        // Get user from authorization header
        const authHeader = request.headers.get('authorization')
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Create organization
        const organization = await OrganizationService.createOrganizationWithMember({
            userId: user.id,
            email,
            firstName,
            lastName,
            organizationName
        })

        return NextResponse.json({ organization })
    } catch (error) {
        console.error('Failed to create organization:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create organization' },
            { status: 500 }
        )
    }
}
