"use client"

import { Cable, Cloud, Lock, Link2, ShieldCheck, SlidersHorizontal, Eye, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import type { LandingSkin } from "@/components/landing/landing-theme"

const H = "[font-family:var(--font-kinetic-headline),system-ui,sans-serif]"
const B = "[font-family:var(--font-kinetic-body),system-ui,sans-serif]"

/** Bento grid aligned to docs/design/design1 “Engineered for Velocity” — copy from Trust Architecture section. */
export function TrustArchitectureBento({ skin = "legacy" }: { skin?: LandingSkin }) {
  const isStitch = skin === "stitch"
  const labelClass = cn(
    "font-bold text-[10px] tracking-widest mb-4 block",
    isStitch ? "text-[#0060a9]" : "text-[#5a78ff]",
    H,
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      {/* 01 — wide */}
      <div className="md:col-span-8 rounded-none bg-white p-8 lg:p-10 shadow-sm border border-black/[0.06] relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-[0.08] group-hover:opacity-[0.15] transition-opacity pointer-events-none">
          <Cable className="w-24 h-24 text-[#1b1b1d]" strokeWidth={1.25} />
        </div>
        <span className={labelClass}>01 / CONNECTIVITY</span>
        <h3 className={cn("text-2xl md:text-3xl font-bold text-[#1b1b1d] mb-5 max-w-lg", H)}>You Own The Asset</h3>
        <p className={cn("text-[#45474c] max-w-xl mb-8 leading-relaxed", B)}>
          We assume a Non-Custodial role. Files stay in your Google Drive. Connect your existing storage. If you leave,
          you retain everything exactly as is.
        </p>
        <div className="flex flex-wrap gap-5 items-center">
          <div className="flex -space-x-2">
            <div className="w-10 h-10 rounded-full bg-[#dcd9da] border-2 border-white flex items-center justify-center">
              <Cloud className="w-4 h-4 text-[#45474c]" />
            </div>
            <div className="w-10 h-10 rounded-full bg-[#72ff70] border-2 border-white flex items-center justify-center">
              <Link2 className="w-4 h-4 text-[#002203]" />
            </div>
            <div className="w-10 h-10 rounded-full bg-[#5a78ff] border-2 border-white flex items-center justify-center">
              <Lock className="w-4 h-4 text-white" />
            </div>
          </div>
          <span className={cn("text-xs font-bold text-[#45474c] tracking-wide", H)}>
            FULLY ENCRYPTED DIRECT-TO-DRIVE TUNNEL
          </span>
        </div>
      </div>

      {/* 02 — narrow dark */}
      <div className="md:col-span-4 rounded-none bg-[#141c2a] p-8 lg:p-10 relative overflow-hidden text-white">
        <span className={cn("text-[#72ff70] font-bold text-[10px] tracking-widest mb-4 block", H)}>
          02 / BRAND TRUST + IP SAFEGUARDS
        </span>
        <h3 className={cn("text-2xl md:text-3xl font-bold mb-5 text-white", H)}>Enterprise look for clients. IP Protection for you.</h3>
        <p className={cn("text-[#b8c2d6] text-sm leading-relaxed", B)}>
          Eliminate &quot;please resend the file&quot; friction with a polished portal, logo, and brand system.
          Deliver a premium client experience while keeping raw Drive links out of circulation and protecting sensitive IP.
        </p>
      </div>

      {/* 03 — narrow analytics */}
      <div className="md:col-span-4 rounded-none bg-[#f0edee] p-6 lg:p-7 border border-black/[0.05]">
        <span className={labelClass}>03 / ANALYTICS</span>
        <p className={cn("text-[#1b1b1d] text-base font-medium mb-4 leading-snug", B)}>
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
          <div className="h-16 w-full bg-[#eae7e9] rounded flex items-end p-2 gap-1.5">
            <div className="bg-[#5a78ff] w-full rounded-sm h-[42%]" />
            <div className="bg-[#72ff70] w-full rounded-sm h-[64%]" />
            <div className="bg-[#5a78ff] w-full rounded-sm h-[36%]" />
            <div className="bg-[#72ff70] w-full rounded-sm h-[88%]" />
            <div className="bg-[#5a78ff] w-full rounded-sm h-[56%]" />
          </div>
        </div>
      </div>

      {/* 04 — wide permissions */}
      <div className="md:col-span-8 rounded-none bg-white p-8 lg:p-10 shadow-sm border border-black/[0.06] flex flex-col md:flex-row gap-8 md:gap-10 items-stretch md:items-start">
        <div className="md:w-1/2 min-w-0">
          <span className={labelClass}>
            04 / PERMISSIONS
          </span>
          <h3 className={cn("text-2xl md:text-3xl font-bold text-[#1b1b1d] mb-5", H)}>Ease of Governance</h3>
          <p className={cn("text-[#45474c] text-sm leading-relaxed", B)}>
            Self-destruct shares, internal-only tags, and engagement wrap-up automation — fewer zombie links, clearer IP
            boundaries.
          </p>
        </div>
        <div className="md:w-1/2 w-full min-h-[192px] rounded-lg border border-black/[0.06] bg-gradient-to-br from-[#f8faf8] via-white to-[#eef7f0] p-5">
          <div className="h-full w-full rounded-md border border-black/[0.06] bg-white p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 rounded-md bg-[#72ff70]/25 px-2.5 py-1">
                <ShieldCheck className="h-4 w-4 text-[#006e16]" />
                <span className={cn("text-[10px] font-bold text-[#004c12]", H)}>POLICY ACTIVE</span>
              </div>
              <SlidersHorizontal className="h-4.5 w-4.5 text-[#64748b]" />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-md border border-black/[0.06] bg-[#f8fafc] p-2.5">
                <div className="mb-1 flex items-center gap-1.5 text-[10px] text-[#64748b]">
                  <Eye className="h-3 w-3" /> View-only
                </div>
                <div className={cn("text-xs font-semibold text-[#1b1b1d]", B)}>Client Review</div>
              </div>
              <div className="rounded-md border border-black/[0.06] bg-[#f8fafc] p-2.5">
                <div className="mb-1 flex items-center gap-1.5 text-[10px] text-[#64748b]">
                  <Download className="h-3 w-3" /> Download
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
