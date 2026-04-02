'use client'

import Link from 'next/link'
import { Cable, Palette, FolderLock, ArrowRight, Cloud, Lock, RefreshCw } from 'lucide-react'

/**
 * Asymmetric bento grid from *Kinetic Institution Edition* — copy aligned to consulting product.
 */
export function KineticBentoSection() {
  return (
    <section className="py-24 lg:py-32 px-4 sm:px-6 lg:px-8 bg-[#f6f3f4] relative border-y border-black/[0.06]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 lg:mb-20 gap-8">
          <div className="max-w-xl">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-[#1b1b1d] mb-4 [font-family:var(--font-kinetic-headline),system-ui,sans-serif]">
              Engineered for velocity
            </h2>
            <p className="text-[#45474c] text-lg leading-relaxed [font-family:var(--font-kinetic-body),system-ui,sans-serif]">
              Link Google Drive, structure engagements, and deliver like an institution — without giving up custody of
              your files.
            </p>
          </div>
          <span className="text-6xl md:text-8xl font-bold [font-family:var(--font-kinetic-headline),system-ui,sans-serif] text-[#72ff70]/20 leading-none select-none pointer-events-none">
            PRECISION
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 rounded-lg bg-white p-8 lg:p-10 shadow-sm border border-black/[0.06] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-[0.07] group-hover:opacity-[0.14] transition-opacity pointer-events-none">
              <Cable className="w-24 h-24 text-[#1b1b1d]" />
            </div>
            <span className="text-[#5a78ff] font-bold text-[10px] tracking-widest mb-4 block [font-family:var(--font-kinetic-headline),system-ui,sans-serif]">
              01 / CONNECTIVITY
            </span>
            <h3 className="text-2xl md:text-3xl font-bold text-[#1b1b1d] mb-5 max-w-lg [font-family:var(--font-kinetic-headline),system-ui,sans-serif]">
              Native file ecosystem integration
            </h3>
            <p className="text-[#45474c] max-w-xl mb-8 [font-family:var(--font-kinetic-body),system-ui,sans-serif]">
              Connect specific folders; import documents into Client → Project hierarchies. Your content stays in Drive
              — we add structure, access control, and a client-facing portal.
            </p>
            <div className="flex gap-5 items-center flex-wrap">
              <div className="flex -space-x-2">
                <div className="w-10 h-10 rounded-full bg-[#dcd9da] border-2 border-white flex items-center justify-center">
                  <Cloud className="w-4 h-4 text-[#45474c]" />
                </div>
                <div className="w-10 h-10 rounded-full bg-[#72ff70] border-2 border-white flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 text-[#002203]" />
                </div>
                <div className="w-10 h-10 rounded-full bg-[#5a78ff] border-2 border-white flex items-center justify-center">
                  <Lock className="w-4 h-4 text-white" />
                </div>
              </div>
              <span className="text-xs font-bold text-[#45474c] tracking-wide [font-family:var(--font-kinetic-headline),system-ui,sans-serif]">
                METADATA · PERMISSIONS · AUDIT
              </span>
            </div>
          </div>

          <div className="md:col-span-4 rounded-lg bg-[#141c2a] p-8 lg:p-10 relative overflow-hidden text-white">
            <span className="text-[#72ff70] font-bold text-[10px] tracking-widest mb-4 block [font-family:var(--font-kinetic-headline),system-ui,sans-serif]">
              02 / BRANDING
            </span>
            <h3 className="text-2xl md:text-3xl font-bold mb-5 [font-family:var(--font-kinetic-headline),system-ui,sans-serif]">
              Absolute identity
            </h3>
            <p className="text-[#7c8496] text-sm mb-8 leading-relaxed [font-family:var(--font-kinetic-body),system-ui,sans-serif]">
              Present a professional portal: your voice, your standards — raw Drive links never have to leave your firm.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-[#72ff70] font-bold text-xs tracking-widest hover:gap-3 transition-all [font-family:var(--font-kinetic-headline),system-ui,sans-serif]"
            >
              Talk to us <ArrowRight className="w-4 h-4" />
            </Link>
            <Palette className="absolute -bottom-4 -right-4 w-28 h-28 text-white/[0.06]" />
          </div>

          <div className="md:col-span-4 rounded-lg bg-[#f0edee] p-8 lg:p-10 border border-black/[0.05]">
            <span className="text-[#5a78ff] font-bold text-[10px] tracking-widest mb-4 block [font-family:var(--font-kinetic-headline),system-ui,sans-serif]">
              03 / VISIBILITY
            </span>
            <h3 className="text-xl md:text-2xl font-bold text-[#1b1b1d] mb-4 [font-family:var(--font-kinetic-headline),system-ui,sans-serif]">
              Delivery insight
            </h3>
            <p className="text-[#45474c] text-sm mb-6 [font-family:var(--font-kinetic-body),system-ui,sans-serif]">
              Know what was shared, when, and to whom — with an audit posture built for advisory work.
            </p>
            <div className="h-24 w-full bg-[#eae7e9] rounded flex items-end p-3 gap-2">
              <div className="bg-[#5a78ff] w-full rounded-sm h-[45%]" />
              <div className="bg-[#72ff70] w-full rounded-sm h-[70%]" />
              <div className="bg-[#5a78ff] w-full rounded-sm h-[35%]" />
              <div className="bg-[#72ff70] w-full rounded-sm h-[90%]" />
            </div>
          </div>

          <div className="md:col-span-8 rounded-lg bg-white p-8 lg:p-10 shadow-sm border border-black/[0.06] flex flex-col md:flex-row gap-10 items-center">
            <div className="md:w-1/2">
              <span className="text-[#5a78ff] font-bold text-[10px] tracking-widest mb-4 block [font-family:var(--font-kinetic-headline),system-ui,sans-serif]">
                04 / PERMISSIONS
              </span>
              <h3 className="text-2xl md:text-3xl font-bold text-[#1b1b1d] mb-5 [font-family:var(--font-kinetic-headline),system-ui,sans-serif]">
                Granular governance
              </h3>
              <p className="text-[#45474c] text-sm leading-relaxed [font-family:var(--font-kinetic-body),system-ui,sans-serif]">
                Self-destruct shares, internal-only tags, and project wrap-up flows — fewer zombie links, clearer IP
                boundaries.
              </p>
            </div>
            <div className="md:w-1/2 w-full flex items-center justify-center rounded-lg bg-[#f6f3f4] border border-dashed border-black/10 p-10">
              <FolderLock className="w-16 h-16 text-[#006e16] opacity-80" strokeWidth={1.25} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
