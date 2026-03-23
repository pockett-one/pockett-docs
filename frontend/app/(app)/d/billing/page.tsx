import { Suspense } from 'react'
import { BillingPageClient } from '@/components/billing/billing-page-client'

export default function BillingPage() {
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
