import { Polar } from '@polar-sh/sdk'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { pricingModelFromRecurringFlag } from '@/lib/billing/pricing-model'
import { getDefaultCapsForPlanColumn } from '@/lib/billing/plan-default-caps'

function polarServer(): 'production' | 'sandbox' {
    return process.env.POLAR_SERVER === 'production' ? 'production' : 'sandbox'
}

function allowOnboardingWithoutPolarBilling(): boolean {
    return process.env.POLAR_ALLOW_ONBOARDING_WITHOUT_BILLING === 'true'
}

/** Unique billing email per firm (Polar requires unique email per org). */
export function billingEmailForFirm(userEmail: string, firmId: string): string {
    const trimmed = userEmail.trim().toLowerCase()
    const at = trimmed.indexOf('@')
    if (at <= 0) return trimmed || `billing+${firmId.slice(0, 8)}@invalid.local`
    const local = trimmed.slice(0, at)
    const domain = trimmed.slice(at + 1)
    const tag = firmId.replace(/-/g, '').slice(0, 12)
    if (local.includes('+')) {
        return `${local}.firm${tag}@${domain}`
    }
    return `${local}+firm${tag}@${domain}`
}

async function persistFirmWithLifetimeFreePlan(firmId: string, customerId: string) {
    const displayName = process.env.POLAR_FREE_PLAN_DISPLAY_NAME?.trim() || 'Free plan'
    const sandboxCaps = getDefaultCapsForPlanColumn('sandbox')
    await prisma.firm.update({
        where: { id: firmId },
        data: {
            polarCustomerId: customerId,
            polarSubscriptionId: null,
            polarOrderId: null,
            subscriptionStatus: 'active',
            subscriptionProvider: 'polar',
            subscriptionPlan: displayName,
            pricingModel: pricingModelFromRecurringFlag(false),
            subscriptionCurrentPeriodEnd: null,
            billingActiveEngagementCap: sandboxCaps.activeEngagementCap,
            billingGroupFirmCap: sandboxCaps.firmGroupCap,
            billingCapsLocked: false,
        },
    })
}

async function assertFirmBillingLinked(firmId: string): Promise<void> {
    const firm = await prisma.firm.findUnique({
        where: { id: firmId },
        select: {
            polarCustomerId: true,
            polarSubscriptionId: true,
            polarOrderId: true,
            subscriptionStatus: true,
            subscriptionPlan: true,
            pricingModel: true,
        },
    })
    logger.info('[polar-free-plan] Post-provision firm billing snapshot', {
        firmId,
        hasPolarCustomerId: Boolean(firm?.polarCustomerId),
        hasPolarSubscriptionId: Boolean(firm?.polarSubscriptionId),
        hasPolarOrderId: Boolean(firm?.polarOrderId),
        subscriptionStatus: firm?.subscriptionStatus ?? null,
        subscriptionPlan: firm?.subscriptionPlan ?? null,
        pricingModel: firm?.pricingModel ?? null,
    })
    if (!firm?.polarCustomerId) {
        throw new Error('Firm billing link verification failed: missing polarCustomerId after Polar setup.')
    }
    const st = (firm.subscriptionStatus ?? '').toLowerCase()
    if (!st || st === 'none') {
        throw new Error('Firm billing link verification failed: subscriptionStatus is missing or none after Polar setup.')
    }
    if (!firm.subscriptionPlan?.trim()) {
        throw new Error('Firm billing link verification failed: subscriptionPlan not set after Polar setup.')
    }
    if (firm.pricingModel !== pricingModelFromRecurringFlag(false)) {
        throw new Error('Firm billing link verification failed: pricingModel must be one_time_purchase for free tier.')
    }
}

/**
 * Ensures the sandbox (anchor) firm has a Polar customer + free-product subscription.
 * Required for onboarding unless POLAR_ALLOW_ONBOARDING_WITHOUT_BILLING=true.
 * On failure, throws so sandbox onboarding does not succeed.
 */
export async function ensurePolarFreePlanForSandboxFirm(params: {
    firmId: string
    userEmail: string
    customerName?: string | null
}): Promise<void> {
    if (allowOnboardingWithoutPolarBilling()) {
        logger.warn(
            '[polar-free-plan] POLAR_ALLOW_ONBOARDING_WITHOUT_BILLING=true — skipping Polar free plan (dev/CI only). Firm row will not be billing-linked.'
        )
        return
    }

    const token = process.env.POLAR_ACCESS_TOKEN?.trim()
    if (!token) {
        const msg =
            'Polar free plan is required to finish sandbox onboarding. Set POLAR_ACCESS_TOKEN, ' +
            'or set POLAR_ALLOW_ONBOARDING_WITHOUT_BILLING=true only for local/CI without billing.'
        logger.error(
            '[polar-free-plan] Missing Polar configuration for onboarding.',
            undefined,
            undefined,
            {
                hasToken: Boolean(token),
            }
        )
        throw new Error(msg)
    }
    const server = polarServer()

    logger.info('[polar-free-plan] Starting free-plan provisioning', {
        firmId: params.firmId,
        polarServer: server,
        userEmailDomain: params.userEmail.includes('@') ? params.userEmail.split('@')[1] : 'unknown',
    })

    const polar = new Polar({
        accessToken: token,
        server,
    })

    type PolarCustomerState = Awaited<ReturnType<Polar['customers']['getStateExternal']>>
    let state: PolarCustomerState | null = null
    try {
        state = await polar.customers.getStateExternal({ externalId: params.firmId })
        logger.info('[polar-free-plan] getStateExternal ok', {
            firmId: params.firmId,
            polarCustomerId: state.id,
            activeSubscriptions: state.activeSubscriptions.length,
        })
    } catch (e) {
        logger.info('[polar-free-plan] getStateExternal failed (customer likely new)', {
            firmId: params.firmId,
            message: e instanceof Error ? e.message : String(e),
        })
        state = null
    }

    if (state) {
        await persistFirmWithLifetimeFreePlan(params.firmId, state.id)
        logger.info('[polar-free-plan] Linked existing Polar customer to lifetime free plan', { firmId: params.firmId })
        await assertFirmBillingLinked(params.firmId)
        return
    }

    const email = billingEmailForFirm(params.userEmail, params.firmId)
    const displayName = params.customerName?.trim() || undefined

    logger.info('[polar-free-plan] Creating Polar customer', {
        firmId: params.firmId,
        billingEmailLocal: email.split('@')[0]?.slice(0, 20),
    })

    try {
        const created = await polar.customers.create({
            email,
            name: displayName,
            externalId: params.firmId,
            metadata: { firmId: params.firmId },
        })
        logger.info('[polar-free-plan] customers.create ok', {
            firmId: params.firmId,
            polarCustomerId: created.id,
        })
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        if (!/already exists|unique|duplicate/i.test(msg)) {
            logger.error(
                '[polar-free-plan] customers.create failed',
                e instanceof Error ? e : new Error(msg),
                undefined,
                { firmId: params.firmId, msg }
            )
            throw e
        }
        logger.warn('[polar-free-plan] customers.create duplicate/race; continuing', { firmId: params.firmId, msg })
    }

    const refreshed = await polar.customers.getStateExternal({ externalId: params.firmId })
    await persistFirmWithLifetimeFreePlan(params.firmId, refreshed.id)
    await assertFirmBillingLinked(params.firmId)
    logger.info('[polar-free-plan] Lifetime free plan provisioning complete', { firmId: params.firmId })
}
