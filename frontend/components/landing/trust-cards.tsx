"use client"

import { ShieldCheck, UserCheck, Lock } from "lucide-react"
import { FadeIn } from "@/components/animations/fade-in"
import type { LandingSkin } from "@/components/landing/landing-theme"

export function TrustCards({ skin = "legacy" }: { skin?: LandingSkin }) {
  const isModern = skin === "stitch" || skin === "kinetic"
  const isKinetic = skin === "kinetic"
  const card = isModern
    ? "bg-white p-8 rounded-xl h-full border border-black/[0.1] shadow-[0px_20px_40px_rgba(0,0,0,0.07)] hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden"
    : "bg-white p-8 rounded-2xl h-full border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden"
  const h3 = isModern
    ? isKinetic
      ? "text-xl font-bold text-[#1b1b1d] mb-3 [font-family:var(--font-kinetic-headline),system-ui,sans-serif]"
      : "text-xl font-semibold text-[#181c1c] mb-3 [font-family:var(--font-stitch-display),serif]"
    : "text-xl font-bold text-slate-900 mb-3"
  const body = isModern
    ? isKinetic
      ? "text-[#45474c] leading-relaxed font-normal [font-family:var(--font-kinetic-body),system-ui,sans-serif]"
      : "text-[#44474c] leading-relaxed font-normal"
    : "text-slate-600 leading-relaxed font-medium"
  const strong = isModern
    ? isKinetic
      ? "text-[#1b1b1d] font-semibold"
      : "text-[#181c1c] font-semibold"
    : "text-slate-900"

  const accent = isKinetic ? "#006e16" : "#0060a9"

  return (
    <div className="grid md:grid-cols-3 gap-8">
      <FadeIn delay={100} className="h-full">
        <div className={card}>
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-700">
            <UserCheck
              className={isModern ? "w-32 h-32" : "w-32 h-32 text-[#B07D62]"}
              style={isModern ? { color: accent } : undefined}
            />
          </div>
          <div
            className={
              isModern
                ? isKinetic
                  ? "w-14 h-14 rounded-xl bg-[#72ff70]/40 flex items-center justify-center mb-6 text-[#006e16] group-hover:bg-[#006e16] group-hover:text-white transition-colors duration-300"
                  : "w-14 h-14 rounded-xl bg-[#d3e4ff]/50 flex items-center justify-center mb-6 text-[#0060a9] group-hover:bg-[#0060a9] group-hover:text-white transition-colors duration-300"
                : "w-14 h-14 rounded-xl bg-[#ECC0AA]/25 border border-[#ECC0AA]/40 flex items-center justify-center mb-6 text-[#7a5343] group-hover:bg-[#B07D62] group-hover:text-white transition-colors duration-300 shadow-sm"
            }
          >
            <UserCheck className="w-7 h-7" />
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
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-700">
            <Lock className="w-32 h-32 text-slate-600" />
          </div>
          <div
            className={
              isModern
                ? isKinetic
                  ? "w-14 h-14 rounded-xl bg-white border border-black/[0.1] flex items-center justify-center mb-6 text-[#1b1b1d] group-hover:bg-[#141c2a] group-hover:text-[#72ff70] group-hover:border-[#141c2a] transition-colors duration-300"
                  : "w-14 h-14 rounded-xl bg-white border border-black/[0.1] flex items-center justify-center mb-6 text-[#041627] group-hover:bg-[#041627] group-hover:text-white group-hover:border-[#041627] transition-colors duration-300"
                : "w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 text-slate-600 group-hover:bg-slate-800 group-hover:text-white transition-colors duration-300 shadow-sm"
            }
          >
            <Lock className="w-7 h-7" />
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
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-700">
            <ShieldCheck
              className={isModern ? "w-32 h-32" : "w-32 h-32 text-[#B07D62]"}
              style={isModern ? { color: accent } : undefined}
            />
          </div>
          <div
            className={
              isModern
                ? isKinetic
                  ? "w-14 h-14 rounded-xl bg-[#5a78ff]/20 flex items-center justify-center mb-6 text-[#001256] group-hover:bg-[#5a78ff] group-hover:text-white transition-colors duration-300"
                  : "w-14 h-14 rounded-xl bg-[#d3e4ff]/40 flex items-center justify-center mb-6 text-[#041627] group-hover:bg-[#041627] group-hover:text-white transition-colors duration-300"
                : "w-14 h-14 rounded-xl bg-[#ECC0AA]/20 border border-[#ECC0AA]/35 flex items-center justify-center mb-6 text-[#7a5343] group-hover:bg-[#7a5343] group-hover:text-white transition-colors duration-300 shadow-sm"
            }
          >
            <ShieldCheck className="w-7 h-7" />
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
