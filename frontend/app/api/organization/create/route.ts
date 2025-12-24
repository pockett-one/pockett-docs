import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]

    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check if user already has a default organization
    const existingMembership = await prisma.organizationMember.findFirst({
      where: {
        userId: user.id,
        isDefault: true
      },
      include: {
        organization: true
      }
    })

    if (existingMembership) {
      // User already has an organization
      return NextResponse.json(existingMembership.organization)
    }

    // This route should not be used for new organization creation
    // The signup flow handles that now
    return NextResponse.json(
      { error: 'Please use the signup flow to create an organization' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error creating organization:', error)
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    )
  }
}
