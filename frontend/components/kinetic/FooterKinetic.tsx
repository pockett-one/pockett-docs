'use client'

import Link from 'next/link'
import { Mail } from 'lucide-react'
import { BRAND_NAME } from '@/config/brand'
import { platformEmail } from '@/config/platform-domain'
import { requestOpenCookieSettings } from '@/lib/cookie-consent-storage'

interface FooterKineticProps {
  onOpenModal?: (modalName: string) => void
}

/** Minimal footer — Kinetic Institution Edition strip + product links. */
export function FooterKinetic({ onOpenModal }: FooterKineticProps) {
  const infoEmail = platformEmail('info')

  return (
    <footer className="border-t border-slate-200/80 bg-slate-50">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-10 px-4 py-12 sm:px-8 md:flex-row md:justify-between md:items-center">
        <div className="text-center md:text-left">
          <span className="block text-lg font-bold text-slate-900 [font-family:var(--font-kinetic-headline),system-ui,sans-serif]">
            {BRAND_NAME}
            <span className="font-normal text-slate-500"> · kinetic preview</span>
          </span>
          <a
            href={`mailto:${infoEmail}`}
            className="mt-2 inline-flex items-center gap-2 text-sm text-[#006e16] hover:underline [font-family:var(--font-kinetic-body),system-ui,sans-serif]"
          >
            <Mail className="h-4 w-4 shrink-0" />
            {infoEmail}
          </a>
          <p className="mt-3 text-xs text-slate-500 [font-family:var(--font-kinetic-body),system-ui,sans-serif]">
            © {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-8 md:gap-10">
          <Link href="/trust-center" className="text-xs font-bold tracking-widest text-slate-500 hover:text-emerald-500 [font-family:var(--font-kinetic-headline),system-ui,sans-serif]">
            TRUST
          </Link>
          <Link href="/resources/docs" target="_blank" className="text-xs font-bold tracking-widest text-slate-500 hover:text-emerald-500 [font-family:var(--font-kinetic-headline),system-ui,sans-serif]">
            DOCS
          </Link>
          <Link href="/contact" className="text-xs font-bold tracking-widest text-slate-500 hover:text-emerald-500 [font-family:var(--font-kinetic-headline),system-ui,sans-serif]">
            CONTACT
          </Link>
          <button
            type="button"
            onClick={() => requestOpenCookieSettings()}
            className="text-xs font-bold tracking-widest text-slate-500 hover:text-emerald-500 [font-family:var(--font-kinetic-headline),system-ui,sans-serif]"
          >
            COOKIES
          </button>
        </div>
        <div className="flex gap-3">
          {onOpenModal && (
            <>
              <button
                type="button"
                onClick={() => onOpenModal('privacy')}
                className="h-9 rounded-full bg-slate-200 px-4 text-xs font-bold text-slate-600 hover:bg-emerald-500/15"
              >
                Privacy
              </button>
              <button
                type="button"
                onClick={() => onOpenModal('terms')}
                className="h-9 rounded-full bg-slate-200 px-4 text-xs font-bold text-slate-600 hover:bg-emerald-500/15"
              >
                Terms
              </button>
            </>
          )}
        </div>
      </div>
    </footer>
  )
}
