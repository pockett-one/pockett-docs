"use client"

import { Check, HelpCircle } from "lucide-react"
import { StdCTAButton } from "@/components/ui/StdCTAButton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { PRICING_PLANS, PRICING_COMPARISON } from "@/config/pricing"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { useState } from "react"
import { cn } from "@/lib/utils"
import type { PlanValue } from "@/config/pricing"

const PLAN_THEME_COLORS = {
    Standard: { bg: "bg-slate-50/80", check: "text-slate-500", border: "border-slate-200/80" },
    Pro: { bg: "bg-amber-50/90", check: "text-amber-600", border: "border-amber-200/80" },
    Business: { bg: "bg-blue-50/90", check: "text-blue-600", border: "border-blue-200/80" },
    Enterprise: { bg: "bg-purple-100", check: "text-purple-700", border: "border-purple-200" },
} as const

export default function PricingPage() {
    const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("annual")

    return (
        <div className="min-h-screen bg-white text-slate-900">
            <Header />

            {/* Spacer so content starts below the fixed main menu */}
            <div className="pt-[72px] sm:pt-[80px]" aria-hidden />

            {/* Content starts directly below main menu */}
            {/* Banner - no heavy strip; inline with content */}
            <section className="pt-1 pb-3">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-sm font-medium text-slate-600 antialiased">
                        Start with a 30-day free trial. No credit card required.
                    </p>
                </div>
            </section>

            {/* Billing Toggle - touch-friendly on mobile */}
            <section className="pt-2 pb-4 sm:pb-2">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
                    <div className="inline-flex bg-slate-100/80 rounded-lg p-1">
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
                        <button
                            onClick={() => setBillingPeriod("monthly")}
                            className={cn(
                                "min-h-[44px] px-5 sm:px-6 py-2.5 sm:py-2 text-sm font-medium rounded-md transition-colors",
                                billingPeriod === "monthly"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-500 hover:text-slate-800"
                            )}
                        >
                            Monthly
                        </button>
                    </div>
                </div>
            </section>

            {/* Plan cards: mobile/tablet only (stacked or 2-col) */}
            <section className="px-4 sm:px-6 lg:px-8 pb-6 lg:hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {PRICING_PLANS.map((plan) => {
                            const displayPrice =
                                billingPeriod === "annual" && plan.price && plan.price !== "Contact Us"
                                    ? `$${Math.round(parseInt(plan.price.replace("$", "")) * 0.84)}`
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
                                    {plan.projectsIncluded != null && !isEnterprise && (
                                        <p className="text-sm text-slate-500 mb-1">{plan.projectsIncluded} active projects</p>
                                    )}
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
                                            <p className={cn("text-sm", isEnterprise ? "text-purple-200" : "text-slate-500")}>sales@pockett.io</p>
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
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-w-0">
                    {/* Desktop: Plan column headers (5-col) - hidden on mobile/tablet */}
                    <div className="hidden lg:grid grid-cols-5 gap-0 border border-slate-200/80 rounded-t-xl overflow-hidden min-w-[640px]">
                        <div className="min-w-0" aria-hidden />
                        {PRICING_PLANS.map((plan) => {
                            const displayPrice =
                                billingPeriod === "annual" && plan.price && plan.price !== "Contact Us"
                                    ? `$${Math.round(parseInt(plan.price.replace("$", "")) * 0.84)}`
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
                                        {plan.projectsIncluded != null && !isEnterprise && (
                                            <p className="text-sm text-slate-500 mb-2">{plan.projectsIncluded} active projects</p>
                                        )}
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
                                                <p className={cn("text-sm mt-0.5", isEnterprise ? "text-purple-200" : "text-slate-500")}>sales@pockett.io</p>
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
                                                    <div className="col-span-1 min-w-[180px] sm:min-w-[200px] px-4 py-3 flex items-center gap-2 border-r border-slate-100 bg-slate-50/60 sticky left-0 z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.04)]">
                                                        <span className="text-sm text-slate-600">{row.feature}</span>
                                                        {row.tooltip && (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <span className="flex-shrink-0 cursor-help touch-manipulation">
                                                                        <HelpCircle className="h-4 w-4 text-slate-400 hover:text-slate-500" />
                                                                    </span>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="max-w-xs border-slate-200/80 bg-white px-3 py-2 text-slate-900 shadow-lg">
                                                                    <p className="text-sm text-slate-600">{row.tooltip}</p>
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
            <section className="py-10 sm:py-16 lg:py-24 bg-slate-50/70 border-t border-slate-200/60">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-8 sm:mb-12">
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
                            Frequently asked questions
                        </h2>
                    </div>

                    <div className="space-y-4 sm:space-y-6">
                        {[
                            {
                                q: "What counts as an \"active project\"?",
                                a: "An active project is any project that is not deleted or closed. You can have unlimited closed/deleted projects without counting toward your limit.",
                            },
                            {
                                q: "Can I add more projects?",
                                a: "Standard includes 10 active projects, Pro 25, Business 50, and Enterprise 100. Need more? Contact us for custom capacity.",
                            },
                            {
                                q: "Are there per-user charges?",
                                a: "No. All plans include unlimited members. Add as many team members, clients, and collaborators as you need without additional charges.",
                            },
                            {
                                q: "What happens if I exceed my project limit?",
                                a: "Your plan includes a set number of active projects (Standard 10, Pro 25, Business 50, Enterprise 100). You can close or archive projects to free up slots, or contact us to discuss higher capacity.",
                            },
                            {
                                q: "Can I upgrade or downgrade my plan?",
                                a: "Yes, you can upgrade or downgrade at any time. Changes are prorated, and you'll be charged or credited the difference.",
                            },
                            {
                                q: "Is there a free trial?",
                                a: "Yes! All plans include a 30-day free trial. No credit card required to start. Cancel anytime during the trial period.",
                            },
                        ].map((faq, i) => (
                            <div key={i} className="bg-white border border-slate-200/60 rounded-lg p-4 sm:p-6">
                                <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">{faq.q}</h3>
                                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}
