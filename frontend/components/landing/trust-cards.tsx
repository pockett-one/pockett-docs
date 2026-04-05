"use client"

import { Cloud, Link2, Lock, ShieldCheck, UserCheck } from "lucide-react"

import { FadeIn } from "@/components/animations/fade-in"
import type { LandingSkin } from "@/components/landing/landing-theme"
import { cn } from "@/lib/utils"

const H = "[font-family:var(--font-kinetic-headline),system-ui,sans-serif]"
const B = "[font-family:var(--font-kinetic-body),system-ui,sans-serif]"

/** White tile — matches `useCaseBlocks` + `TrustArchitectureBento` connectivity cards. */
const kineticShellWhite = cn(
  "group relative h-full overflow-hidden rounded-none border border-black/[0.06] bg-white p-8 shadow-sm lg:p-10",
  "md:min-h-[260px]",
)

/** Dark tile — matches bento `02 / BRAND TRUST`. */
const kineticShellDark =
  "group relative h-full overflow-hidden rounded-none bg-[#141c2a] p-8 text-white lg:p-10 md:min-h-[260px]"

/** Warm tile — matches bento `03 / ANALYTICS` / project use-case shell. */
const kineticShellWarm = cn(
  "group relative h-full overflow-hidden rounded-none border border-black/[0.05] bg-[#f0edee] p-8 shadow-sm lg:p-10",
  "md:min-h-[260px]",
)

const watermarkWrap =
  "pointer-events-none absolute right-0 top-0 p-8 opacity-[0.08] transition-opacity duration-500 group-hover:opacity-[0.16]"

