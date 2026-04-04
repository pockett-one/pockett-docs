"use client"

import { Check, ChevronDown, ChevronRight, Gift, HelpCircle, Home } from "lucide-react"
import Link from "next/link"
import { StdCTAButton } from "@/components/ui/StdCTAButton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { PRICING_PLANS, PRICING_COMPARISON, planCardUsageSummary } from "@/config/pricing"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { useState } from "react"
import { cn } from "@/lib/utils"
import type { PlanValue } from "@/config/pricing"
import { platformEmail } from "@/config/platform-domain"
import { BRAND_NAME } from "@/config/brand"
import { EmailInline } from "@/components/ui/email-inline"
import { PLATFORM_SUPPORT_EMAIL } from "@/config/platform-emails"
import { MARKETING_PAGE_SHELL } from "@/lib/marketing/target-audience-nav"

const PLAN_THEME_COLORS = {
    Standard: { bg: "bg-slate-50/80", check: "text-slate-500", border: "border-slate-200/80" },
    Pro: { bg: "bg-amber-50/90", check: "text-amber-600", border: "border-amber-200/80" },
    Business: { bg: "bg-blue-50/90", check: "text-blue-600", border: "border-blue-200/80" },
    Enterprise: { bg: "bg-purple-100", check: "text-purple-700", border: "border-purple-200" },
} as const

