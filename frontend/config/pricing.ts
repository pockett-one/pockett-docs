/** Per-plan value for comparison table: string (e.g. "10", "Unlimited"), true = check, false = dash */
export type PlanValue = string | boolean

export interface PricingComparisonRow {
    feature: string
    tooltip?: string
    /** planId -> value */
    values: Record<string, PlanValue>
}

export interface PricingComparisonCategory {
    name: string
    rows: PricingComparisonRow[]
}

export interface PricingFeature {
    name: string
    tooltip: string
}

export interface PricingPlan {
    id: string
    title: string
    description: string
    price: string
    /** When set, shown as /month when "Annually" is selected (overrides price * 0.84). */
    priceBilledAnnually?: number
    prevPrice?: string
    duration: string
    projectsIncluded?: number // shown in title tile, e.g. 10, 25, 50, 100
    featuresHeader?: string // e.g. "Everything in Free, plus:"
    features: PricingFeature[]
    cta: string | null
    ctaVariant?: 'black' | 'gray'
    href: string | null
    launchingLater?: boolean
    popular?: boolean
    theme: 'blue' | 'purple'
}

export const PRICING_PLANS: PricingPlan[] = [
    {
        id: 'Standard',
        title: 'Standard',
        projectsIncluded: 10,
        description: 'Bring your own Google Drive—non-custodial. Your documents stay where they are; we add the portal. No migration, no new storage. Professional client portal with persona-based access and feedback tracking.',
        price: '$49',
        priceBilledAnnually: 39,
        duration: '/month',
        featuresHeader: 'Standard features:',
        features: [
            { 
                name: "Bring your own Google Drive · Non-custodial", 
                tooltip: "Your files stay in your Drive. We don't store or copy them. Keep using your current document storage—no migration." 
            },
            { 
                name: "Custom branded professional client portal (replaces documents delivered as email attachments or Drive links)", 
                tooltip: "Branded portal instead of generic 'Untitled Folder' links. Works with your existing Google Drive." 
            },            { 
                name: "Org → Client → Project hierarchy", 
                tooltip: "Clean structure clients understand. Uses your existing Drive—no migration." 
            },
            { 
                name: "Unlimited Client Workspaces. Unlimited Team Members. Unlimited External Collaborators.", 
                tooltip: "No per-user fees. Add clients, team members, and external collaborators as needed." 
            },
            { 
                name: "Google Drive–style document operations in Pockett", 
                tooltip: "Familiar open, preview, download, and share actions. No new storage system to learn." 
            },
            { 
                name: "Persona-based access (4 roles)", 
                tooltip: "Project Lead, Team Member, External Collaborator & Guest. Access follows role automatically." 
            },
            { 
                name: "Simple permission management. No granular file-by-file permissions.", 
                tooltip: "No resharing links. Clients always know where to find documents." 
            },
            { 
                name: "Document access tracking", 
                tooltip: "See who viewed what and when. Track feedback tied to each document." 
            },
            { 
                name: "In-document comments & feedback", 
                tooltip: "Comments stay with the document. No more lost feedback in email." 
            },            { 
                name: "One-click project closure", 
                tooltip: "Revoke all client access when a project ends. Lock folders to View Only." 
            }
        ],
        cta: 'Launching Soon',
        ctaVariant: 'black',
        href: '/contact',
        popular: true,
        theme: 'purple'
    },
    {
        id: 'Pro',
        title: 'Pro',
        projectsIncluded: 25,
        description: 'For growing firms needing advanced review and templates.',
        price: '$99',
        priceBilledAnnually: 79,
        duration: '/month',
        featuresHeader: 'Everything in Standard, plus templates & advanced review:',
        features: [
            { name: "Custom Subdomain", tooltip: "Use custom subdomain (e.g., yourcompany.pockett.io) for client portal access" },
            { name: "Watermarked Document Delivery", tooltip: "Add organization branding watermarks to exported PDFs" },
            { name: "Document Templates", tooltip: "Pre-configured document templates for common use cases" },
            { name: "Project Templates", tooltip: "Choose from template projects with pre-defined folder structures" },
            { name: "Duplicate Project", tooltip: "Clone existing projects with all configurations" },
            { name: "Project activity dashboard", tooltip: "See all project activity, deadlines, and pending actions in one view" },
            { name: "Advanced Review & Approval Workflow", tooltip: "Approve/Finalize/Publish workflow with guest approvals" },
            { name: "Document Versioning", tooltip: "Lock documents on approval, create version snapshots" },
            { name: "Download Historical Versions", tooltip: "Access and download previous document versions" },
            { name: "Review status & activity tracking", tooltip: "Comprehensive tracking of review status, comments, approvals, version history" },
            { name: "Activity export (per project)", tooltip: "Export who viewed what and when for a project—for compliance or handoffs" }
        ],
        cta: 'Launching Later',
        ctaVariant: 'gray',
        href: '/contact',
        launchingLater: true,
        theme: 'blue'
    },
    {
        id: 'Business',
        title: 'Business',
        projectsIncluded: 50,
        description: 'For established firms and mid-size agencies.',
        price: '$149',
        priceBilledAnnually: 129,
        duration: '/month',
        featuresHeader: 'Everything in Pro, plus automation:',
        features: [
            { name: "Project Due Date Reminders", tooltip: "Automated reminders for project deadlines" },
            { 
                name: "Self-destruct timers & Never Share tags", 
                tooltip: "Protect sensitive files. Set expiry on shared links. Tag internal files so they never reach clients." 
            },
            { name: "Document Relationships", tooltip: "Link related/dependent documents with relationship tracking" },
            { name: "Relationship Tree View", tooltip: "Visualize document dependencies and connections" },
            { name: "Automated Follow-ups", tooltip: "Automated consolidated client follow-up emails on pending documents" },
            { name: "Custom Follow-up Messages", tooltip: "Customize follow-up templates and scheduling" },
            { name: "Calendar Integration", tooltip: "Calendly integration for document discussion scheduling" },
            { name: "Bi-directional Calendar Requests", tooltip: "Team ↔ Client calendar request flows" },
            { name: "Pre-configured Scheduling", tooltip: "Pre-configured scheduling, reminders, and email notifications" },
            { name: "Weekly Project Status Reports", tooltip: "Weekly project schedule status reports to org owners and project leads" },
            { name: "Folder Badge Indicators", tooltip: "Visual badges for pending actions from external members" },
            { name: "Auto-permit Documents", tooltip: "Automatically deliver documents on onboarding to external members" }
        ],
        cta: 'Launching Later',
        ctaVariant: 'gray',
        href: '/contact',
        launchingLater: true,
        theme: 'purple'
    },
    {
        id: 'Enterprise',
        title: 'Enterprise',
        projectsIncluded: 100,
        description: 'For large organizations requiring advanced security and compliance.',
        price: 'Contact Us',
        duration: '',
        featuresHeader: 'Everything in Business, plus enterprise features:',
        features: [
            { name: "Custom DNS Domain", tooltip: "Use your own domain (e.g., portal.yourcompany.com) with full DNS control and SSL certificate management" },
            { name: "Critical Project Activity Auditing", tooltip: "Comprehensive audit logs for all project activities" },
            { name: "Recover from Recycle Bin", tooltip: "Restore deleted files with alerts on upcoming purges" },
            { name: "Recycle Bin Purge Alerts", tooltip: "Notifications before permanent deletion" },
            { name: "IP Theft Protection", tooltip: "Advanced security features to prevent unauthorized access" },
            { name: "Disallow Download/Print", tooltip: "Restrict document download and printing for client contacts" },
            { name: "Custom Trigger Creation", tooltip: "Create custom automation triggers for scheduling" },
            { name: "Scheduled Project Kickoff", tooltip: "Create projects with delayed kickoff; schedule future team memberships" },
            { name: "Advanced Access Controls", tooltip: "Enhanced persona management and custom persona creation beyond the 4 default personas" },
            { name: "SSO/SAML Integration", tooltip: "Single Sign-On for enterprise authentication" },
            { name: "Advanced Compliance", tooltip: "Enhanced compliance features for regulated industries" },
            { name: "Dedicated Support", tooltip: "Priority support with SLA guarantees" },
            { name: "Custom Onboarding", tooltip: "Tailored onboarding and training" }
        ],
        cta: 'Launching Later',
        ctaVariant: 'gray',
        href: '/contact',
        launchingLater: true,
        theme: 'purple'
    }
]

