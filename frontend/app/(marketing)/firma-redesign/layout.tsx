import { Work_Sans, Space_Grotesk } from 'next/font/google'
import type { Metadata } from 'next'
import { BRAND_NAME } from '@/config/brand'

const workSans = Work_Sans({
  subsets: ['latin'],
  variable: '--font-kinetic-body',
  weight: ['300', '400', '500'],
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-kinetic-headline',
  weight: ['500', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: `${BRAND_NAME} — Kinetic Institution (Stitch preview)`,
  description:
    'Marketing preview aligned with Google Stitch *Full Landing Page — Kinetic Institution Edition* (Space Grotesk / Work Sans, kinetic tokens).',
  robots: { index: false, follow: false },
}

export default function FirmaRedesignLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${workSans.variable} ${spaceGrotesk.variable} antialiased`}>{children}</div>
}
