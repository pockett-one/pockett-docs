"use client"

import { Container, ShieldCheck } from "lucide-react"

import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { TrustArchitectureBentoAnalyticsPermissionsRow } from "@/components/landing/trust-architecture-bento"
import { TrustCards } from "@/components/landing/trust-cards"
import { TrustDiagram } from "@/components/landing/trust-diagram"
import { GoogleDriveProductMark } from "@/components/ui/google-drive-icon"
import { BRAND_NAME } from "@/config/brand"
import { BrandName } from "@/components/brand/BrandName"
import { MARKETING_PAGE_SHELL } from "@/lib/marketing/target-audience-nav"
import { MarketingBreadcrumb } from "@/components/marketing/marketing-breadcrumb"
import {
  KineticSectionIntro,
  kineticSectionLeadClassName,
} from "@/components/kinetic/kinetic-section-intro"
import { LandingHeroPrimaryCtas } from "@/components/marketing/landing-hero-primary-ctas"
import { cn } from "@/lib/utils"

const labelFont = "[font-family:var(--font-kinetic-headline),system-ui,sans-serif]"
const ctaBandBg = "bg-[#232c42]"

export default function TrustPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />

      <main className={cn(MARKETING_PAGE_SHELL, "relative z-10 w-full flex-1 pb-16 md:pb-20")}>
        <MarketingBreadcrumb items={[{ label: "Trust architecture" }]} className="mb-8" />

        <header className="mb-12 text-left md:mb-14">
          <KineticSectionIntro
            compact
            heading="h1"
            titleScale="hero"
            badge={{
              variant: "lime",
              icon: <ShieldCheck className="ds-badge-kinetic__icon stroke-[2]" aria-hidden />,
              label: "Trust architecture",
            }}
            title={
              <>
                <span className="text-[#1b1b1d]">Your Business.</span>{" "}
                <span className="inline-flex items-center gap-2 align-middle">
                  <GoogleDriveProductMark className="h-8 w-8 shrink-0 sm:h-9 sm:w-9" alt="" aria-hidden />
                  <span className="sr-only">Google Drive</span>
                </span>{" "}
                <span className="text-[#1b1b1d]">Your Drive.</span>
                <br className="hidden sm:block" />
                <span className="text-[#1b1b1d]"> Your Asset.</span>{" "}
                <span className="text-[#7c8496]">Your Control.</span>
              </>
            }
            description={
              <p className={cn(kineticSectionLeadClassName, "max-w-2xl")}>
                Organize your files without holding them hostage.{" "}
                <strong className="font-semibold text-[#1b1b1d]">Non-custodial design</strong> means if you leave{" "}
                <BrandName className="inline font-semibold [font-size:inherit] [line-height:inherit]" gradient />, your
                folders stay exactly as they are.
              </p>
            }
            descriptionClassName=""
          />
        </header>

        <section aria-label="Trust architecture" className="mb-16 space-y-6 md:mb-20">
          <TrustCards skin="kinetic" />
          <TrustArchitectureBentoAnalyticsPermissionsRow
            skin="kinetic"
            layout="grid"
            numbering="continued"
          />
        </section>

        <section
          className="border-y border-black/[0.06] bg-white/70 py-14 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-sm md:py-16"
          aria-label="How data flows through the product"
        >
          <div className="mx-auto mb-10 max-w-3xl text-center md:mb-12 md:text-left">
            <KineticSectionIntro
              heading="h2"
              titleScale="section"
              compact
              badge={{
                variant: "lime",
                icon: <Container className="ds-badge-kinetic__icon stroke-[2]" aria-hidden />,
                label: "Transparent flow",
              }}
              title={
                <>
                  How <span className="text-[#7c8496]">{BRAND_NAME}</span> touches your data
                </>
              }
              description={
                <p className={cn(kineticSectionLeadClassName, "mx-auto max-w-2xl md:mx-0")}>
                  Logic runs on our servers; files stay in your drive. See how requests move from the browser to Google
                  Drive—without {BRAND_NAME} taking custody of your content.
                </p>
              }
              descriptionClassName=""
            />
          </div>
          <TrustDiagram />
        </section>

        <section
          className={cn(
            "relative mt-16 overflow-hidden rounded-none border-t border-white/[0.08] p-10 md:mt-20 md:p-14 lg:mt-24 lg:p-16",
            ctaBandBg,
          )}
          aria-labelledby="trust-cta-heading"
        >
          <div className="relative z-10 max-w-2xl">
            <h2
              id="trust-cta-heading"
              className={cn(
                labelFont,
                "mb-6 text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl",
              )}
            >
              Want the full security story?{" "}
              <br className="hidden sm:block" />
              <span className="text-[#72ff70]">Talk to our team.</span>
            </h2>
            <p
              className={cn(
                "mb-10 text-lg leading-relaxed text-[#7c8496] [font-family:var(--font-kinetic-body),system-ui,sans-serif]",
              )}
            >
              We can walk through architecture, compliance posture, and how metadata stays separate from your file bytes
              in Drive.
            </p>
            <LandingHeroPrimaryCtas />
          </div>
          <div
            className="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-[#006e16]/10 blur-[100px]"
            aria-hidden
          />
        </section>
      </main>

      <Footer />
    </div>
  )
}
