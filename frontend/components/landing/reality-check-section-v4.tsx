"use client"

import { useEffect, useState, type ComponentType, type ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  AlertTriangle,
  Archive,
  Briefcase,
  DollarSign,
  History,
  Hourglass,
  Link2,
  LockKeyhole,
  Package,
  Receipt,
  Scale,
  ScanEye,
  ShieldAlert,
  Timer,
  TrendingDown,
  UserX,
} from "lucide-react"
import { MARKETING_PAGE_SHELL } from "@/lib/marketing/page-shell"
import { cn } from "@/lib/utils"

const stats = [
  {
    value: "50%",
    label: "Trust Erosion",
    desc: "Clients associate disorganized file sharing with amateur business practices.",
  },
  {
    value: "23%",
    label: "Zombie Links",
    desc: "Shared links remain active 1yr post-contract.",
  },
  {
    value: "65%",
    label: "Unpaid Usage",
    desc: "of consulting IP is reused without ongoing payment.",
  },
  {
    value: "31%",
    label: "Data Leakage",
    desc: "Client files are reshared to unauthorized emails.",
  },
  {
    value: "8h",
    label: "Lost Productivity",
    desc: "per week spent searching across email threads.",
  },
  {
    value: "0",
    label: "Audit Trail",
    desc: "visibility into who is accessing your files right now.",
  },
] as const

type CardDef = {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>
  title: string
  desc: string
}

type SlideDef = {
  id: string
  badge: string
  BadgeIcon: ComponentType<{ className?: string; strokeWidth?: number }>
  headline: ReactNode
  body: string
  cards: readonly CardDef[]
}

const slides: readonly SlideDef[] = [
  {
    id: "brand-risk",
    badge: "Brand Risk",
    BadgeIcon: AlertTriangle,
    headline: (
      <>
        Delivering Premium Strategy in a{" "}
        <span className="text-[#1b1b1d]/30">&quot;New Folder (2)&quot;</span> Feels Wrong.
      </>
    ),
    body: "High-ticket clients expect a high-ticket experience. Stop sending messy Drive links and start delivering a professional portal that honors your expertise and your brand.",
    cards: [
      {
        icon: Package,
        title: "The 'Zip File' Dump",
        desc: "Overwhelms clients and looks amateur. Dilutes your value instantly.",
      },
      {
        icon: History,
        title: "Version Chaos",
        desc: "Using 'Strategy_Final_v2_EDIT.pdf'. High risk for execution errors.",
      },
      {
        icon: Briefcase,
        title: "Broken Experience",
        desc: "Commanding high-ticket fees with low-budget delivery mechanisms.",
      },
    ],
  },
  {
    id: "revenue-leak",
    badge: "Revenue Leak",
    BadgeIcon: DollarSign,
    headline: (
      <>
        Your Frameworks Keep Working—<span className="text-[#1b1b1d]/40">But the Invoice Stopped.</span>
      </>
    ),
    body: "Consulting IP is reused internally as playbooks and templates long after the SOW ends—often with no renewal, license fee, or clear commercial tie-back to your firm.",
    cards: [
      {
        icon: Receipt,
        title: "Silent IP reuse",
        desc: "Deliverables circulate as 'how we do it here' with no ongoing payment or attribution.",
      },
      {
        icon: Hourglass,
        title: "Scope bleed via attachments",
        desc: "Loose folders blur what's in contract; you absorb rework you never priced.",
      },
      {
        icon: TrendingDown,
        title: "Renewals you don't capture",
        desc: "Clients stay sticky to your artifacts while you're left chasing the next engagement.",
      },
    ],
  },
  {
    id: "security-gap",
    badge: "Security Gap",
    BadgeIcon: ShieldAlert,
    headline: (
      <>
        You Shared a Folder. <span className="text-[#1b1b1d]/35">You Lost the Map.</span>
      </>
    ),
    body: "Links outlive contracts, permissions drift, and when compliance asks who had access—spreadsheets and memory are not an audit trail.",
    cards: [
      {
        icon: Link2,
        title: "Zombie links",
        desc: "Shared links remain active a year after the contract—still pointing at your IP.",
      },
      {
        icon: UserX,
        title: "Shadow recipients",
        desc: "Files get forwarded to addresses that never signed your NDA or MSA.",
      },
      {
        icon: ScanEye,
        title: "Zero live audit",
        desc: "No single view of who opened what, when—only hope and inbox archaeology.",
      },
    ],
  },
  {
    id: "intellectual-property",
    badge: "Intellectual Property",
    BadgeIcon: Scale,
    headline: (
      <>
        Your Methodology Shouldn&apos;t <span className="text-[#1b1b1d]/35">Outlive the Engagement.</span>
      </>
    ),
    body: "When projects wrap, frameworks and decks should retire on your terms—not as stray copies in someone else's Drive tree.",
    cards: [
      {
        icon: LockKeyhole,
        title: "Internal-only guardrails",
        desc: "Tag models and templates so they never ship in client bundles by accident.",
      },
      {
        icon: Timer,
        title: "Time-bomb shares",
        desc: "Default expiring links so dead deals don't keep a live pipe to your IP.",
      },
      {
        icon: Archive,
        title: "One-click Wrap",
        desc: "Lock folders to view-only and package what was actually delivered—clean handoff.",
      },
    ],
  },
] as const

