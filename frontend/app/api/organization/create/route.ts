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

    // Check if organization already exists
    const existingOrg = await prisma.organization.findUnique({
      where: { userId: user.id }
    })

    if (existingOrg) {
      return NextResponse.json(existingOrg)
    }

    // Extract first name from user metadata or email
    let firstName = 'User'
    if (user.user_metadata?.full_name) {
      firstName = user.user_metadata.full_name.split(' ')[0]
    } else if (user.user_metadata?.name) {
      firstName = user.user_metadata.name.split(' ')[0]
    } else if (user.email) {
      firstName = user.email.split('@')[0]
    }

    // Create new organization
    const organization = await prisma.organization.create({
      data: {
        userId: user.id,
        email: user.email || '',
        name: `${firstName}'s Organization`,
        displayName: user.user_metadata?.full_name || user.user_metadata?.name || firstName,
        avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture
      }
    })

    console.log('Created organization for new user:', {
      userId: user.id,
      email: user.email,
      organizationName: organization.name
    })

    return NextResponse.json(organization)

  } catch (error) {
    console.error('Error creating organization:', error)
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    )
  }
}
