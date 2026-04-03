'use client'

import Link from 'next/link'
import { Cloud, Bolt, FolderSync, ShieldCheck } from 'lucide-react'
import { GoogleDriveProductMark } from '@/components/ui/google-drive-icon'
import { FadeIn } from '@/components/animations/fade-in'
import { BRAND_NAME } from '@/config/brand'

/**
 * Hero from Stitch *Full Landing Page — Kinetic Institution Edition*;
 * copy maps to existing consulting positioning.
 */
export function KineticHeroSection() {
  return (
    <div className="relative min-h-[min(92vh,920px)] flex items-center py-8 lg:py-4">
      <div className="grid grid-cols-12 gap-8 lg:gap-10 w-full items-center">
        <div className="col-span-12 lg:col-span-7 z-10">
          <FadeIn delay={0}>
            <div className="inline-block px-3 py-1 bg-[#72ff70] text-[#002203] text-[10px] font-bold tracking-tight mb-6 [font-family:var(--font-kinetic-headline),system-ui,sans-serif]">
              {BRAND_NAME.toUpperCase()} · LIVE
            </div>
          </FadeIn>
          <FadeIn delay={80}>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[4.25rem] xl:text-8xl font-bold leading-[0.92] tracking-tighter mb-8 max-w-3xl text-[#1b1b1d] [font-family:var(--font-kinetic-headline),system-ui,sans-serif]">
              Turn Your{' '}
              <span className="inline-flex items-center gap-2 align-bottom">
                <GoogleDriveProductMark className="mb-1 h-9 w-9 shrink-0 md:h-12 md:w-12" />
                <span className="text-[#5a78ff]">Google Drive</span>
              </span>{' '}
              into a Professional Client Portal
            </h1>
          </FadeIn>
          <FadeIn delay={140}>
            <p className="text-lg md:text-xl text-[#45474c] max-w-xl mb-10 leading-relaxed [font-family:var(--font-kinetic-body),system-ui,sans-serif]">
              Stop sending raw Drive links. Deliver a white-glove client experience on top of the storage you already trust
              — non-custodial, with revoke-on-close discipline for your IP.
            </p>
          </FadeIn>
          <FadeIn delay={200}>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-[#72ff70] text-[#002203] px-8 py-4 rounded-md font-bold tracking-widest text-sm hover:brightness-110 transition-all shadow-lg shadow-[#72ff70]/20 [font-family:var(--font-kinetic-headline),system-ui,sans-serif]"
              >
                Build your portal
                <Bolt className="h-5 w-5" strokeWidth={2} />
              </Link>
              <Link
                href="/trust-center"
                className="inline-flex items-center gap-2 bg-[#141c2a] text-white px-8 py-4 rounded-md font-bold tracking-widest text-sm hover:bg-black transition-colors [font-family:var(--font-kinetic-headline),system-ui,sans-serif]"
              >
                <ShieldCheck className="h-5 w-5 stroke-[1.75]" />
                View trust architecture
              </Link>
            </div>
          </FadeIn>
        </div>

        <div className="col-span-12 lg:col-span-5 relative mt-10 lg:mt-0">
          <div className="absolute -top-16 -right-10 w-80 h-80 bg-[#00f93f]/15 rounded-full blur-[100px] pointer-events-none" />
          <div className="relative rounded-lg border border-[#c6c6cd]/25 bg-white/70 backdrop-blur-xl p-6 shadow-2xl z-20 -rotate-2 hover:rotate-0 transition-transform duration-500">
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ba1a1a]" />
                <div className="w-3 h-3 rounded-full bg-[#72ff70]" />
                <div className="w-3 h-3 rounded-full bg-[#5a78ff]" />
              </div>
              <span className="text-[10px] font-bold text-[#45474c] tracking-widest [font-family:var(--font-kinetic-headline),system-ui,sans-serif]">
                SECURE_TUNNEL_ESTABLISHED
              </span>
            </div>
            <div className="flex items-start gap-3 rounded-md bg-[#f6f3f4] border border-black/[0.06] p-4 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#72ff70]/40 text-[#006e16]">
                <Cloud className="h-5 w-5 stroke-[1.5]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#006e16] [font-family:var(--font-kinetic-headline),system-ui,sans-serif]">
                  Drive connected
                </p>
                <p className="text-[10px] uppercase tracking-widest text-[#45474c] mt-0.5">Real-time sync active</p>
              </div>
            </div>
            <div className="aspect-[4/3] rounded-md bg-gradient-to-br from-[#f0edee] to-[#e4e2e3] border border-black/[0.06] flex items-center justify-center">
              <div className="text-center p-6 text-[#45474c] text-sm [font-family:var(--font-kinetic-body),system-ui,sans-serif]">
                <LinePulse />
                <p className="mt-4 font-semibold text-[#1b1b1d] [font-family:var(--font-kinetic-headline),system-ui,sans-serif]">
                  Portal preview
                </p>
                <p className="text-xs mt-1">Structured delivery surface for your clients</p>
              </div>
            </div>
          </div>
          <div className="absolute top-1/2 -left-4 lg:-left-14 rounded-lg border border-[#c6c6cd]/25 bg-white/80 backdrop-blur-md p-4 shadow-xl z-30 rotate-3 hidden md:flex items-center gap-4 max-w-[240px]">
            <div className="w-10 h-10 bg-[#5a78ff] rounded-md flex items-center justify-center text-white">
              <FolderSync className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#1b1b1d] [font-family:var(--font-kinetic-headline),system-ui,sans-serif]">
                Sync active
              </p>
              <p className="text-[10px] text-[#45474c] tracking-wider">CLIENT_ENGAGEMENTS / 2025</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function LinePulse() {
  return (
    <div className="flex items-end justify-center gap-1.5 h-16 w-full max-w-[200px] mx-auto">
      {[0.45, 0.72, 0.38, 0.9, 0.55].map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm bg-[#5a78ff] origin-bottom animate-pulse"
          style={{ height: `${h * 100}%`, animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  )
}
