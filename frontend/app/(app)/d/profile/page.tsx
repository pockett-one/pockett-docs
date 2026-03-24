import { createClient } from '@/utils/supabase/server'
import { getBillingProfileForUser } from '@/lib/billing/billing-profile'
import { profileBillingCopy } from '@/lib/billing/profile-billing-copy'
import { ProfilePageClient } from './profile-page-client'
import type { ProfileBillingSerializable } from './profile-billing-section'

export default async function ProfilePage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user?.email) {
        return (
            <div className="mx-auto max-w-lg py-12 text-center text-sm text-slate-600">
                Sign in to view your profile.
            </div>
        )
    }

    const meta = user.user_metadata as Record<string, unknown> | undefined
    const displayName =
        (typeof meta?.full_name === 'string' && meta.full_name.trim()) ||
        (typeof meta?.name === 'string' && meta.name.trim()) ||
        user.email.split('@')[0]
    const avatarUrl =
        (typeof meta?.avatar_url === 'string' && meta.avatar_url) ||
        (typeof meta?.picture === 'string' && meta.picture) ||
        null

    const profile = await getBillingProfileForUser(user.id)

    let billingSerializable: ProfileBillingSerializable | null = null
    if (profile) {
        const anchor = profile.billingAnchor
        const planName =
            anchor.subscriptionPlan?.trim() ||
            (anchor.sandboxOnly ? profileBillingCopy.freePlanFallbackName : 'Current plan')
        billingSerializable = {
            workspaceFirmId: profile.workspaceFirm.id,
            workspaceName: profile.workspaceFirm.name,
            workspaceSlug: profile.workspaceFirm.slug,
            planName,
            subscriptionStatus: anchor.subscriptionStatus ?? 'none',
            pricingModel:
                anchor.pricingModel === 'recurring_subscription' ||
                anchor.pricingModel === 'one_time_purchase'
                    ? anchor.pricingModel
                    : null,
            periodEndIso: anchor.subscriptionCurrentPeriodEnd?.toISOString() ?? null,
            sandboxOnly: anchor.sandboxOnly,
            polarCustomerId: anchor.polarCustomerId,
            polarSubscriptionId: anchor.polarSubscriptionId,
            isFirmBillingAdmin: profile.viewerIsFirmBillingAdmin,
        }
    }

    return (
        <ProfilePageClient
            displayName={displayName}
            email={user.email}
            avatarUrl={avatarUrl}
            billing={billingSerializable}
        />
    )
}