const CAROUSEL_MS = 6500

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
}

/**
 * Reality Check — V4 gray band + banded grid; center & right columns rotate together (Brand Risk + Revenue / Security / IP).
 */
export function RealityCheckSectionV4() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length)
    }, CAROUSEL_MS)
    return () => clearInterval(t)
  }, [])

  const slide = slides[index]
  const BadgeIcon = slide.BadgeIcon

  return (
    <section className="relative overflow-hidden bg-[#E1E1E1] py-32">
      <div className={cn(MARKETING_PAGE_SHELL, "w-full")}>
        <div className="mb-16 text-left">
          <div className="mb-4 inline-block rounded-sm bg-red-600 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white [font-family:var(--font-kinetic-headline),system-ui,sans-serif]">
            Reality Check
          </div>
          <h2
            className={cn(
              "mb-4 flex flex-wrap items-center gap-x-3 text-5xl font-bold leading-none tracking-tighter md:text-7xl",
              "[font-family:var(--font-kinetic-headline),system-ui,sans-serif]",
            )}
          >
            The Hidden Cost of{" "}
            <span className="inline-block bg-black px-4 py-1 text-[#00FF41]">Document Chaos</span>
          </h2>
          <p className="max-w-3xl text-xl text-[#45474c] [font-family:var(--font-kinetic-body),system-ui,sans-serif]">
            Inefficient document workflows are quietly draining your margins and exposing your firm to unnecessary risk.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-0 overflow-hidden rounded-xl border border-black/[0.08] lg:grid-cols-12">
          {/* Left: stats 2×3 */}
          <div className="flex flex-col justify-center bg-white/40 p-8 lg:col-span-3 lg:p-10">
            <div className="grid grid-cols-2 gap-4">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="rounded border border-black/[0.06] bg-white p-5 shadow-sm"
                >
                  <span className="mb-1 block text-3xl font-bold tracking-tighter text-[#1b1b1d] [font-family:var(--font-kinetic-headline),system-ui,sans-serif]">
                    {s.value}
                  </span>
                  <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.2em] text-red-600 [font-family:var(--font-kinetic-headline),system-ui,sans-serif]">
                    {s.label}
                  </span>
                  <p className="text-[10px] leading-tight text-[#45474c] [font-family:var(--font-kinetic-body),system-ui,sans-serif]">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Center + right: synced carousel (display:contents so both are grid cells on lg) */}
          <div className="contents">
            <div className="flex flex-col justify-between border-black/[0.08] bg-white p-10 lg:col-span-6 lg:border-x lg:p-16">
              <div className="relative min-h-[min(42vh,22rem)] lg:min-h-[26rem]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={slide.id}
                    initial={fade.initial}
                    animate={fade.animate}
                    exit={fade.exit}
                    transition={fade.transition}
                    className="absolute inset-0 flex flex-col"
                  >
                    <div className="mb-10 inline-flex w-max max-w-full items-center gap-2 self-start rounded-sm bg-red-600 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white [font-family:var(--font-kinetic-headline),system-ui,sans-serif]">
                      <BadgeIcon className="h-3.5 w-3.5 shrink-0" aria-hidden strokeWidth={2} />
                      {slide.badge}
                    </div>
                    <h3
                      className={cn(
                        "mb-8 text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl",
                        "[font-family:var(--font-kinetic-headline),system-ui,sans-serif]",
                      )}
                    >
                      {slide.headline}
                    </h3>
                    <p className="max-w-xl text-xl leading-relaxed text-[#45474c] [font-family:var(--font-kinetic-body),system-ui,sans-serif]">
                      {slide.body}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="mt-12 flex items-center gap-2" role="tablist" aria-label="Reality check topics">
                {slides.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    role="tab"
                    aria-selected={i === index}
                    aria-label={`Show ${s.badge}`}
                    className={cn(
                      "h-1 rounded-full transition-all duration-300",
                      i === index ? "w-8 bg-[#1b1b1d]" : "w-2 bg-[#c6c6cc] hover:bg-[#a1a1aa]",
                    )}
                    onClick={() => setIndex(i)}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-center bg-white/40 p-8 lg:col-span-3 lg:p-10">
              <div className="relative min-h-[min(52vh,28rem)] lg:min-h-[30rem]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={slide.id}
                    initial={fade.initial}
                    animate={fade.animate}
                    exit={fade.exit}
                    transition={fade.transition}
                    className="absolute inset-0 flex flex-col gap-4"
                  >
                    {slide.cards.map(({ icon: Icon, title, desc }) => (
                      <div
                        key={title}
                        className="flex items-start gap-4 rounded bg-white p-6 shadow-sm"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-slate-100">
                          <Icon className="h-5 w-5 text-slate-600" strokeWidth={1.75} aria-hidden />
                        </div>
                        <div>
                          <h4 className="mb-1 text-sm font-bold text-slate-900 [font-family:var(--font-kinetic-headline),system-ui,sans-serif]">
                            {title}
                          </h4>
                          <p className="text-[11px] leading-tight text-[#45474c] [font-family:var(--font-kinetic-body),system-ui,sans-serif]">
                            {desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
