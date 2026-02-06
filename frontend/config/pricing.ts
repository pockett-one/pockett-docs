
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
        id: 'pro',
        title: 'Pro',
        description: 'Stop risking your reputation with unprofessional Drive links. Stop wasting time on permission chaos. Stop frustrating clients with lost feedback.',
        price: '$49',
        duration: '/month',
        featuresHeader: 'Stop sending raw Drive links. Deliver professional client experiences:',
        features: [
            { 
                name: "Eliminate Reputation Risk: Professional Portal (Not 'Untitled Folder' Links)", 
                tooltip: "PAIN: Raw Drive links look unprofessional and damage your brand. SOLUTION: Replace generic 'Untitled Folder' links with a branded, professional portal that impresses clients and reflects your expertise. Works with your existing Google Drive - no need to learn a new storage system." 
            },
            { 
                name: "Prevent IP Theft: Protect Sensitive Files from Accidental Sharing", 
                tooltip: "PAIN: Risk of accidentally sharing internal frameworks or sensitive IP with clients. SOLUTION: Self-destruct timers, 'Never Share' tags, and persona-based access control that automatically separates what clients see vs internal files. No more worrying about wrong documents reaching wrong clients." 
            },
            { 
                name: "Stop Wasting Time: No More Resharing Links or Fixing Permissions", 
                tooltip: "PAIN: Constantly resharing Drive links when access expires, gets lost, or breaks. Hours wasted fixing permissions. SOLUTION: Automatic permission management - access stays active, clients always know where to find documents. No more 'can you resend that link?' emails." 
            },
            { 
                name: "End Folder Chaos: Structured Organization Clients Understand", 
                tooltip: "PAIN: Messy Drive folders, can't remember which folder belongs to which client, clients confused by your internal structure. SOLUTION: Turn messy Drive folders into clean Client → Project hierarchy that makes sense to clients. Uses your existing Google Drive - no migration needed." 
            },
            { 
                name: "Stop Chasing Feedback: See What Clients Reviewed & When", 
                tooltip: "PAIN: Feedback disappears into email threads, no visibility into what clients reviewed, chasing clients for input. SOLUTION: See exactly what clients have reviewed, when they accessed documents, and track feedback that stays organized and visible. No more 'did you see the updated proposal?' follow-ups." 
            },
            { 
                name: "No Learning Curve: Works with Your Existing Google Drive", 
                tooltip: "PAIN: Adopting new client portals means learning new document operations, migrating files, retraining team. SOLUTION: Built on top of Google Drive - your files stay where they are. No migration, no relearning. Your team keeps using Drive, clients see a professional portal." 
            },
            { 
                name: "One-Click Access Revocation: Lock Projects When Done", 
                tooltip: "PAIN: Can't easily revoke client access when projects end. Old Drive links stay active indefinitely. SOLUTION: One-click project closure automatically revokes all Drive permissions. Lock client folders to 'View Only' when deliverables are finalized. Clean project handoffs." 
            },
            { 
                name: "Eliminate Version Confusion: Track Document Access & Changes", 
                tooltip: "PAIN: 'Which version is the final one?' 'Did the client see the updated proposal?' No accountability. SOLUTION: See who accessed what document and when. Track document changes and ensure clients see the right versions. No more version control nightmares." 
            },
            { 
                name: "10 Active Projects Included", 
                tooltip: "Base plan includes 10 active projects; add 10-project packs for $29/month each" 
            },
            { 
                name: "Unlimited Members (No Per-User Fees)", 
                tooltip: "Add unlimited team members, clients, and collaborators without per-seat charges. Scale your team without scaling your costs." 
            },
            { 
                name: "Simplified Access Control: Persona-Based (Not Complex Permissions)", 
                tooltip: "PAIN: Complex permission management wastes time. SOLUTION: Assign team members to one of 4 simple personas (Project Lead, Team Member, External Collaborator, Client Contact). Persona determines access automatically - no granular file-by-file permission headaches." 
            },
            { 
                name: "Organized Feedback: Comments That Don't Get Lost", 
                tooltip: "PAIN: Client feedback buried in email threads, no clear record of what was discussed. SOLUTION: Comments and feedback on documents that stay organized, visible, and tied to the document. Never lose track of client input again." 
            }
        ],
        cta: 'Join Waitlist',
        href: '/waitlist',
        popular: true,
        theme: 'purple'
    },
    {
        id: 'pro-plus',
        title: 'Pro Plus',
        description: 'For growing firms needing advanced review and templates.',
        price: '$99',
        duration: '/month',
        featuresHeader: 'Everything in Pro, plus templates & advanced review:',
        features: [
            { name: "Document Templates", tooltip: "Pre-configured document templates for common use cases" },
            { name: "Project Templates", tooltip: "Choose from template projects with pre-defined folder structures" },
            { name: "Duplicate Project", tooltip: "Clone existing projects with all configurations" },
            { name: "Project Card Images", tooltip: "Visual project identification" },
            { name: "Advanced Review & Approval Workflow", tooltip: "Approve/Finalize/Publish workflow with guest approvals" },
            { name: "Document Versioning", tooltip: "Lock documents on approval, create version snapshots" },
            { name: "Download Historical Versions", tooltip: "Access and download previous document versions" },
            { name: "Watermark Branding", tooltip: "Add organization branding watermarks to exported PDFs" },
            { name: "Track Tab", tooltip: "Comprehensive tracking of review status, comments, approvals, version history" },
            { name: "Project Due Date Reminders", tooltip: "Automated reminders for project deadlines" },
            { name: "Custom Branded Client Portal", tooltip: "White-label client portal with organization logo, brand colors, and custom branding" },
            { name: "Add 10-Project Packs", tooltip: "Add 10-project packs for $49/month each" }
        ],
        cta: null,
        href: null,
        launchingLater: true,
        theme: 'blue'
    },
    {
        id: 'business',
        title: 'Business',
        description: 'For established firms and mid-size agencies.',
        price: '$149',
        duration: '/month',
        featuresHeader: 'Everything in Pro Plus, plus automation:',
        features: [
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
            { name: "Custom Subdomain", tooltip: "Use custom subdomain (e.g., yourcompany.pockett.io) for client portal access" },
            { name: "Add 10-Project Packs", tooltip: "Add 10-project packs for $69/month each" }
        ],
        cta: null,
        href: null,
        launchingLater: true,
        theme: 'purple'
    },
    {
        id: 'enterprise',
        title: 'Enterprise',
        description: 'For large organizations requiring advanced security and compliance.',
        price: '$299',
        duration: '/month',
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
