import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'

interface DomainOrgOption {
    id: string
    name: string
    slug: string
}

interface DomainOnboardingOptions {
    orgsToJoin: DomainOrgOption[]
    orgsAlreadyIn: DomainOrgOption[]
}

function emailDomain(email: string): string | null {
    const part = email.split('@')[1]
    return part ? part.toLowerCase().trim() : null
}

async function getDomainOnboardingOptions(
    userId: string,
    userEmail: string
): Promise<DomainOnboardingOptions> {
    const domain = emailDomain(userEmail)
    if (!domain) return { orgsToJoin: [], orgsAlreadyIn: [] }

    const orgs = await prisma.organization.findMany({
        where: {
            allowDomainAccess: true,
            allowedEmailDomain: domain
        },
        select: { id: true, name: true, slug: true }
    })

    if (orgs.length === 0) return { orgsToJoin: [], orgsAlreadyIn: [] }

    const memberships = await (prisma as any).orgMember.findMany({
        where: {
            userId,
            organizationId: { in: orgs.map((o) => o.id) }
        },
        select: { organizationId: true }
    })
    const inSet = new Set(memberships.map((m: any) => m.organizationId))

    const orgsAlreadyIn: DomainOrgOption[] = []
    const orgsToJoin: DomainOrgOption[] = []
    for (const org of orgs) {
        const option = { id: org.id, name: org.name, slug: org.slug }
        if (inSet.has(org.id)) orgsAlreadyIn.push(option)
        else orgsToJoin.push(option)
    }

    return { orgsToJoin, orgsAlreadyIn }
}

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_PROXY_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'dummy'
        )
        const { data: { user } } = await supabase.auth.getUser(token)

        if (!user?.id || !user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const options = await getDomainOnboardingOptions(user.id, user.email)
        return NextResponse.json(options)
    } catch (error) {
        console.error('Error fetching domain options:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch domain options' },
            { status: 500 }
        )
    }
}
