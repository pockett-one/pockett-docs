import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { resolveDefaultFirmLandingPath } from '@/lib/actions/firms'
import { BillingPageClient } from '@/components/billing/billing-page-client'

export default async function BillingPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (user?.id) {
        const path = await resolveDefaultFirmLandingPath(user.id)
        if (path === '/d/onboarding') {
            redirect('/d/onboarding')
        }
    }
    return (
        <Suspense
            fallback={
                <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
                    Loading billing…
                </div>
            }
        >
            <BillingPageClient />
        </Suspense>
    )
}
