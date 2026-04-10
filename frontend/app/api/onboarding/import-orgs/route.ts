import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { createClient } from '@supabase/supabase-js'

/** Import-orgs removed from onboarding; endpoint kept to return a clear error for old clients. */
export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'dummy'
        )
        const {
            data: { user },
        } = await supabase.auth.getUser(token)
        if (!user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        logger.info('import-orgs disabled: import step removed from onboarding', { userId: user.id })
        return NextResponse.json(
            { error: 'Organization import is no longer available during onboarding.' },
            { status: 410 }
        )
    } catch (error) {
        logger.error('Error in import-orgs stub', error as Error)
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
    }
}
