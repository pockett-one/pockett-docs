/** Copy for Profile → Billing & invoices (and related UI). */
export const profileBillingCopy = {
    pageTitle: 'Profile',
    pageSubtitle: 'Your account and billing preferences.',
    billingSectionTitle: 'Billing & invoices',
    currentPlanHeading: 'Current plan',
    inclusionsHeading: "What's included",
    upgradeTitle: 'Upgrade',
    upgradeBody: 'Choose a paid plan to unlock custom firms. Checkout is completed securely on Polar.',
    upgradeCta: 'Upgrade plan',
    managePaymentsCta: 'Manage payment methods',
    managePaymentsSectionTitle: 'Payment & invoices',
    managePaymentsHint: 'Update cards and billing details in Polar’s customer portal.',
    workspaceLabel: 'Workspace',
    statusLabel: 'Status',
    /** Shown before formatted period end when subscription has a renewal date */
    renewsOnLabel: 'Renews on',
    /** Tooltip on the status icon (replaces visible “Status” label). */
    statusIconTooltip: 'Subscription status for this workspace.',
    /** Tooltip on the renewal clock icon (replaces visible “Renews on” label). */
    renewsIconTooltip:
        'Next billing period boundary — your plan renews or the current period ends on this date.',
    noBillingAnchor: 'No default workspace found. Open a firm from the sidebar first.',
    portalError: 'Could not open billing portal. Try again or contact support.',
    freePlanFallbackName: 'Free plan',
} as const
