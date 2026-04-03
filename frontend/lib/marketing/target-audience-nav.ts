/**
 * Marketing anchors, mega-menu copy, scroll offsets, and shared layout shell (max-width + gutters).
 * Filename is historical; non-nav constants live here to avoid tiny one-export modules.
 */
/** Stable fragment for the Target Audience block on the marketing home page (`/`). */
export const TARGET_AUDIENCE_SECTION_ID = "target-audience"

/** Deep link to the Target Audience section on the main marketing home (`/`). */
export const TARGET_AUDIENCE_HREF = `/#${TARGET_AUDIENCE_SECTION_ID}` as const

/**
 * Max width + horizontal padding aligned with the marketing header rail (`Header`) and main landing sections.
 */
export const MARKETING_PAGE_SHELL =
  "max-w-[min(100%,92rem)] mx-auto px-3 sm:px-4 md:px-5 lg:px-6 xl:px-10"

/**
 * Solutions mega-menu: two summary rows (both point to the Target Audience section).
 * Copy is aligned with the on-page “Who Is firmä For?” and use-case cards.
 */
export const solutionsMegaMenuItems = [
  {
    id: "who-its-for",
    title: "Who it's for",
    description:
      "Fractional executives, consultants, strategic advisors, auditors, and corporate trainers—high-touch professionals who deliver through documents.",
  },
  {
    id: "use-cases",
    title: "Use cases",
    description:
      "Partnerships, consultations, projects, case management, audits, and training—how engagements map to your Drive.",
  },
] as const

/**
 * Scroll margin so in-page anchors clear the fixed header + layout top padding
 * (`pt-24 lg:pt-28` on marketing layout).
 */
export const targetAudienceScrollMarginClass = "scroll-mt-28 lg:scroll-mt-32"

export const audienceRoles = [
  { id: "audience-fractional-executives", label: "Fractional Executives" },
  { id: "audience-strategic-advisory", label: "Strategic Advisory" },
  { id: "audience-management-consulting", label: "Management Consulting" },
  { id: "audience-audit-compliance", label: "Audit & Compliance" },
  { id: "audience-corporate-trainers", label: "Corporate Trainers" },
] as const

export type UseCaseVariant =
  | "partnership"
  | "consultation"
  | "project"
  | "caseManagement"
  | "auditReview"
  | "training"

export type UseCaseBlock = {
  id: string
  menuTitle: string
  menuDescription: string
  variant: UseCaseVariant
  eyebrow: string
  headline: string
  body?: string
  delay: number
  colClass: string
  cardShellClass: string
}

export const useCaseBlocks: readonly UseCaseBlock[] = [
  {
    id: "use-case-strategic-partnership",
    menuTitle: "Strategic Partnership",
    menuDescription:
      "Ongoing, high-trust advisory relationships. A permanent digital home for knowledge.",
    variant: "partnership",
    eyebrow: "01 / Strategic Partnership",
    headline:
      "Ongoing, high-trust advisory relationships. A permanent digital home for knowledge.",
    delay: 100,
    colClass: "md:col-span-7",
    cardShellClass:
      "bg-white p-8 lg:p-10 rounded-none shadow-sm relative overflow-hidden group border border-black/[0.06] h-full md:min-h-[260px]",
  },
  {
    id: "use-case-consultation",
    menuTitle: "Consultation",
    menuDescription:
      "One-time advisory engagement — strategy sessions, assessments, and structured reviews.",
    variant: "consultation",
    eyebrow: "02 / Consultation",
    headline: "One-time advisory engagement.",
    body: "Strategy sessions, assessments, and structured reviews for high-stakes decisions.",
    delay: 150,
    colClass: "md:col-span-5",
    cardShellClass:
      "bg-[#141c2a] p-8 lg:p-10 rounded-none relative overflow-hidden flex flex-col h-full md:min-h-[260px]",
  },
  {
    id: "use-case-project",
    menuTitle: "Project",
    menuDescription:
      "Time-bound deliverables with milestones — from redesigns to launches, assets stay organized.",
    variant: "project",
    eyebrow: "03 / Project",
    headline: "Time-bound deliverable with clear milestones.",
    body: "From website redesigns to product launches - keep every asset organized.",
    delay: 200,
    colClass: "md:col-span-5",
    cardShellClass:
      "bg-[#f0edee] p-8 lg:p-10 rounded-none shadow-sm relative group flex flex-col h-full md:h-[260px] md:min-h-[260px] md:max-h-[260px] border border-black/[0.05]",
  },
  {
    id: "use-case-case-management",
    menuTitle: "Case Management",
    menuDescription:
      "Focused matters — legal and crisis workflows with sensitive documentation.",
    variant: "caseManagement",
    eyebrow: "04 / Case Management",
    headline: "Specific matters requiring focused attention.",
    body: "Ideal for legal matters and crisis management where documentation is sensitive.",
    delay: 250,
    colClass: "md:col-span-7",
    cardShellClass:
      "bg-white p-8 lg:p-10 rounded-none shadow-sm relative overflow-hidden group border border-black/[0.06] h-full md:h-[260px] md:min-h-[260px] md:max-h-[260px]",
  },
  {
    id: "use-case-audit-review",
    menuTitle: "Audit & Review",
    menuDescription:
      "Compliance work with structured docs and a clear, immutable trail.",
    variant: "auditReview",
    eyebrow: "05 / Audit & Review",
    headline: "Compliance work with structured docs.",
    body: "Manage security audits and financial reviews with a clear, immutable trail.",
    delay: 300,
    colClass: "md:col-span-8",
    cardShellClass:
      "bg-white p-8 lg:p-10 rounded-none shadow-sm relative overflow-hidden group border border-black/[0.06] h-full md:min-h-[260px]",
  },
  {
    id: "use-case-corporate-training",
    menuTitle: "Corporate Training",
    menuDescription:
      "Long-lived enterprise access — courseware and media with controlled expiration.",
    variant: "training",
    eyebrow: "06 / Corporate Training",
    headline: "Long-lived access for enterprise firms.",
    body: "Securely distribute courseware and video assets with controlled expiration.",
    delay: 350,
    colClass: "md:col-span-4",
    cardShellClass:
      "bg-white p-8 lg:p-10 rounded-none shadow-sm relative overflow-hidden group border border-black/[0.06] flex flex-col h-full md:h-[260px] md:min-h-[260px] md:max-h-[260px]",
  },
] as const
