import type { Metadata } from "next"

import { LandingPage } from "@/components/landing/landing-page"
import { BRAND_NAME } from "@/config/brand"
import { getPlatformSiteOrigin } from "@/config/platform-domain"

const siteOrigin = getPlatformSiteOrigin()

const homeTitle = `${BRAND_NAME} | Client Portal for Marketing Firms, Agencies & Advisors atop Google Drive`
const homeDescription = `${BRAND_NAME} turns Google Drive into a branded client portal for marketing agencies, fractional executives, strategic consultants, and advisory partners—non-custodial sharing, audit-ready access, and one-click Wrap when engagements end. Also trusted by audit, training, and consulting teams.`

export const metadata: Metadata = {
  title: homeTitle,
  description: homeDescription,
  keywords: [
    "Client Portal",
    "Google Drive Portal",
    "Marketing Agency Client Portal",
    "Fractional CMO",
    "Fractional Executive Tools",
    "Strategic Consultants",
    "Advisory Client Portal",
    "Secure File Sharing",
    "Non-Custodial Security",
    "Google Drive Integration",
    "Project Wrap",
    "Professional Services Automation",
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
    type: "website",
    locale: "en_US",
    url: siteOrigin,
    siteName: BRAND_NAME,
    title: homeTitle,
    description: homeDescription,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${BRAND_NAME} - Professional Client Portal`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: homeTitle,
    description: homeDescription,
    images: ["/twitter-image.png"],
  },
  alternates: {
    canonical: siteOrigin,
  },
}

export default function MarketingHomePage() {
  return <LandingPage skin="legacy" />
}
