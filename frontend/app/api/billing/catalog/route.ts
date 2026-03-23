import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { fetchBillingCatalogPlans } from '@/lib/billing/polar-catalog'

export async function GET() {
    const supabase = await createClient()
    const {
        data: { session },
    } = await supabase.auth.getSession()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const items = await fetchBillingCatalogPlans()
        return NextResponse.json({ items })
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Catalog fetch failed'
        const isConfig = message.includes('POLAR_ACCESS_TOKEN')
        return NextResponse.json(
            { error: message, items: [] as const },
            { status: isConfig ? 503 : 502 }
        )
    }
}
