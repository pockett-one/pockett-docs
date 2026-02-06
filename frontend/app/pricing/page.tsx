"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight, Users, Zap, Building2, Shield, HelpCircle, Tag, Clock } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { PRICING_PLANS } from "@/config/pricing"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

// FadeIn component matching landing page
function FadeIn({
  children,
  delay = 0,
  className,
  direction = "up"
}: {
  children: React.ReactNode
  delay?: number
  className?: string
  direction?: "up" | "down" | "none"
}) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.1, rootMargin: "50px" }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const translations = {
    up: "translate-y-8",
    down: "-translate-y-8",
    none: ""
  }

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-1000 ease-out",
        isVisible ? "opacity-100 translate-y-0 transform-none" : `opacity-0 ${translations[direction]}`,
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-purple-500 selection:text-white overflow-hidden">
            {/* Background Ambience */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                {/* Dot Grid */}
                <div className="absolute inset-0 opacity-[0.4]"
                  style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
                </div>
                {/* Subtle Purple Haze */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-100/40 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-slate-100/50 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />
            </div>

            <Header />
            
            {/* Hero Section */}
            <section className="relative pt-32 pb-12 lg:pt-28 lg:pb-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-10 space-y-4">
                        <FadeIn delay={0}>
                            <div className="inline-flex items-center px-4 py-1.5 bg-black text-white rounded-md text-xs font-bold tracking-widest uppercase mb-3 shadow-xl shadow-purple-900/10">
                                <Tag className="w-3.5 h-3.5 mr-2 text-purple-400 stroke-2" />
                                Simple, Transparent Pricing
                            </div>
                        </FadeIn>

                        <FadeIn delay={100}>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-slate-900 leading-[1.1] mb-4">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-purple-700 to-purple-600">
                                    Stop Wasting Time. <br />
                                    Stop Frustrating Clients. <br />
                                    Stop Risking Your Reputation.
                                </span>
                            </h1>
                        </FadeIn>

                        <FadeIn delay={200}>
                            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed mb-3">
                                Replace unprofessional Drive links with a branded portal. Protect your IP. Eliminate permission chaos. See what clients reviewed. Works with your existing Google Drive - no migration or relearning needed. Capacity-based pricing starting at $49/month.
                            </p>
                        </FadeIn>

                        <FadeIn delay={300}>
                            <p className="text-sm text-slate-500 font-medium tracking-wide">
                                All plans include 10 active projects • Add 10-project packs as you grow
                            </p>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* Pricing Cards - 2x2 Grid */}
            <section className="py-12 px-4 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
                        {PRICING_PLANS.map((plan, index) => {
                            const IconComponent = 
                                plan.id === 'pro' ? Zap :
                                plan.id === 'pro-plus' ? Users :
                                plan.id === 'business' ? Building2 :
                                Shield

                            const iconColor = 
                                plan.id === 'pro' ? 'text-purple-600' :
                                plan.id === 'pro-plus' ? 'text-blue-600' :
                                plan.id === 'business' ? 'text-indigo-600' :
                                'text-purple-600'

                            const borderColor = 
                                plan.popular ? 'border-purple-300 hover:border-purple-400' :
                                plan.id === 'pro' ? 'border-slate-200 hover:border-purple-200' :
                                plan.id === 'business' ? 'border-slate-200 hover:border-indigo-200' :
                                'border-slate-200 hover:border-purple-200'

                            const bulletColor = 
                                plan.id === 'pro' ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]' :
                                plan.id === 'pro-plus' ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]' :
                                plan.id === 'business' ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]' :
                                'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]'

                            return (
                                <FadeIn key={plan.id} delay={100 + (index * 100)} className="h-full">
                                    <div className={`p-6 rounded-2xl bg-white border h-full flex flex-col group shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 relative overflow-hidden ${borderColor} ${plan.popular ? 'border-2' : ''}`}>
                                        {/* Popular Badge */}
                                        {plan.popular && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg z-20">
                                                Most Popular
                                            </div>
                                        )}

                                        {/* Icon & Title */}
                                        <div className="flex items-center gap-4 mb-3 relative z-10">
                                            <div className={`w-12 h-12 rounded-xl bg-white border flex items-center justify-center transition-colors duration-300 shadow-sm shrink-0 group-hover:scale-110 ${
                                                plan.popular 
                                                    ? 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200' 
                                                    : plan.id === 'pro' 
                                                        ? 'bg-purple-50 border-purple-100 group-hover:bg-purple-600 group-hover:text-white'
                                                        : plan.id === 'business'
                                                            ? 'bg-indigo-50 border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white'
                                                            : 'bg-purple-50 border-purple-100 group-hover:bg-purple-600 group-hover:text-white'
                                            }`}>
                                                <IconComponent className={`w-6 h-6 stroke-[1.5] ${iconColor} group-hover:text-white transition-colors`} />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-bold text-slate-900 leading-tight">{plan.title}</h3>
                                                <p className="text-sm text-slate-600 font-medium mt-0.5">{plan.description}</p>
                                            </div>
                                        </div>

                                        {/* Price */}
                                        {plan.price && plan.price !== 'Coming Soon' ? (
                                            <div className="mb-4 relative z-10">
                                                <div className="flex items-baseline gap-2 mb-1">
                                                    <span className="text-5xl font-black text-slate-900">{plan.price}</span>
                                                    <span className="text-lg text-slate-500 font-medium">{plan.duration}</span>
                                                </div>
                                                <p className="text-sm text-slate-500">per month</p>
                                            </div>
                                        ) : (
                                            <div className="mb-4 relative z-10">
                                                <div className="h-[64px] flex items-center">
                                                    <span className="text-2xl font-semibold text-slate-500">{plan.price || 'Custom Pricing'}</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Features Header */}
                                        {plan.featuresHeader && (
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 relative z-10">
                                                {plan.featuresHeader}
                                            </p>
                                        )}

                                        {/* Features List */}
                                        <ul className="space-y-2.5 mb-4 flex-1 relative z-10">
                                            {plan.features.map((feature, i) => (
                                                <li key={i} className="flex items-start gap-3">
                                                    <CheckCircle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${plan.popular ? 'text-green-500' : 'text-slate-400'}`} />
                                                    <TooltipProvider delayDuration={0}>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <span className="text-slate-700 text-sm cursor-help hover:text-slate-900 transition-colors font-medium flex items-center gap-1">
                                                                    {feature.name}
                                                                    <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                                                                </span>
                                                            </TooltipTrigger>
                                                            <TooltipContent className="max-w-xs">
                                                                <p className="text-sm">{feature.tooltip}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </li>
                                            ))}
                                        </ul>

                                        {/* CTA Button or Launching Later */}
                                        <div className="mt-auto pt-4 border-t border-slate-100 relative z-10">
                                            {plan.launchingLater ? (
                                                <div className="text-center py-3">
                                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                                                        <Clock className="w-4 h-4 text-amber-600" />
                                                        <p className="text-sm font-semibold text-amber-700">
                                                            Launching Later
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : plan.href && plan.cta ? (
                                                <Link href={plan.href} className="block w-full">
                                                    <Button className={`w-full rounded-xl font-bold h-12 text-base shadow-md hover:shadow-lg transition-all ${
                                                        plan.popular 
                                                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white' 
                                                            : plan.id === 'pro'
                                                                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                                                : plan.id === 'business'
                                                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                                                    : 'bg-slate-900 hover:bg-black text-white'
                                                    }`}>
                                                        {plan.cta}
                                                        <ArrowRight className="ml-2 h-5 w-5" />
                                                    </Button>
                                                </Link>
                                            ) : null}
                                        </div>
                                    </div>
                                </FadeIn>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-16 lg:py-20 bg-white relative overflow-hidden border-t border-slate-100">
                <div className="max-w-4xl mx-auto px-4 relative z-10">
                    <FadeIn className="text-center mb-12">
                        <div className="inline-flex items-center px-4 py-1.5 bg-black text-white rounded-md text-xs font-bold tracking-widest uppercase mb-4 shadow-xl shadow-purple-900/10">
                            <HelpCircle className="w-3.5 h-3.5 mr-2 text-purple-400 stroke-2" />
                            Frequently Asked Questions
                        </div>
                        <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mb-4">
                            Everything You Need to Know
                        </h2>
                    </FadeIn>

                    <div className="space-y-4">
                        {[
                            {
                                q: "What counts as an \"active project\"?",
                                a: "An active project is any project that is not deleted or closed. You can have unlimited closed/deleted projects without counting toward your limit."
                            },
                            {
                                q: "Can I add more projects?",
                                a: "Yes! All plans include 10 active projects. You can purchase additional 10-project packs at any time. Packs are prorated and billed monthly."
                            },
                            {
                                q: "Are there per-user charges?",
                                a: "No. All plans include unlimited members. Add as many team members, clients, and collaborators as you need without additional charges."
                            },
                            {
                                q: "What happens if I exceed my project limit?",
                                a: "You'll be prompted to purchase an additional 10-project pack. Existing projects remain accessible. You can also close or archive projects to free up slots."
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
                            <FadeIn key={i} delay={100 + (i * 50)}>
                                <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-purple-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500">
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">{faq.q}</h3>
                                    <p className="text-slate-600 font-medium leading-relaxed text-sm">
                                        {faq.a}
                                    </p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}
