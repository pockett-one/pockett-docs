"use client"

import { Cable, Cloud, Lock, Link2, ShieldCheck, SlidersHorizontal, Eye, Download } from "lucide-react"

import type { LandingSkin } from "@/components/landing/landing-theme"
import {
  MARKETING_SURFACE_DEPTH_HOVER,
  MARKETING_SURFACE_DEPTH_HOVER_DARK,
} from "@/lib/marketing/target-audience-nav"
import { cn } from "@/lib/utils"

const H = "[font-family:var(--font-kinetic-headline),system-ui,sans-serif]"
const B = "[font-family:var(--font-kinetic-body),system-ui,sans-serif]"

function kineticLabelClass(skin: LandingSkin | undefined) {
  const isStitch = skin === "stitch"
  return cn(
    "mb-3 block text-[10px] font-bold tracking-widest",
    isStitch ? "text-[#0060a9]" : "text-[#5a78ff]",
    H,
  )
}

/**
 * Landing bento rows **03 / ANALYTICS** + **04 / PERMISSIONS** — same markup as the home trust section.
 * Exported for reuse on `/resources/trust-center` and composed inside `TrustArchitectureBento`.
 */
export function TrustArchitectureBentoAnalyticsPermissionsRow({
  skin = "legacy",
  /** Set when this row is the only child of a grid (e.g. trust center). Omit inside `TrustArchitectureBento` (uses `display: contents`). */
  layout = "contents",
  /** `bento`: 03 / 04 (home trust section). `continued`: 04 / 05 after trust-center pillars 01–03. */
  numbering = "bento",
}: {
  skin?: LandingSkin
  layout?: "contents" | "grid"
  numbering?: "bento" | "continued"
}) {
  const labelClass = kineticLabelClass(skin)
  const analyticsLabel = numbering === "continued" ? "04 / ANALYTICS" : "03 / ANALYTICS"
  const permissionsLabel = numbering === "continued" ? "05 / PERMISSIONS" : "04 / PERMISSIONS"

  const shell =
    layout === "grid"
      ? "grid grid-cols-1 gap-6 md:grid-cols-12"
      : "contents"

  return (
    <div className={shell}>
      {/* Analytics (03 on landing bento, 04 on trust center) */}
      <div
        className={cn(
          "rounded-none border border-black/[0.05] bg-[#f0edee] p-5 shadow-sm md:col-span-4 lg:p-6",
          MARKETING_SURFACE_DEPTH_HOVER,
        )}
      >
        <span className={labelClass}>{analyticsLabel}</span>
        <p className={cn("mb-4 text-base font-medium leading-snug text-[#1b1b1d]", B)}>
          Track views, downloads, and engagement across your portal in real-time.
        </p>
        <div className="rounded-lg border border-black/[0.06] bg-white p-3.5">
          <div className="mb-3 grid grid-cols-3 gap-2">
            <div className="rounded-md bg-[#5a78ff]/10 px-2 py-1.5">
              <div className={cn("text-[10px] text-[#4b5563]", H)}>Views</div>
              <div className={cn("text-sm font-bold text-[#1b1b1d]", H)}>1.2K</div>
            </div>
            <div className="rounded-md bg-[#72ff70]/20 px-2 py-1.5">
              <div className={cn("text-[10px] text-[#4b5563]", H)}>Downloads</div>
              <div className={cn("text-sm font-bold text-[#1b1b1d]", H)}>386</div>
            </div>
            <div className="rounded-md bg-[#5a78ff]/10 px-2 py-1.5">
              <div className={cn("text-[10px] text-[#4b5563]", H)}>Engaged</div>
              <div className={cn("text-sm font-bold text-[#1b1b1d]", H)}>74%</div>
            </div>
          </div>
          <div className="flex h-16 w-full items-end gap-1.5 rounded bg-[#eae7e9] p-2">
            <div className="h-[42%] w-full rounded-sm bg-[#5a78ff]" />
            <div className="h-[64%] w-full rounded-sm bg-[#72ff70]" />
            <div className="h-[36%] w-full rounded-sm bg-[#5a78ff]" />
            <div className="h-[88%] w-full rounded-sm bg-[#72ff70]" />
            <div className="h-[56%] w-full rounded-sm bg-[#5a78ff]" />
          </div>
        </div>
      </div>

      {/* Permissions (04 on landing bento, 05 on trust center) */}
      <div
        className={cn(
          "flex flex-col items-stretch gap-6 rounded-none border border-black/[0.06] bg-white p-6 shadow-sm md:col-span-8 md:flex-row md:items-start md:gap-8 lg:p-8",
          MARKETING_SURFACE_DEPTH_HOVER,
        )}
      >
        <div className="min-w-0 md:w-1/2">
          <span className={labelClass}>{permissionsLabel}</span>
          <h3 className={cn("mb-3 text-2xl font-bold text-[#1b1b1d] md:text-3xl", H)}>Ease of Governance</h3>
          <p className={cn("text-pretty text-sm leading-snug text-[#45474c] md:leading-snug", B)}>
            Self-destruct shares, internal-only tags, and engagement wrap-up automation —
            <br className="hidden md:block" /> fewer zombie links, clearer IP boundaries.
          </p>
        </div>
        <div className="min-h-[192px] w-full rounded-lg border border-black/[0.06] bg-gradient-to-br from-[#f8faf8] via-white to-[#eef7f0] p-5 md:w-1/2">
          <div className="flex h-full w-full flex-col justify-between rounded-md border border-black/[0.06] bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 rounded-md bg-[#72ff70]/25 px-2.5 py-1">
                <ShieldCheck className="h-4 w-4 text-[#006e16]" aria-hidden />
                <span className={cn("text-[10px] font-bold text-[#004c12]", H)}>POLICY ACTIVE</span>
              </div>
              <SlidersHorizontal className="h-4 w-4 text-[#64748b]" aria-hidden />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-md border border-black/[0.06] bg-[#f8fafc] p-2.5">
                <div className="mb-1 flex items-center gap-1.5 text-[10px] text-[#64748b]">
                  <Eye className="h-3 w-3 shrink-0" aria-hidden /> View-only
                </div>
                <div className={cn("text-xs font-semibold text-[#1b1b1d]", B)}>Client Review</div>
              </div>
              <div className="rounded-md border border-black/[0.06] bg-[#f8fafc] p-2.5">
                <div className="mb-1 flex items-center gap-1.5 text-[10px] text-[#64748b]">
                  <Download className="h-3 w-3 shrink-0" aria-hidden /> Download
                </div>
                <div className={cn("text-xs font-semibold text-[#1b1b1d]", B)}>Internal Only</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Bento grid aligned to docs/design/design1 “Engineered for Velocity” — copy from Trust Architecture section. */
export function TrustArchitectureBento({ skin = "legacy" }: { skin?: LandingSkin }) {
  const labelClass = kineticLabelClass(skin)

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-5">
      {/* 01 — wide */}
      <div
        className={cn(
          "group overflow-hidden rounded-none border border-black/[0.06] bg-white p-6 shadow-sm md:col-span-8 lg:p-8",
          MARKETING_SURFACE_DEPTH_HOVER,
        )}
      >
        <div className="pointer-events-none absolute right-0 top-0 p-4 opacity-[0.08] transition-opacity group-hover:opacity-[0.15]">
          <Cable className="h-24 w-24 text-[#1b1b1d]" strokeWidth={1.25} aria-hidden />
        </div>
        <span className={labelClass}>01 / CONNECTIVITY</span>
        <h3 className={cn("mb-3 max-w-lg text-2xl font-bold text-[#1b1b1d] md:text-3xl", H)}>You Own The Asset</h3>
        <p className={cn("mb-5 max-w-none text-pretty leading-snug text-[#45474c] md:text-[17px] md:leading-snug", B)}>
          We assume a Non-Custodial role. Files stay in your Google Drive.
          <br className="hidden md:block" /> Connect your existing storage. If you leave, you retain everything exactly as
          is.
        </p>
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex -space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#dcd9da]">
              <Cloud className="h-4 w-4 text-[#45474c]" aria-hidden />
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#72ff70]">
              <Link2 className="h-4 w-4 text-[#002203]" aria-hidden />
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#5a78ff]">
              <Lock className="h-4 w-4 text-white" aria-hidden />
            </div>
          </div>
          <span className={cn("text-xs font-bold tracking-wide text-[#45474c]", H)}>
            FULLY ENCRYPTED DIRECT-TO-DRIVE TUNNEL
          </span>
        </div>
      </div>

      {/* 02 — narrow dark */}
      <div
        className={cn(
          "overflow-hidden rounded-none bg-[#141c2a] p-6 text-white shadow-sm md:col-span-4 lg:p-8",
          MARKETING_SURFACE_DEPTH_HOVER_DARK,
        )}
      >
        <span className={cn("mb-3 block text-[10px] font-bold tracking-widest text-[#72ff70]", H)}>
          02 / BRAND TRUST + IP SAFEGUARDS
        </span>
        <h3 className={cn("mb-3 text-2xl font-bold text-white md:text-3xl", H)}>
          Enterprise look for clients. IP Protection for you.
        </h3>
        <p className={cn("text-pretty text-sm leading-snug text-[#b8c2d6]", B)}>
          Eliminate &quot;please resend the file&quot; friction with a polished portal, logo, and brand system.
          <br className="hidden sm:block" /> Deliver a premium client experience while keeping raw Drive links out of
          circulation and protecting sensitive IP.
        </p>
      </div>

      <TrustArchitectureBentoAnalyticsPermissionsRow skin={skin} layout="contents" />
    </div>
  )
}