export function TrustCards({ skin = "legacy" }: { skin?: LandingSkin }) {
  const isModern = skin === "stitch" || skin === "kinetic"
  const isKinetic = skin === "kinetic"

  if (isKinetic) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <FadeIn delay={100} className="h-full min-w-0">
          <div className={kineticShellWhite}>
            <div className={watermarkWrap}>
              <UserCheck className="h-20 w-20 text-[#22c55e]" strokeWidth={1.25} aria-hidden />
            </div>
            <span className={cn("mb-4 block text-[10px] font-bold uppercase tracking-widest text-[#5a78ff]", H)}>
              01 / Non-custody
            </span>
            <h3 className={cn("mb-5 max-w-lg text-2xl font-bold text-[#1b1b1d] md:text-3xl", H)}>You Own The Asset</h3>
            <p className={cn("mb-8 max-w-xl text-sm leading-relaxed text-[#45474c]", B)}>
              We assume a <strong className="font-semibold text-[#1b1b1d]">non-custodial</strong> role. Files stay in your
              Google Drive. If you leave, you keep everything exactly as it is.
            </p>
            <div className="mt-auto flex flex-wrap items-center gap-5">
              <div className="flex -space-x-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#dcd9da]">
                  <Cloud className="h-4 w-4 text-[#45474c]" strokeWidth={2} aria-hidden />
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#72ff70]">
                  <Link2 className="h-4 w-4 text-[#002203]" strokeWidth={2} aria-hidden />
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#5a78ff]">
                  <UserCheck className="h-4 w-4 text-white" strokeWidth={2} aria-hidden />
                </div>
              </div>
              <span className={cn("text-xs font-bold tracking-wide text-[#45474c]", H)}>YOUR DRIVE · YOUR FILES</span>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={200} className="h-full min-w-0">
          <div className={kineticShellDark}>
            <div className={cn(watermarkWrap, "opacity-[0.07] group-hover:opacity-[0.14]")}>
              <Lock className="h-20 w-20 text-white" strokeWidth={1.25} aria-hidden />
            </div>
            <span className={cn("mb-4 block text-[10px] font-bold uppercase tracking-widest text-[#72ff70]", H)}>
              02 / Client experience
            </span>
            <h3 className={cn("mb-5 text-2xl font-bold text-white md:text-3xl", H)}>Enterprise-Grade Image</h3>
            <p className={cn("text-sm leading-relaxed text-[#b8c2d6]", B)}>
              Look like a major firm with secure, managed data practices. No more &quot;oops, wrong file&quot; moments.{" "}
              <strong className="font-semibold text-white">Impress enterprise clients.</strong>
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <span className={cn("flex items-center gap-2 text-[10px] font-bold text-[#b8c2d6]", H)}>
                <span className="h-1.5 w-1.5 rounded-full bg-[#72ff70]" aria-hidden />
                BRANDED PORTAL
              </span>
              <span className={cn("flex items-center gap-2 text-[10px] font-bold text-[#b8c2d6]", H)}>
                <span className="h-1.5 w-1.5 rounded-full bg-[#72ff70]" aria-hidden />
                CONTROLLED ACCESS
              </span>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={300} className="h-full min-w-0">
          <div className={kineticShellWarm}>
            <div className={watermarkWrap}>
              <ShieldCheck className="h-20 w-20 text-[#1b1b1d]" strokeWidth={1.25} aria-hidden />
            </div>
            <span className={cn("mb-4 block text-[10px] font-bold uppercase tracking-widest text-[#5a78ff]", H)}>
              03 / IP & confidentiality
            </span>
            <h3 className={cn("mb-5 max-w-lg text-2xl font-bold text-[#1b1b1d] md:text-3xl", H)}>NDA-Ready Security</h3>
            <p className={cn("mb-6 max-w-xl text-sm leading-relaxed text-[#45474c]", B)}>
              Confidentiality is your currency. Use a system that separates{" "}
              <strong className="font-semibold text-[#1b1b1d]">metadata</strong> (structure) from{" "}
              <strong className="font-semibold text-[#1b1b1d]">data</strong> (content) for maximum IP protection.
            </p>
            <div className="mt-auto flex flex-wrap gap-4">
              <span className={cn("flex items-center gap-2 text-[10px] font-bold text-[#45474c]", H)}>
                <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" aria-hidden />
                STRUCTURE VS BYTES
              </span>
            </div>
          </div>
        </FadeIn>
      </div>
    )
  }

  const card = isModern
    ? "group relative h-full overflow-hidden rounded-none border border-black/[0.1] bg-white p-8 shadow-[0px_20px_40px_rgba(0,0,0,0.07)] transition-all duration-500 hover:-translate-y-1 lg:p-10"
    : "group relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)]"
  const h3 = isModern
    ? "mb-3 text-xl font-semibold text-[#181c1c] [font-family:var(--font-stitch-display),serif]"
    : "mb-3 text-xl font-bold text-slate-900"
  const body = isModern
    ? "font-normal leading-relaxed text-[#44474c]"
    : "font-medium leading-relaxed text-slate-600"
  const strong = isModern ? "font-semibold text-[#181c1c]" : "font-semibold text-slate-900"
  const accent = "#0060a9"

  return (
    <div className="grid gap-8 md:grid-cols-3">
      <FadeIn delay={100} className="h-full">
        <div className={card}>
          <div className="absolute right-0 top-0 p-8 opacity-5 transition-transform duration-700 group-hover:scale-110 group-hover:opacity-10">
            <UserCheck className="h-32 w-32" style={{ color: accent }} />
          </div>
          <div
            className={
              isModern
                ? "mb-6 flex h-14 w-14 items-center justify-center rounded-xl border border-black/[0.1] bg-[#d3e4ff]/50 text-[#0060a9] transition-colors duration-300 group-hover:bg-[#0060a9] group-hover:text-white"
                : "mb-6 flex h-14 w-14 items-center justify-center rounded-xl border border-[#ECC0AA]/40 bg-[#ECC0AA]/25 text-[#7a5343] shadow-sm transition-colors duration-300 group-hover:bg-[#B07D62] group-hover:text-white"
            }
          >
            <UserCheck className="h-7 w-7" />
          </div>
          <h3 className={h3}>You Own The Asset</h3>
          <p className={body}>
            We assume a <strong className={strong}>Non-Custodial</strong> role. Files stay in your Google Drive. If you
            leave, you keep everything exactly as is.
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={200} className="h-full">
        <div className={card}>
          <div className="absolute right-0 top-0 p-8 opacity-5 transition-transform duration-700 group-hover:scale-110 group-hover:opacity-10">
            <Lock className="h-32 w-32 text-slate-600" />
          </div>
          <div
            className={
              isModern
                ? "mb-6 flex h-14 w-14 items-center justify-center rounded-xl border border-black/[0.1] bg-white text-[#041627] transition-colors duration-300 group-hover:border-[#041627] group-hover:bg-[#041627] group-hover:text-white"
                : "mb-6 flex h-14 w-14 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-600 shadow-sm transition-colors duration-300 group-hover:bg-slate-800 group-hover:text-white"
            }
          >
            <Lock className="h-7 w-7" />
          </div>
          <h3 className={h3}>Enterprise-Grade Image</h3>
          <p className={body}>
            Look like a major firm with secure, managed data practices. No more &quot;oops, wrong file&quot; moments.{" "}
            <strong className={strong}>Impress enterprise clients.</strong>
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={300} className="h-full">
        <div className={card}>
          <div className="absolute right-0 top-0 p-8 opacity-5 transition-transform duration-700 group-hover:scale-110 group-hover:opacity-10">
            <ShieldCheck className="h-32 w-32" style={{ color: accent }} />
          </div>
          <div
            className={
              isModern
                ? "mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-[#d3e4ff]/40 text-[#041627] transition-colors duration-300 group-hover:bg-[#041627] group-hover:text-white"
                : "mb-6 flex h-14 w-14 items-center justify-center rounded-xl border border-[#ECC0AA]/35 bg-[#ECC0AA]/20 text-[#7a5343] transition-colors duration-300 group-hover:bg-[#7a5343] group-hover:text-white"
            }
          >
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h3 className={h3}>NDA-Ready Security</h3>
          <p className={body}>
            Confidentiality is your currency. Use a system that separates
            <strong className={strong}> Metadata</strong> (structure) from <strong className={strong}>Data</strong>{" "}
            (content) for maximum IP protection.
          </p>
        </div>
      </FadeIn>
    </div>
  )
}