export default function PricingPage() {
    const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly")
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

    const faqs = [
        {
            q: "What counts as an \"active engagement\"?",
            a: "An active engagement is any engagement that is not deleted or closed. You can have unlimited closed or deleted engagements without counting toward your limit. Each subscription covers one firm; the cap applies to that firm’s engagements.",
        },
        {
            q: "Can I add more engagements?",
            a: "Standard includes 10 active engagements per firm, Pro 25, Business 50, and Enterprise typically up to 100 (negotiated). Need more? Contact us for custom capacity.",
        },
        {
            q: "What if I need more than one firm?",
            a: "Standard, Pro, and Business each cover one firm workspace. For an additional legal entity or a completely separate firm, add another subscription—or talk to us about Enterprise for multiple firms under one agreement and consolidated billing.",
        },
        {
            q: "Are there per-user charges?",
            a: "No. All plans include unlimited members. Add as many team members, clients, and collaborators as you need without additional charges.",
        },
        {
            q: "What happens if I exceed my engagement limit?",
            a: "Your plan includes a set number of active engagements per firm (Standard 10, Pro 25, Business 50, Enterprise per contract). Close engagements you no longer need to free up slots, upgrade tiers, or contact us for higher capacity.",
        },
        {
            q: "Can I upgrade, downgrade or cancel my plan?",
            a: (
                <>
                    <span>
                        Yes. Plan changes and cancellations are managed in our Polar billing portal.
                        {"\n"}- Upgrade, downgrade, and cancellation options are shown based on your current
                        subscription and portal settings.
                        {"\n"}- Effective dates and billing adjustments are displayed in checkout/portal before you
                        confirm any change.
                        {"\n"}- If you need a billing exception, contact{" "}
                    </span>
                    <EmailInline email={PLATFORM_SUPPORT_EMAIL} className="mx-1" />
                    <span> and we’ll help review it.</span>
                </>
            ),
        },
        {
            q: "Is there a free trial?",
            a: `Yes. You can explore ${BRAND_NAME} with a limited sandbox account — no credit card required.\nWhen you're ready to unlock full features, you can start a 30-day trial of the Standard plan.\nCheckout requirements (including whether payment details are needed to start trial) are shown in Polar before confirmation, and you can manage your subscription from the billing portal.`,
        },
    ] as const

    return (
        <div className="min-h-screen bg-white text-slate-900">
            <Header />

            {/* Clear the fixed flush header (design1 nav); matches PublicPageLayout & other marketing pages */}
            <div className="pt-24 lg:pt-28" aria-hidden />

            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className={cn(MARKETING_PAGE_SHELL, "pb-4")}>
                <div className="flex items-center space-x-2 text-sm text-slate-500">
                    <Link href="/" className="hover:text-purple-600 transition-colors p-1 -ml-1 hover:bg-purple-50 rounded-md">
                        <Home className="h-4 w-4" />
                        <span className="sr-only">Home</span>
                    </Link>
                    <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" aria-hidden />
                    <span className="font-medium text-slate-900">Pricing</span>
                </div>
            </nav>

            {/* Content starts directly below main menu */}
            {/* Promo banner – free offer hook, high visibility */}
            <section className="pt-8 pb-10 sm:pt-12 sm:pb-14 overflow-visible">
                <div className={cn(MARKETING_PAGE_SHELL, "min-w-0")}>
                    <div className="mx-auto max-w-2xl">
                    <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-slate-50 border border-purple-100/80 shadow-sm shadow-purple-900/5 px-6 py-6 sm:px-8 sm:py-8 text-center">
                        <div className="inline-flex items-center gap-2 rounded-full bg-purple-100/90 text-purple-700 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide mb-4 sm:mb-5">
                            <Gift className="h-3.5 w-3.5" aria-hidden />
                            Free sandbox · No credit card required
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-2">
                            Start with a <span className="text-purple-700">free sandbox</span>
                        </h2>
                        <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-lg mx-auto">
                            Unlock full features with a <strong className="text-slate-800 font-semibold">30-day trial</strong> when you&apos;re ready.
                        </p>
                    </div>
                    </div>
                </div>
            </section>

            {/* Billing Toggle - touch-friendly on mobile */}
            <section className="pt-2 pb-4 sm:pb-2">
                <div className={cn(MARKETING_PAGE_SHELL, "flex justify-center")}>
                    <div className="inline-flex rounded-lg bg-slate-100/80 p-1">
                        <button
                            onClick={() => setBillingPeriod("monthly")}
                            className={cn(
                                "min-h-[44px] px-5 sm:px-6 py-2.5 sm:py-2 text-sm font-medium rounded-md transition-colors",
                                billingPeriod === "monthly"
                                    ? "bg-purple-700 text-white shadow-sm"
                                    : "text-slate-500 hover:text-slate-800"
                            )}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingPeriod("annual")}
                            className={cn(
                                "min-h-[44px] px-5 sm:px-6 py-2.5 sm:py-2 text-sm font-medium rounded-md transition-colors",
                                billingPeriod === "annual"
                                    ? "bg-purple-700 text-white shadow-sm"
                                    : "text-slate-500 hover:text-slate-800"
                            )}
                        >
                            Annually
                        </button>
                    </div>
                </div>
            </section>

            {/* Plan cards: mobile/tablet only (stacked or 2-col) */}
            <section className={cn(MARKETING_PAGE_SHELL, "pb-6 lg:hidden")}>
                <div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {PRICING_PLANS.map((plan) => {
                            const displayPrice =
                                billingPeriod === "annual" && plan.price && plan.price !== "Contact Us"
                                    ? plan.priceBilledAnnually != null
                                        ? `$${plan.priceBilledAnnually}`
                                        : `$${Math.round(parseInt(plan.price.replace("$", "")) * 0.84)}`
                                    : plan.price
                            const theme = PLAN_THEME_COLORS[plan.id as keyof typeof PLAN_THEME_COLORS] ?? PLAN_THEME_COLORS.Standard
                            const isEnterprise = plan.id === "Enterprise"
                            return (
                                <div
                                    key={plan.id}
                                    className={cn(
                                        "rounded-xl border border-slate-200/80 p-4 flex flex-col",
                                        isEnterprise ? "bg-purple-900 text-white border-purple-800" : theme.bg
                                    )}
                                >
                                    <h3 className={cn("text-lg font-bold", isEnterprise ? "text-white" : "text-gray-900")}>
                                        {plan.title}
                                    </h3>
                                    {planCardUsageSummary(plan).map((line, idx) => (
                                        <p
                                            key={idx}
                                            className={cn(
                                                "text-sm mb-0.5 last:mb-1",
                                                isEnterprise ? "text-purple-200/95" : "text-slate-500"
                                            )}
                                        >
                                            {line}
                                        </p>
                                    ))}
                                    {plan.price && plan.price !== "Contact Us" ? (
                                        <div className="min-h-[52px] flex flex-col justify-center mt-1">
                                            <div className="flex items-baseline gap-1">
                                                <span className={cn("text-2xl font-bold", isEnterprise ? "text-white" : "text-slate-900")}>
                                                    {displayPrice}
                                                </span>
                                                <span className={cn("text-sm", isEnterprise ? "text-purple-200" : "text-slate-500")}>
                                                    {plan.duration}
                                                </span>
                                            </div>
                                            {billingPeriod === "annual" ? (
                                                <p className={cn("text-xs mt-0.5", isEnterprise ? "text-purple-200" : "text-slate-500")}>
                                                    billed annually
                                                </p>
                                            ) : (
                                                <span className="text-xs mt-0.5 opacity-0 select-none" aria-hidden> </span>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="mt-1 min-h-[52px] flex flex-col justify-center">
                                            <p className={cn("text-base font-semibold", isEnterprise ? "text-white" : "text-slate-700")}>Custom</p>
                                            <p className={cn("text-sm", isEnterprise ? "text-purple-200" : "text-slate-500")}>{platformEmail("sales")}</p>
                                        </div>
                                    )}
                                    <div className="mt-4">
                                        <StdCTAButton
                                            href={`${plan.href}?plan=${encodeURIComponent(plan.id)}`}
                                            variant={isEnterprise ? "black" : (plan.ctaVariant ?? "black")}
                                        >
                                            {isEnterprise ? "Contact Sales" : plan.cta}
                                        </StdCTAButton>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* Plan columns + comparison table: desktop (lg+) and scrollable table on all */}
            <section className="pb-12 lg:pb-24">
                <div className={cn(MARKETING_PAGE_SHELL, "min-w-0")}>
                    {/* Desktop: Plan column headers (5-col) - hidden on mobile/tablet */}
                    <div className="hidden lg:grid grid-cols-5 gap-0 border border-slate-200/80 rounded-t-xl overflow-hidden min-w-[640px]">
                        <div className="min-w-0" aria-hidden />
                        {PRICING_PLANS.map((plan) => {
                            const displayPrice =
                                billingPeriod === "annual" && plan.price && plan.price !== "Contact Us"
                                    ? plan.priceBilledAnnually != null
                                        ? `$${plan.priceBilledAnnually}`
                                        : `$${Math.round(parseInt(plan.price.replace("$", "")) * 0.84)}`
                                    : plan.price
                            const theme = PLAN_THEME_COLORS[plan.id as keyof typeof PLAN_THEME_COLORS] ?? PLAN_THEME_COLORS.Standard
                            const isEnterprise = plan.id === "Enterprise"
                            return (
                                <div
                                    key={plan.id}
                                    className={cn(
                                        "p-4 sm:p-6 flex flex-col min-h-0",
                                        isEnterprise ? "bg-purple-900 text-white" : theme.bg
                                    )}
                                >
                                    <div className="flex-1 flex flex-col min-h-0">
                                        <h3 className={cn("text-lg font-bold mb-1", isEnterprise ? "text-white" : "text-slate-900")}>
                                            {plan.title}
                                        </h3>
                                        {planCardUsageSummary(plan).map((line, idx) => (
                                            <p
                                                key={idx}
                                                className={cn(
                                                    "text-sm mb-0.5 last:mb-2",
                                                    isEnterprise ? "text-purple-200/95" : "text-slate-500"
                                                )}
                                            >
                                                {line}
                                            </p>
                                        ))}
                                        {plan.price && plan.price !== "Contact Us" ? (
                                            <div className="min-h-[56px] flex flex-col justify-center">
                                                <div className="flex items-baseline gap-1">
                                                    <span className={cn("text-3xl font-bold", isEnterprise ? "text-white" : "text-slate-900")}>
                                                        {displayPrice}
                                                    </span>
                                                    <span className={cn("text-sm", isEnterprise ? "text-purple-200" : "text-slate-500")}>
                                                        {plan.duration}
                                                    </span>
                                                </div>
                                                {billingPeriod === "annual" ? (
                                                    <p className={cn("text-xs mt-0.5", isEnterprise ? "text-purple-200" : "text-slate-500")}>
                                                        billed annually
                                                    </p>
                                                ) : (
                                                    <span className="text-xs mt-0.5 opacity-0 select-none" aria-hidden> </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className={cn("min-h-[56px] flex flex-col justify-center", !isEnterprise && "mt-2")}>
                                                <p className={cn("text-lg font-semibold", isEnterprise ? "text-white" : "text-slate-700")}>Custom</p>
                                                <p className={cn("text-sm mt-0.5", isEnterprise ? "text-purple-200" : "text-slate-500")}>{platformEmail("sales")}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-4 flex-shrink-0">
                                        <StdCTAButton
                                            href={`${plan.href}?plan=${encodeURIComponent(plan.id)}`}
                                            variant={isEnterprise ? "black" : (plan.ctaVariant ?? "black")}
                                        >
                                            {isEnterprise ? "Contact Sales" : plan.cta}
                                        </StdCTAButton>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Feature comparison table - horizontal scroll on small screens, sticky first column */}
                    <div className="border border-t-0 lg:border-t border-slate-200/80 rounded-b-xl lg:rounded-t-none overflow-hidden">
                        <div className="overflow-x-auto -webkit-overflow-scrolling-touch" role="region" aria-label="Feature comparison">
                            <p className="lg:hidden text-xs text-slate-500 text-center py-2 px-4 bg-slate-50/80 border-b border-slate-100">
                                Scroll horizontally to compare plans
                            </p>
                            <div className="min-w-[640px]">
                                <TooltipProvider delayDuration={0}>
                                    {PRICING_COMPARISON.map((category) => (
                                        <div key={category.name}>
                                            <div className="bg-slate-100/80 px-4 py-2 border-b border-slate-200/60">
                                                <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
                                                    {category.name}
                                                </span>
                                            </div>
                                            {category.rows.map((row, rowIdx) => (
                                                <div
                                                    key={row.feature}
                                                    className={cn(
                                                        "grid grid-cols-5 gap-0 border-b border-slate-100",
                                                        rowIdx === category.rows.length - 1 && "border-b-0"
                                                    )}
                                                >
                                                    <div className="col-span-1 min-w-[180px] sm:min-w-[200px] px-4 py-3 flex items-center justify-between gap-2 border-r border-slate-100 bg-slate-50/60 sticky left-0 z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.04)]">
                                                        <span className="text-sm text-slate-600 min-w-0 break-words">{row.feature}</span>
                                                        {row.tooltip && (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <span className="flex-shrink-0 cursor-help touch-manipulation ml-1">
                                                                        <HelpCircle className="h-4 w-4 text-slate-400 hover:text-slate-500" />
                                                                    </span>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="max-w-md border-slate-200/80 bg-white px-3 py-2 text-slate-900 shadow-lg">
                                                                    <p className="text-sm text-slate-600 whitespace-pre-line">{row.tooltip}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                    </div>
                                                    {PRICING_PLANS.map((plan) => {
                                                        const value: PlanValue = row.values[plan.id] ?? false
                                                        const theme = PLAN_THEME_COLORS[plan.id as keyof typeof PLAN_THEME_COLORS] ?? PLAN_THEME_COLORS.Standard
                                                        const isEnterprise = plan.id === "Enterprise"
                                                        return (
                                                            <div
                                                                key={plan.id}
                                                                className={cn(
                                                                    "min-w-[100px] px-3 sm:px-4 py-3 flex items-center justify-center border-r border-slate-100 last:border-r-0",
                                                                    isEnterprise ? "bg-purple-50/50" : "bg-white"
                                                                )}
                                                            >
                                                                {value === true ? (
                                                                    <span className={cn("flex h-6 w-6 items-center justify-center rounded-full flex-shrink-0", isEnterprise ? "bg-purple-200 text-purple-800" : theme.check)}>
                                                                        <Check className="h-4 w-4 stroke-[2.5]" strokeLinecap="round" strokeLinejoin="round" />
                                                                    </span>
                                                                ) : value === false ? (
                                                                    <span className="text-slate-300">—</span>
                                                                ) : (
                                                                    <span className={cn("text-sm font-medium text-center", isEnterprise ? "text-purple-800" : "text-slate-600")}>
                                                                        {value}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </TooltipProvider>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="scroll-mt-32 border-t border-slate-200/60 bg-slate-50/70 py-10 sm:py-16 lg:py-24">
                <div className={MARKETING_PAGE_SHELL}>
                    <div className="mx-auto max-w-3xl">
                    <div className="text-center mb-8 sm:mb-12">
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-slate-200/70 px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm mb-4">
                            <HelpCircle className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                            FAQs
                        </div>
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-3 tracking-tight">
                            Frequently asked questions
                        </h2>
                        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto">
                            Quick answers about limits, billing, trials, and how subscriptions apply to firms.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200/70 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.06)] overflow-hidden">
                        {faqs.map((faq, i) => {
                            const open = openFaqIndex === i
                            return (
                                <div key={i} className={cn("border-t border-slate-200/60", i === 0 && "border-t-0")}>
                                    <button
                                        type="button"
                                        className={cn(
                                            "w-full text-left px-4 sm:px-6 py-4 sm:py-5",
                                            "hover:bg-slate-50/70 transition-colors",
                                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60 focus-visible:ring-offset-0"
                                        )}
                                        aria-expanded={open}
                                        aria-controls={`faq-panel-${i}`}
                                        onClick={() => setOpenFaqIndex(open ? null : i)}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <h3 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                                                    {faq.q}
                                                </h3>
                                            </div>
                                            <span
                                                className={cn(
                                                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200/70 bg-white text-slate-500",
                                                    "shadow-sm transition-transform duration-200",
                                                    open && "rotate-180"
                                                )}
                                                aria-hidden
                                            >
                                                <ChevronDown className="h-4 w-4" />
                                            </span>
                                        </div>
                                    </button>
                                    <div
                                        id={`faq-panel-${i}`}
                                        className={cn(
                                            "px-4 sm:px-6 pb-4 sm:pb-5",
                                            open ? "block" : "hidden"
                                        )}
                                    >
                                        <p className="text-sm sm:text-base text-slate-600 leading-relaxed whitespace-pre-line">
                                            {faq.a}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}