/** Feature comparison matrix for Slab-style pricing table. Plan IDs must match PRICING_PLANS. */
export const PRICING_COMPARISON: PricingComparisonCategory[] = [
    {
        name: "USAGE",
        rows: [
            { feature: "Active projects", tooltip: "Concurrent non-archived projects. You can have unlimited closed or archived projects without counting toward your limit.", values: { Standard: "10", Pro: "25", Business: "50", Enterprise: "100" } },
            { feature: "Unlimited Team members", tooltip: "Unlimited team members with no per-seat subscription. Add as many internal staff (Project Lead, Team Member) as you need.", values: { Standard: true, Pro: true, Business: true, Enterprise: true } },
            { feature: "Unlimited External collaborators", tooltip: "Unlimited external collaborators with no per-seat subscription. Invite partners, contractors, or clients (External Collaborator, Client Contact) without extra fees.", values: { Standard: true, Pro: true, Business: true, Enterprise: true } },
            { feature: "Version history", tooltip: "How long document version history is retained. View and restore previous versions of documents.", values: { Standard: "90 days", Pro: "365 days", Business: "Unlimited", Enterprise: "Unlimited" } },
        ],
    },
    {
        name: "ESSENTIALS",
        rows: [
            { feature: "Bring your own Google Drive", tooltip: "Your files stay in your Google Drive. We don't store or copy them. Non-custodial: no migration, no new storage; we add the portal on top.", values: { Standard: true, Pro: true, Business: true, Enterprise: true } },
            { feature: "Custom branded client portal", values: { Standard: true, Pro: true, Business: true, Enterprise: true }, tooltip: "Professional client portal with your branding instead of generic Drive links or email attachments. Works with your existing Google Drive." },
            { feature: "Org → Client → Project hierarchy", tooltip: "Clean structure: Organization (your firm) → Client → Project. Maps to folders in your Drive. Clients see a clear place for their project and document handoffs.", values: { Standard: true, Pro: true, Business: true, Enterprise: true } },
            { feature: "Persona-based access (4 roles)", tooltip: "Project Lead, Team Member, External Collaborator, and Client Contact. Access and tabs (e.g. Files for document handoffs) follow role automatically.", values: { Standard: true, Pro: true, Business: true, Enterprise: true } },
            { feature: "Document access tracking", tooltip: "See who viewed what and when. Track feedback and access per document for compliance and handoffs.", values: { Standard: true, Pro: true, Business: true, Enterprise: true } },
            { feature: "In-document comments & feedback", tooltip: "Comments stay with the document. No more lost feedback in email; feedback is tied to each file.", values: { Standard: true, Pro: true, Business: true, Enterprise: true } },
            { feature: "One-click project closure", tooltip: "Revoke all client and external access when a project ends. Lock folders to view-only; remove guest members automatically.", values: { Standard: true, Pro: true, Business: true, Enterprise: true } },
        ],
    },
    {
        name: "ADVANCED",
        rows: [
            { feature: "Custom subdomain", tooltip: "Use a custom subdomain (e.g. yourcompany.pockett.io) for client portal access.", values: { Standard: false, Pro: true, Business: true, Enterprise: true } },
            { feature: "Document & project templates", tooltip: "Pre-configured document and project templates with folder structures. Duplicate projects and choose templates for common use cases.", values: { Standard: false, Pro: true, Business: true, Enterprise: true } },
            { feature: "Advanced review & approval workflow", tooltip: "Approve / Finalize / Publish workflow with guest approvals. Lock documents on approval and create version snapshots.", values: { Standard: false, Pro: true, Business: true, Enterprise: true } },
            { feature: "Document versioning", tooltip: "Lock documents on approval and create version snapshots. Download historical versions.", values: { Standard: false, Pro: true, Business: true, Enterprise: true } },
            { feature: "Self-destruct timers & Never Share tags", tooltip: "Protect sensitive files: set expiry on shared links; tag internal files so they never reach clients.", values: { Standard: false, Pro: false, Business: true, Enterprise: true } },
            { feature: "Automated follow-ups & reminders", tooltip: "Automated consolidated client follow-up emails on pending documents. Custom follow-up templates and scheduling.", values: { Standard: false, Pro: false, Business: true, Enterprise: true } },
            { feature: "Custom DNS domain", tooltip: "Use your own domain (e.g. portal.yourcompany.com) with full DNS control and SSL certificate management.", values: { Standard: false, Pro: false, Business: false, Enterprise: true } },
            { feature: "SSO / SAML", tooltip: "Single Sign-On for enterprise authentication. Integrate with your identity provider.", values: { Standard: false, Pro: false, Business: false, Enterprise: true } },
        ],
    },
]
