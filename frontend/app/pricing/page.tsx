"use client"

import { Check, HelpCircle } from "lucide-react"
import { PricingCTAButton } from "@/components/pricing/PricingCTAButton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { PRICING_PLANS } from "@/config/pricing"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { useState } from "react"
import { cn } from "@/lib/utils"

export default function PricingPage() {
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly')

    return (
        <div className="min-h-screen bg-white text-gray-900">
            <Header />
            
            {/* Hero Section */}
            <section className="pt-16 pb-8 lg:pt-20 lg:pb-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-6">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-2 tracking-tight">
                            Simple, transparent pricing
                        </h1>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                            Choose the plan that fits your needs. Standard includes 10 active projects; Pro 25; Business 50; Enterprise 100.
                        </p>
                    </div>

                    {/* Billing Toggle */}
                    <div className="flex justify-center mb-6">
                        <div className="inline-flex bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setBillingPeriod('monthly')}
                                className={cn(
                                    "px-6 py-2 text-sm font-medium rounded-md transition-colors",
                                    billingPeriod === 'monthly'
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-600 hover:text-gray-900"
                                )}
                            >
                                Monthly billing
                            </button>
                            <button
                                onClick={() => setBillingPeriod('annual')}
                                className={cn(
                                    "px-6 py-2 text-sm font-medium rounded-md transition-colors relative",
                                    billingPeriod === 'annual'
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-600 hover:text-gray-900"
                                )}
                            >
                                Annual billing
                                <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                                    Save 16%
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="pb-20 lg:pb-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                        {PRICING_PLANS.map((plan) => {
                            const displayPrice = billingPeriod === 'annual' && plan.price 
                                ? `$${Math.round(parseInt(plan.price.replace('$', '')) * 0.84)}`
                                : plan.price

                            return (
                                <div
                                    key={plan.id}
                                    className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col h-full"
                                >
                                    {/* Top Section Tile - uniform height, slight gray */}
                                    <div className="bg-gray-100 rounded-xl p-3 mb-4 h-[200px] flex flex-col overflow-hidden">
                                        {/* Plan Title */}
                                        <h3 className="text-xl font-bold text-gray-900 mb-0.5 flex-shrink-0">
                                            {plan.title}
                                        </h3>
                                        {plan.projectsIncluded != null && (
                                            <p className="text-base font-semibold text-gray-900 mb-1.5 flex-shrink-0">
                                                {plan.projectsIncluded} active projects
                                            </p>
                                        )}

                                        {/* Description - flex-1 min-h-0 so price stays in view */}
                                        <p className="text-sm text-gray-600 mb-2 leading-relaxed flex-1 min-h-0 line-clamp-3">
                                            {plan.description}
                                        </p>

                                        {/* Price - flex-shrink-0 so never cut off */}
                                        {plan.price && plan.price !== 'Coming Soon' ? (
                                            <div className="flex-shrink-0">
                                                <div className="flex items-baseline gap-1.5">
                                                    <span className="text-4xl font-bold text-gray-900">
                                                        {displayPrice}
                                                    </span>
                                                    <span className="text-sm text-gray-500">
                                                        {plan.duration}
                                                    </span>
                                                </div>
                                                {billingPeriod === 'annual' && (
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        Billed annually
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="h-9 flex items-center flex-shrink-0">
                                                <span className="text-lg font-semibold text-gray-500">
                                                    Custom pricing
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* CTA - below tile, above Benefits. Pro: black; others: gray. Spreading hover from arrow. */}
                                    <div className="mb-4">
                                        {plan.launchingLater ? (
                                            <PricingCTAButton href="/contact" variant="gray">
                                                Launching later
                                            </PricingCTAButton>
                                        ) : plan.href && plan.cta ? (
                                            <PricingCTAButton href={`${plan.href}?plan=${encodeURIComponent(plan.id)}`} variant="black">
                                                {plan.cta}
                                            </PricingCTAButton>
                                        ) : (
                                            <PricingCTAButton href="/contact" variant="gray">
                                                Contact sales
                                            </PricingCTAButton>
                                        )}
                                    </div>

                                    {/* Benefits Header */}
                                    {plan.featuresHeader && (
                                        <p className="text-xs font-semibold text-gray-400 tracking-wider mb-4">
                                            {plan.featuresHeader}
                                        </p>
                                    )}

                                    {/* Benefits List */}
                                    <TooltipProvider delayDuration={0}>
                                        <ul className="space-y-3 mb-6 flex-1">
                                            {plan.features.map((feature, i) => (
                                                <li key={i} className="flex items-start gap-3">
                                                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-lime-600/40 bg-lime-400 mt-0.5">
                                                        <Check className="h-2.5 w-2.5 text-gray-900 stroke-[3]" strokeLinecap="round" strokeLinejoin="round" />
                                                    </span>
                                                    <div className="flex-1 flex items-start justify-between gap-3 min-w-0">
                                                        <span className="text-sm text-gray-700">
                                                            {feature.name}
                                                        </span>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <span className="flex-shrink-0 cursor-help mt-0.5">
                                                                    <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
                                                                </span>
                                                            </TooltipTrigger>
                                                            <TooltipContent className="max-w-xs border-gray-200 bg-white px-3 py-2 text-gray-900 shadow-lg">
                                                                <p className="text-sm text-gray-700">{feature.tooltip}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </TooltipProvider>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-16 lg:py-24 bg-gray-50 border-t border-gray-200">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
                            Frequently asked questions
                        </h2>
                    </div>

                    <div className="space-y-6">
                        {[
                            {
                                q: "What counts as an \"active project\"?",
                                a: "An active project is any project that is not deleted or closed. You can have unlimited closed/deleted projects without counting toward your limit."
                            },
                            {
                                q: "Can I add more projects?",
                                a: "Standard includes 10 active projects, Pro 25, Business 50, and Enterprise 100. Need more? Contact us for custom capacity."
                            },
                            {
                                q: "Are there per-user charges?",
                                a: "No. All plans include unlimited members. Add as many team members, clients, and collaborators as you need without additional charges."
                            },
                            {
                                q: "What happens if I exceed my project limit?",
                                a: "Your plan includes a set number of active projects (Standard 10, Pro 25, Business 50, Enterprise 100). You can close or archive projects to free up slots, or contact us to discuss higher capacity."
                            },
                            {
                                q: "Can I upgrade or downgrade my plan?",
                                a: "Yes, you can upgrade or downgrade at any time. Changes are prorated, and you'll be charged or credited the difference."
                            },
                            {
                                q: "Is there a free trial?",
                                a: "Yes! All plans include a 30-day free trial. No credit card required to start. Cancel anytime during the trial period."
                            }
                        ].map((faq, i) => (
                            <div key={i} className="bg-white border border-gray-200 rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    {faq.q}
                                </h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {faq.a}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}
