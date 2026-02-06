import { prisma } from '@/lib/prisma'

export type PlanTier = 'free' | 'pro' | 'enterprise'
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'none'

export const PLANS: Record<PlanTier, { name: string, features: string[] }> = {
    free: {
        name: 'Free',
        features: ['basic_analytics', '1_project', 'community_support']
    },
    pro: {
        name: 'Pro',
        features: ['advanced_analytics', 'unlimited_projects', 'priority_support', 'audit_logs']
    },
    enterprise: {
        name: 'Enterprise',
        features: ['all_pro_features', 'sso', 'sla', 'dedicated_account_manager']
    }
}

/**
 * Checks if an organization has access to a specific feature based on their plan hierarchy.
 * Note: Real implementation would map specific features to minimum tier requirements.
 */
export async function checkFeatureAccess(organizationId: string, feature: string): Promise<boolean> {
    // Look up the "General" client or the first client
    // In this model, we assume the Plan is on the Primary Client (or any valid client in org)
    // REMOVED planTier check per refactor.

    const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { subscriptionStatus: true }
    })

    if (!org) return false

    const status = org.subscriptionStatus as SubscriptionStatus
    // Defaulting to free for now as Client-level plans are removed.
    const tier: PlanTier = 'free'

    // 1. Check Status
    const validStatuses = ['active', 'trialing']
    if (!validStatuses.includes(status) && status !== 'none') {
        // If paying plan is past_due, maybe block? For now, we only block if strictly invalid.
        if (tier !== 'free' && !validStatuses.includes(status)) {
            return false
        }
    }

    // 2. feature mapping (Simple Tier Check)
    // NOTE: tier is currently hardcoded to 'free', so this check is disabled
    // if (feature === 'PRO_ONLY') {
    //     return tier === 'pro'
    // }

    return true // Default allow
}

/**
 * DEBUG ONLY: Force upgrade an org
 */
export async function debugUpgradeOrg(organizationId: string) {
    if (process.env.NODE_ENV === 'production') return

    // Debug upgrade removed as planTier is gone.
    return
}
