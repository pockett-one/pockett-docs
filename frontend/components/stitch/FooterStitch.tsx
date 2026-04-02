'use client'

import Link from 'next/link'
import { Mail } from 'lucide-react'
import { BrandNameStitch } from '@/components/stitch/BrandNameStitch'
import { STITCH_COLORS } from '@/config/stitch-firma-redesign'
import { platformEmail } from '@/config/platform-domain'
import { requestOpenCookieSettings } from '@/lib/cookie-consent-storage'

interface FooterStitchProps {
  onOpenModal?: (modalName: string) => void
}

/**
 * Stitch *Institutional Curator* footer — tonal surfaces, no decorative waves;
 * separation via background shift (`surface` → `surface-container-low`).
 */
export function FooterStitch({ onOpenModal }: FooterStitchProps) {
  const infoEmail = platformEmail('info')

  return (
    <footer
      className="relative mt-24 pt-20 pb-12 overflow-hidden text-[#181c1c]"
      style={{ backgroundColor: STITCH_COLORS.surfaceContainerLow }}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c4c6cd]/25 to-transparent" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 md:gap-8 mb-14">
          <div className="md:col-span-2">
            <div className="mb-4">
              <BrandNameStitch className="text-xl tracking-[-0.02em] sm:text-2xl" />
              <p
                className="mt-3 text-sm leading-relaxed max-w-sm [font-family:var(--font-stitch-label),system-ui,sans-serif]"
                style={{ color: STITCH_COLORS.onSurfaceVariant }}
              >
                Simple insights and control over Google Drive for consultants and agencies — non-custodial by design.
              </p>
            </div>
            <a
              href={`mailto:${infoEmail}`}
              className="inline-flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity"
              style={{ color: STITCH_COLORS.secondary }}
            >
              <Mail className="h-4 w-4 shrink-0" />
              {infoEmail}
            </a>
          </div>

          <div>
            <h3 className="[font-family:var(--font-stitch-label),system-ui,sans-serif] text-xs font-bold uppercase tracking-widest mb-4 text-[#44474c]">
              Product
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/resources/docs" target="_blank" className="text-[#44474c] hover:text-[#041627] transition-colors">
                  User Guide
                </Link>
              </li>
              <li>
                <Link href="/trust-center" className="text-[#44474c] hover:text-[#041627] transition-colors">
                  Trust Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-[#44474c] hover:text-[#041627] transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="[font-family:var(--font-stitch-label),system-ui,sans-serif] text-xs font-bold uppercase tracking-widest mb-4 text-[#44474c]">
              Resources
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/faq" className="text-[#44474c] hover:text-[#041627] transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-[#44474c] hover:text-[#041627] transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="[font-family:var(--font-stitch-label),system-ui,sans-serif] text-xs font-bold uppercase tracking-widest mb-4 text-[#44474c]">
              Legal
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => onOpenModal?.('privacy')}
                  className="text-left text-[#44474c] hover:text-[#041627] transition-colors"
                >
                  Privacy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenModal?.('terms')}
                  className="text-left text-[#44474c] hover:text-[#041627] transition-colors"
                >
                  Terms
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => requestOpenCookieSettings()}
                  className="text-left text-[#44474c] hover:text-[#041627] transition-colors"
                >
                  Cookies
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-8 text-xs [font-family:var(--font-stitch-label),system-ui,sans-serif] uppercase tracking-wider"
          style={{ color: STITCH_COLORS.onSurfaceVariant, borderTop: '1px solid rgba(196, 198, 205, 0.2)' }}
        >
          <p>© {new Date().getFullYear()} Stitch preview — same product as the main marketing site.</p>
          <Link href="/" className="hover:text-[#041627] transition-colors">
            ← Main landing
          </Link>
        </div>
      </div>
    </footer>
  )
}
