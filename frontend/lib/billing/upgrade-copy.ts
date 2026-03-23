import { BRAND_NAME } from '@/config/brand'

/** Product copy: free sandbox vs paid custom firms (single source of truth). */
export const upgradeCopy = {
    sheetTitle: 'Add a custom firm',
    /** Centered upgrade modal title */
    upgradeDialogTitle: 'Add a custom firm',
    upgradeDialogBody: `Your free plan includes a sandbox firm for exploration and demos. Pick a plan below—you’ll finish on a secure hosted checkout page, then return to your workspace.`,
    planPickerCta: 'Continue to checkout',
    planPickerCurrentPlanBadge: 'Current plan',
    /** https://polar.sh — linked from billing UI */
    polarShUrl: 'https://polar.sh',
    polarLinkLabel: 'Polar',
    polarTooltip: `Polar is a billing and checkout platform. Card payments run on Stripe-backed infrastructure—you never enter card details inside ${BRAND_NAME}.`,
    billingCheckoutIntro: 'Plans and prices follow your catalog. Payment completes on a secure page operated by',
    billingCheckoutOutro: `. You’ll return here when checkout finishes.`,
    billingFooterHelp: 'Use Compare plans for tiers and limits. For help with charges or invoices, contact support from your profile.',
    planPickerEmpty: 'No public plans are available from billing right now. Open the full pricing page or try again later.',
    planPickerMissingFirm: 'We couldn’t determine which workspace to bill. Select a firm from the list, then open “How to upgrade” again.',
    sheetBody: `Your free plan includes a sandbox firm for exploration and demos. To add custom firms for day-to-day business and client work, upgrade to a paid plan on ${BRAND_NAME}.`,
    sheetAfterCheckout: 'You’ll finish checkout in the browser, then return to this workspace.',
    dropdownHeadline: 'Add firm',
    dropdownBody:
        'Sandbox is included on the free plan. Each additional custom firm requires an active subscription.',
    dropdownAction: 'How to upgrade',
    billingTitle: 'Upgrade for custom firms',
    billingEyebrow: 'Billing & plans',
    billingHeadline: 'Grow beyond the sandbox',
    billingBody: `Your sandbox remains available on the free tier. Subscribe to add custom firms for production use. When checkout completes, you’ll return to the workspace you started from.`,
    /** Shown under paid catalog plans to reinforce value (keep factual; amounts come from your catalog). */
    paidPlanHighlights: [
        'Custom firms for production work and real clients',
        'Your sandbox stays free for demos and exploration',
        'Finish on secure hosted checkout, then return here automatically',
    ] as const,
    billingTrustLine1: 'Hosted checkout',
    billingTrustLine1Detail: `Your card is entered only on our billing partner’s secure page—not inside ${BRAND_NAME}.`,
    billingTrustLine2: 'Workspace stays linked',
    billingTrustLine2Detail: 'This upgrade applies to the workspace shown below.',
    billingTrustLine3: 'Clear pricing',
    billingTrustLine3Detail: 'Rates and renewal terms come straight from your catalog.',
    billingIncludedLabel: 'Included on free tier',
    billingRecommendedBadge: 'Recommended',
    freeSandboxFootnote: 'No checkout needed—keep exploring in your sandbox.',
    addFirmModalHint: `The free plan includes your sandbox. Subscribe to add custom firms for your business.`,
    ctaContinueBilling: 'Continue to billing',
    ctaComparePlans: 'Compare plans',
} as const
