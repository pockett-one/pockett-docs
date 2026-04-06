import type { Metadata } from "next"
import type { ReactNode } from "react"

import { FAQ_DATA } from "@/data/faq-data"
import { BRAND_NAME } from "@/config/brand"
import { getPlatformSiteOrigin } from "@/config/platform-domain"
import { KINETIC_COLORS } from "@/config/kinetic-institution"

const siteOrigin = getPlatformSiteOrigin()
const faqPath = "/resources/faq" as const
const faqUrl = `${siteOrigin}${faqPath}`

const faqTitle = `Frequently Asked Questions | ${BRAND_NAME}`
const faqDescription = `Answers about ${BRAND_NAME}'s client portal for marketing agencies, fractional executives, consultants, and advisors—Google Drive integration, security, Wrap, and multi-client engagements.`

export const metadata: Metadata = {
  title: faqTitle,
  description: faqDescription,
  keywords: [
    "FAQ",
    "client portal",
    "Google Drive",
    "marketing agency",
    "fractional CMO",
    "consultant tools",
    "non-custodial",
    "secure file sharing",
    BRAND_NAME,
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: faqTitle,
    description: faqDescription,
    type: "website",
    url: faqUrl,
    siteName: BRAND_NAME,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${BRAND_NAME} - FAQ`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: faqTitle,
    description: faqDescription,
    images: ["/twitter-image.png"],
  },
  alternates: {
    canonical: faqUrl,
  },
}

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_DATA.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
}

/**
 * Same kinetic surface as `(marketing)/layout.tsx` — FAQ lives under `/resources/*` but keeps marketing chrome.
 */
export default function ResourcesFaqLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div
        className="relative min-h-screen overflow-x-hidden font-sans antialiased [font-family:var(--font-kinetic-body),system-ui,sans-serif] selection:bg-[#72ff70] selection:text-[#002203]"
        style={{
          backgroundColor: KINETIC_COLORS.surface,
          color: KINETIC_COLORS.onSurface,
        }}
      >
        <div className="pointer-events-none fixed inset-0 z-0">
          <div
            className="absolute top-[-18%] right-[-8%] h-[min(88vw,680px)] w-[min(88vw,680px)] rounded-full opacity-35 blur-[100px]"
            style={{ background: "radial-gradient(circle, #72ff7044 0%, transparent 72%)" }}
          />
          <div
            className="absolute bottom-[-22%] left-[-12%] h-[min(78vw,520px)] w-[min(78vw,520px)] rounded-full opacity-25 blur-[90px]"
            style={{ background: "radial-gradient(circle, #5a78ff33 0%, transparent 70%)" }}
          />
        </div>
        <div className="relative z-10 min-h-screen pt-24 lg:pt-28">{children}</div>
      </div>
    </>
  )
}
