import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')
        const supabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_PROXY_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'dummy'
        )
        const { data: { user } } = await supabase.auth.getUser(token)
        if (!user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { organizationId, clientId, name } = body

        if (!organizationId || !clientId || !name?.trim()) {
            return NextResponse.json({ error: 'Missing organizationId, clientId, or name' }, { status: 400 })
        }

        // Verify the user is a member of this organization
        const membership = await prisma.organizationMember.findFirst({
            where: { userId: user.id, organizationId }
        })
        if (!membership) {
            return NextResponse.json({ error: 'Organization not found or access denied' }, { status: 403 })
        }

        // Verify the client belongs to this organization
        const clientRecord = await prisma.client.findFirst({
            where: { id: clientId, organizationId }
        })
        if (!clientRecord) {
            return NextResponse.json({ error: 'Client not found or access denied' }, { status: 403 })
        }

        const slug =
            name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') +
            '-' + Math.random().toString(36).substring(2, 6)

        const project = await prisma.project.create({
            data: { name: name.trim(), slug, clientId, organizationId }
        })

        logger.info('Project created during onboarding', { projectId: project.id, clientId, organizationId })

        return NextResponse.json({
            success: true,
            projectId: project.id,
            projectSlug: project.slug,
            projectName: project.name
        })
    } catch (error) {
        logger.error('Error creating project during onboarding', error as Error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create project' },
            { status: 500 }
        )
    }
}
