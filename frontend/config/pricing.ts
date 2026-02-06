
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
    cta: string | null
    href: string | null
    launchingLater?: boolean
    popular?: boolean
    theme: 'blue' | 'purple'
}

export const PRICING_PLANS: PricingPlan[] = [
    {
        id: 'Standard',
        title: 'Standard',
        description: 'Professional client portal on your Google Drive. Native document operations, persona-based access, and feedback tracking—no migration needed.',
        price: '$49',
        duration: '/month',
        featuresHeader: 'Standard features:',
        features: [
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
            },
            { 
                name: "10 active projects included", 
                tooltip: "Add 10-project packs for $29/month each." 
            }
        ],
        cta: 'Join Waitlist',
        href: '/waitlist',
        popular: true,
        theme: 'purple'
    },
    {
        id: 'Pro',
        title: 'Pro',
        description: 'For growing firms needing advanced review and templates.',
        price: '$99',
        duration: '/month',
        featuresHeader: 'Everything in Standard, plus templates & advanced review:',
        features: [
            { name: "Watermarked Document Delivery", tooltip: "Add organization branding watermarks to exported PDFs" },
            { name: "Document Templates", tooltip: "Pre-configured document templates for common use cases" },
            { name: "Project Templates", tooltip: "Choose from template projects with pre-defined folder structures" },
            { name: "Duplicate Project", tooltip: "Clone existing projects with all configurations" },
            { name: "Project activity dashboard", tooltip: "See all project activity, deadlines, and pending actions in one view" },
            { name: "Advanced Review & Approval Workflow", tooltip: "Approve/Finalize/Publish workflow with guest approvals" },
            { name: "Document Versioning", tooltip: "Lock documents on approval, create version snapshots" },
            { name: "Download Historical Versions", tooltip: "Access and download previous document versions" },
            { name: "Track Tab", tooltip: "Comprehensive tracking of review status, comments, approvals, version history" },
            { name: "Project Due Date Reminders", tooltip: "Automated reminders for project deadlines" },
            { name: "Add 10-Project Packs", tooltip: "Add 10-project packs for $49/month each" }
        ],
        cta: null,
        href: null,
        launchingLater: true,
        theme: 'blue'
    },
    {
        id: 'Business',
        title: 'Business',
        description: 'For established firms and mid-size agencies.',
        price: '$149',
        duration: '/month',
        featuresHeader: 'Everything in Pro, plus automation:',
        features: [
            { name: "Custom Subdomain", tooltip: "Use custom subdomain (e.g., yourcompany.pockett.io) for client portal access" },
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
            { name: "Auto-permit Documents", tooltip: "Automatically deliver documents on onboarding to external members" },
            { name: "Add 10-Project Packs", tooltip: "Add 10-project packs for $69/month each" }
        ],
        cta: null,
        href: null,
        launchingLater: true,
        theme: 'purple'
    },
    {
        id: 'Enterprise',
        title: 'Enterprise',
        description: 'For large organizations requiring advanced security and compliance.',
        price: 'Contact Us',
        duration: '',
        featuresHeader: 'Everything in Business, plus enterprise features:',
        features: [
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
            { name: "Custom DNS Domain", tooltip: "Use your own domain (e.g., portal.yourcompany.com) with full DNS control and SSL certificate management" },
            { name: "Dedicated Support", tooltip: "Priority support with SLA guarantees" },
            { name: "Custom Onboarding", tooltip: "Tailored onboarding and training" },
            { name: "Add 10-Project Packs", tooltip: "Add 10-project packs for $99/month each" }
        ],
        cta: null,
        href: null,
        launchingLater: true,
        theme: 'purple'
    }
]
