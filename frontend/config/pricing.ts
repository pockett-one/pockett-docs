
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
    projectsIncluded?: number // shown in title tile, e.g. 10, 25, 50, 100
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
        projectsIncluded: 10,
        description: 'Bring your own Google Drive—non-custodial. Your documents stay where they are; we add the portal. No migration, no new storage. Professional client portal with persona-based access and feedback tracking.',
        price: '$49',
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
        cta: 'Join Waitlist',
        href: '/waitlist',
        popular: true,
        theme: 'purple'
    },
    {
        id: 'Pro',
        title: 'Pro',
        projectsIncluded: 25,
        description: 'For growing firms needing advanced review and templates.',
        price: '$99',
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
        cta: null,
        href: null,
        launchingLater: true,
        theme: 'blue'
    },
    {
        id: 'Business',
        title: 'Business',
        projectsIncluded: 50,
        description: 'For established firms and mid-size agencies.',
        price: '$149',
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
        cta: null,
        href: null,
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
        cta: null,
        href: null,
        launchingLater: true,
        theme: 'purple'
    }
]
