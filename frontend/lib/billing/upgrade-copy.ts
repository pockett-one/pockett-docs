import { BRAND_NAME } from '@/config/brand'

/** Product copy: free sandbox vs paid custom firms (single source of truth). */
export const upgradeCopy = {
    sheetTitle: 'Add a custom firm',
    /** Centered upgrade modal title */
    upgradeDialogTitle: 'Add a custom firm',
    upgradeDialogBody: `Your free plan includes a sandbox firm for exploration and demos. Pick a plan below—you will finish on a secure hosted checkout page, then return to your workspace.`,
    planPickerCta: 'Continue to checkout',
    /** Hosted checkout when changing paid plan without customer portal */
    planPickerSwitchPlanCta: 'Switch plan',
    /** Polar customer portal — shared CTA above plan grid for active subscribers */
    billingPortalManageSubscriptionCta: 'Manage Subscription',
    planPickerCurrentPlanBadge: 'Current plan',
    /** https://polar.sh — linked from billing UI */
    polarShUrl: 'https://polar.sh',
    polarLinkLabel: 'Polar',
    polarTooltip: `Polar is a billing and checkout platform. Card payments run on Stripe-backed infrastructure—you never enter card details inside ${BRAND_NAME}.`,
    /** Footnote (Polar link injected between intro and outro in BillingCheckoutFootnote). */
    billingCheckoutIntro: `You’ll pay on a secure, encrypted checkout hosted by our billing partner`,
    billingCheckoutOutro: `. Payments run on Stripe-backed infrastructure—${BRAND_NAME} never collects or stores your full card number. When checkout completes, you’ll return here automatically.`,
    /** Shown under the Compare plans control (portal pair or top-of-picker link). */
    billingFooterHelp: 'Use Compare plans for tiers and limits. For help with charges or invoices, contact support from your profile.',
    planPickerEmpty:
        'No subscription plans are available here right now. Open the full pricing page or try again later.',
    planPickerMissingFirm: 'We couldn’t determine which workspace to bill. Select a firm from the list, then open “How to upgrade” again.',
    sheetBody: `Your free plan includes a sandbox firm for exploration and demos. To add custom firms for day-to-day business and client work, upgrade to a paid plan on ${BRAND_NAME}.`,
    sheetAfterCheckout: 'You will finish checkout in the browser, then return to this workspace.',
    dropdownHeadline: 'Add firm',
    dropdownBody:
        'Sandbox is included on the free plan. Each additional custom firm requires an active subscription.',
    dropdownAction: 'How to upgrade',
    billingTitle: 'Upgrade for custom firms',
    billingEyebrow: 'Billing & plans',
    billingHeadline: 'Grow beyond the sandbox',
    billingBody: `Your sandbox remains available on the free tier. Subscribe to add custom firms for production use. When checkout completes, you’ll return to the workspace you started from.`,
    billingTrustLine1: 'Hosted checkout',
    billingTrustLine1Detail: `Your card is entered only on our billing partner’s secure page—not inside ${BRAND_NAME}.`,
    billingTrustLine2: 'Workspace stays linked',
    billingTrustLine2Detail: 'This upgrade applies to the workspace shown below.',
    billingTrustLine3: 'Clear pricing',
    billingTrustLine3Detail:
        'The price and billing period on each plan match what you will confirm at checkout.',
    billingIncludedLabel: 'Included on free tier',
    billingRecommendedBadge: 'Recommended',
    freeSandboxFootnote: 'No checkout needed—keep exploring in your sandbox.',
    addFirmModalHint: `The free plan includes your sandbox. Subscribe to add custom firms for your business.`,
    ctaContinueBilling: 'Continue to billing',
    ctaComparePlans: 'Compare plans',
    /** Customer portal — intro above Manage subscription button */
    billingPortalSwitchOpensSecurePage:
        'Manage your subscription on a secure billing page—change plans when your provider allows it, update payment details, or cancel.',
    billingPortalManagedByPrefix: 'Managed by our billing partner ',
    billingPortalManagedBySuffix: '.',
    /** Shown under Manage Subscription in the portal CTA pair. */
    billingPortalSyncFootnote:
        'When you return, this page refreshes automatically; updates may take a moment while webhooks sync.',
    billingPortalOpening: 'Opening billing portal…',
    billingPortalSwitchUseSharedCtaHint:
        'Use Manage Subscription above to open the secure billing page and change plans when available.',
    billingPortalAdminOnlyHint:
        'Only a firm admin can manage subscription and billing. Ask an admin for access.',
} as const
