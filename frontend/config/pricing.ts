
export interface PricingFeature {
    name: string
    tooltip: string
}

export interface PricingPlan {
    id: string
    title: string
    description: string
    price: string
    prevPrice?: string
    duration: string
    featuresHeader?: string // e.g. "Everything in Free, plus:"
    features: PricingFeature[]
    cta: string
    href: string
    popular?: boolean
    theme: 'blue' | 'purple'
}

export const PRICING_PLANS: PricingPlan[] = [
    {
        id: 'free',
        title: 'Starter',
        description: 'For individuals.',
        price: '$0',
        duration: '/month',
        featuresHeader: 'Free, forever:',
        features: [
            { name: "Connect Google Drive", tooltip: "OAuth connection to fetch file/folder tree" },
            { name: "Browse & Metadata Sync", tooltip: "Fetch and sync file/folder metadata" },
            { name: "Analytics Dashboard", tooltip: "Visual dashboard with usage insights" },
            { name: "Most accessed files (7 days)", tooltip: "Track files accessed in last 7 days" },
            { name: "Largest unused files (90+ days)", tooltip: "Find large files not accessed in 90+ days" },
            { name: "Risky shares detection", tooltip: "Detect 'Anyone with link = Editor' shares" },
            { name: "Insights Cards (Read-Only)", tooltip: "Show risks & inefficiencies (read-only)" }
        ],
        cta: 'Get Started',
        href: '/dash/auth',
        theme: 'blue'
    },
    {
        id: 'startup',
        title: 'Pro',
        description: 'For professionals.',
        price: '$9',
        prevPrice: '$19',
        duration: '/month',
        featuresHeader: 'Everything in Free, plus:',
        features: [
            { name: "Watchlist", tooltip: "Pin important docs for quick access" },
            { name: "Due Dates & Reminders", tooltip: "Set due dates & reminders for key docs" },
            { name: "Detect duplicates & near-duplicates", tooltip: "Find and identify duplicate files" },
            { name: "90-Day Activity History", tooltip: "Look back further to track quarterly progress" },
            { name: "Custom Smart Tags", tooltip: "Organize files with a unified tagging system" },
            { name: "Bulk Archive/Delete", tooltip: "Action on large files in bulk" },
            { name: "Exportable Storage Reports", tooltip: "Download CSV/PDF reports for client audits" }
        ],
        cta: 'Start Trial',
        href: '/auth/signup',
        popular: true,
        theme: 'purple'
    },
    {
        id: 'team',
        title: 'Team',
        description: 'For teams.',
        price: '$29',
        prevPrice: '$49',
        duration: '/month',
        featuresHeader: 'Everything in Pro Plan, plus:',
        features: [
            { name: "Project Team Spaces", tooltip: "Group docs/folders into project workrooms" },
            { name: "Shared Watchlists", tooltip: "Team-pinned docs for collaboration" },
            { name: "Assignment Board (Workload View)", tooltip: "Columns = collaborators, Rows = documents" },
            { name: "Drag-and-drop assignment", tooltip: "Drag docs to assign to team members" },
            { name: "Access Lifecycle Management", tooltip: "Auto-expire/revoke external access after project completion" },
            { name: "Team Engagement Digest", tooltip: "Weekly summary of doc access across projects" },
            { name: "Client Portal Links", tooltip: "Branded, expiring, read-only links for clients" }
        ],
        cta: 'Contact Us',
        href: '/contact',
        theme: 'blue'
    }
]
