"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import {
    ShieldCheck,
    CircleCheckBig,
    LockKeyhole,
    PlayCircle,
    ArrowRight,
    FolderKanban,
    Activity,
    UsersRound,
    FileStack,
    ChevronDown,
    Check,
    TriangleAlert,
    RotateCw,
    History,
    FileJson
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { FAQModal } from "@/components/ui/faq-modal"
import { Modal } from "@/components/ui/modal"
import { PrivacyPolicy } from "@/components/legal/privacy-policy"
import { CookiePolicy } from "@/components/legal/cookie-policy"
import { TermsOfService } from "@/components/legal/terms-of-service"
import { Support } from "@/components/legal/support"
import { CookieConsent } from "@/components/ui/cookie-consent"
import { cn } from "@/lib/utils"

// --- SCROLL ANIMATION WRAPPER ---
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

export default function AccountingLandingPage() {
    const [activeModal, setActiveModal] = useState<string | null>(null)
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

    const openModal = (modalName: string) => setActiveModal(modalName)
    const closeModal = () => setActiveModal(null)

    const accountingFAQs = [
        {
            question: "Does Pockett replace Google Drive?",
            answer: "No. Pockett lives *inside* your Google Drive. It gives you the 'Admin Superpowers' that Google Drive lacks—like automated retention, bulk permission audits, and engagement lifecycle management—without moving your files."
        },
        {
            question: "Can I use this for client portals?",
            answer: "Pockett manages the *security* of your shared folders, ensuring links expire and only the right clients have access. It ensures your existing folder-based sharing is actually secure and compliant."
        },
        {
            question: "What happens if I cancel?",
            answer: "Your files stay exactly where they are in your Google Drive. You keep full ownership. You simply lose the automation engine that enforces retention and cleans up permissions."
        },
        {
            question: "Is Pockett SOC2 and HIPAA ready?",
            answer: "Yes. We are built for firms that handle sensitive financial and personal data. Our architecture is non-custodial, meaning we don't store your document contents, only metadata for organization."
        }
    ]

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

            <Header onOpenModal={openModal} />

            {/* --- HERO SECTION --- */}
            <section className="relative pt-32 pb-32 lg:pt-48 lg:pb-40">

                {/* Giant Background Typography */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none select-none z-0">
                    <h1 className="text-[12rem] lg:text-[22rem] font-black text-slate-100/80 tracking-tighter leading-none opacity-50 mix-blend-multiply blur-[1px]">
                        SECURE
                    </h1>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16 space-y-6">

                        <FadeIn delay={0}>
                            <div className="inline-flex items-center px-4 py-1.5 bg-black text-white rounded-md text-xs font-bold tracking-widest uppercase mb-4 shadow-xl shadow-purple-900/10">
                                <ShieldCheck className="w-3.5 h-3.5 mr-2 text-purple-400 stroke-2" />
                                For Accounting & Tax Firms
                            </div>
                        </FadeIn>

                        <FadeIn delay={100}>
                            <h2 className="text-5xl lg:text-7xl font-bold tracking-tighter text-slate-900 leading-[1.1]">
                                Client Data Security. <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-purple-700 to-purple-600">
                                    Zero Migration.
                                </span>
                            </h2>
                        </FadeIn>

                        <FadeIn delay={200}>
                            <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
                                The lifecycle engine that cleans up your Google Drive after tax season.
                                Automate retention and revoke access without moving a single file.
                            </p>
                        </FadeIn>

                        <FadeIn delay={300}>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                                <Link href="/signup">
                                    <Button className="h-14 px-10 rounded-md bg-purple-900 hover:bg-black text-white text-lg font-bold shadow-2xl shadow-purple-900/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ring-4 ring-purple-50 ring-offset-0 border border-transparent">
                                        Start Risk Audit
                                    </Button>
                                </Link>
                                <Link href="#how-it-works">
                                    <div className="h-14 px-10 rounded-md bg-white text-slate-900 text-lg font-bold border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center cursor-pointer group">
                                        <PlayCircle className="w-5 h-5 mr-2 stroke-[1.5] group-hover:text-purple-600 transition-colors" />
                                        See Workflow
                                    </div>
                                </Link>
                            </div>
                        </FadeIn>
                    </div>

                    {/* Central Floating Dashboard Visual */}
                    <FadeIn delay={500} direction="up" className="relative max-w-5xl mx-auto">
                        <div className="relative bg-white rounded-lg shadow-[0_40px_100px_-15px_rgba(88,28,135,0.15)] border border-slate-200 p-2 overflow-hidden transform hover:scale-[1.01] transition-transform duration-700">

                            {/* Mock Browser Interface */}
                            <div className="bg-slate-50/50 rounded-md border border-slate-100 overflow-hidden backdrop-blur-sm">
                                {/* Browser Header */}
                                <div className="h-10 bg-white border-b border-slate-100 flex items-center px-4 gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                                    </div>
                                    <div className="ml-4 px-3 py-1 bg-slate-50 rounded text-[10px] font-semibold text-slate-400 flex items-center gap-2 border border-slate-100 w-64 shadow-sm">
                                        <LockKeyhole className="w-2.5 h-2.5 opacity-50" />
                                        pockett.io/dash/insights
                                    </div>
                                </div>

                                {/* Dashboard Content */}
                                <div className="p-8 grid grid-cols-12 gap-8">
                                    {/* Sidebar */}
                                    <div className="col-span-3 space-y-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3 px-3 py-2 bg-purple-50 text-purple-700 rounded text-sm font-bold border border-purple-100 shadow-sm">
                                                <Activity className="w-4 h-4 stroke-2" />
                                                Risk Overview
                                            </div>
                                            <div className="flex items-center gap-3 px-3 py-2 text-slate-500 rounded text-sm font-medium hover:bg-slate-50 hover:text-slate-900 transition-colors group cursor-pointer">
                                                <FolderKanban className="w-4 h-4 stroke-[1.5] group-hover:text-purple-600 transition-colors" />
                                                Client Files
                                            </div>
                                            <div className="flex items-center gap-3 px-3 py-2 text-slate-500 rounded text-sm font-medium hover:bg-slate-50 hover:text-slate-900 transition-colors group cursor-pointer">
                                                <UsersRound className="w-4 h-4 stroke-[1.5] group-hover:text-purple-600 transition-colors" />
                                                Access Control
                                            </div>
                                        </div>
                                    </div>

                                    {/* Main Area */}
                                    <div className="col-span-9 space-y-6">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-xl font-bold text-slate-900">Tax Season Cleanup <span className="text-purple-400 font-normal ml-2">TY2024</span></h3>
                                            <div className="px-3 py-1 bg-white text-emerald-600 text-xs font-bold rounded border border-emerald-100 shadow-sm flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                Scan Complete
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden group hover:border-purple-200 transition-colors">
                                                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-transparent to-red-50 rounded-bl-full -mr-4 -mt-4" />
                                                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                                                    <FileStack className="w-3.5 h-3.5" />
                                                    Stale Files
                                                </div>
                                                <div className="text-3xl font-black text-slate-900 tabular-nums">4,281</div>
                                                <div className="text-xs text-red-600 font-bold mt-2 bg-red-50 inline-block px-1.5 py-0.5 rounded">Action Required</div>
                                            </div>
                                            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm group hover:border-purple-200 transition-colors">
                                                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                                                    <UsersRound className="w-3.5 h-3.5" />
                                                    Ext. Access
                                                </div>
                                                <div className="text-3xl font-black text-slate-900 tabular-nums">128</div>
                                                <div className="text-xs text-orange-600 font-bold mt-2 bg-orange-50 inline-block px-1.5 py-0.5 rounded">Contractors</div>
                                            </div>
                                            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm group hover:border-purple-200 transition-colors">
                                                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                                                    <FileJson className="w-3.5 h-3.5" />
                                                    Storage
                                                </div>
                                                <div className="text-3xl font-black text-slate-900 tabular-nums">1.2TB</div>
                                                <div className="text-xs text-emerald-600 font-bold mt-2 bg-emerald-50 inline-block px-1.5 py-0.5 rounded">Optimized</div>
                                            </div>
                                        </div>

                                        {/* Action List */}
                                        <div className="bg-slate-50 rounded-lg p-1 space-y-1">
                                            <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex items-center justify-between group hover:border-purple-200 transition-colors cursor-pointer">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-100 group-hover:text-purple-700 transition-colors shadow-inner">
                                                        <FolderKanban className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 text-sm">Archive Closed Engagements</div>
                                                        <div className="text-xs text-slate-500">Move 45 clients to 'Archive/2024'</div>
                                                    </div>
                                                </div>
                                                <Button size="sm" className="bg-slate-900 text-white hover:bg-purple-600 rounded text-xs px-4 transition-colors font-semibold">
                                                    Auto-Fix
                                                </Button>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>
                    </FadeIn>

                </div>
            </section>

            {/* --- FEATURE STRIP --- */}
            <section className="bg-black py-12 lg:py-16 text-white relative overflow-hidden border-t border-slate-800">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
                <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
                    {[
                        { label: "SOC2 Ready", icon: <ShieldCheck className="w-6 h-6 mb-3 text-purple-400 stroke-1.5" /> },
                        { label: "Google Verified", icon: <CircleCheckBig className="w-6 h-6 mb-3 text-white stroke-1.5" /> },
                        { label: "Non-Custodial", icon: <LockKeyhole className="w-6 h-6 mb-3 text-slate-400 stroke-1.5" /> },
                        { label: "Zero Migration", icon: <RotateCw className="w-6 h-6 mb-3 text-slate-400 stroke-1.5" /> }
                    ].map((item, i) => (
                        <FadeIn key={i} delay={i * 100} className="text-center group cursor-default">
                            <div className="flex flex-col items-center">
                                <div className="mb-2 transform group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                                <div className="font-bold tracking-tight text-lg text-slate-200 group-hover:text-white transition-colors">{item.label}</div>
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </section>

            {/* --- PROBLEM SECTION --- */}
            <section className="py-32 bg-white relative">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <FadeIn direction="up">
                            <div className="relative">
                                {/* Accent Line */}
                                <div className="absolute -left-6 top-2 bottom-2 w-1 bg-gradient-to-b from-purple-600 to-transparent rounded-full" />
                                <h2 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter mb-8 leading-none">
                                    THE TAX SEASON <br />
                                    <span className="text-slate-300">HANGOVER.</span>
                                </h2>
                                <p className="text-xl text-slate-600 font-medium leading-relaxed mb-10">
                                    Every year, your firm accumulates thousands of files and temporary permissions.
                                    Ignoring them creates a compliance time-bomb.
                                </p>
                                <Link href="/signup">
                                    <div className="inline-flex items-center text-lg font-bold text-slate-900 border-b-2 border-slate-900 pb-1 hover:text-purple-600 hover:border-purple-600 transition-colors cursor-pointer group">
                                        Start Cleanup
                                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </Link>
                            </div>
                        </FadeIn>

                        <div className="space-y-6">
                            {[
                                { title: "Phantom Access", desc: "Contractors linked to sensitive PII post-season.", icon: <UsersRound className="w-6 h-6 text-slate-900 stroke-1.5" /> },
                                { title: "Retention Gaps", desc: "Files sitting in 'Active' folders forever.", icon: <History className="w-6 h-6 text-slate-900 stroke-1.5" /> },
                                { title: "Version Chaos", desc: "Multi-year 'Draft v2 Final' clutter.", icon: <FileStack className="w-6 h-6 text-slate-900 stroke-1.5" /> },
                            ].map((item, i) => (
                                <FadeIn key={i} delay={i * 100} className="block">
                                    <div className="flex items-start gap-6 p-8 rounded-lg bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-purple-900/5 hover:border-purple-100 transition-all duration-300 group">
                                        <div className="w-14 h-14 rounded-md bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:border-purple-200 transition-all">
                                            {item.icon}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-purple-700 transition-colors">{item.title}</h3>
                                            <p className="text-slate-600 font-medium leading-relaxed">{item.desc}</p>
                                        </div>
                                    </div>
                                </FadeIn>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* --- WORKFLOW SECTION --- */}
            <section id="how-it-works" className="py-32 bg-slate-50 border-t border-slate-200 relative overflow-hidden">
                {/* Decorative Grid Lines */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:6rem_4rem] opacity-30"></div>

                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <div className="text-center mb-20">
                        <FadeIn direction="up">
                            <div className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded mb-4 border border-purple-200">
                                <RotateCw className="w-3 h-3 mr-2 animate-spin-slow" />
                                Pockett Workflow
                            </div>
                            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter mb-6">3-STEP DETOX.</h2>
                            <p className="text-lg text-slate-600 font-medium max-w-2xl mx-auto">From chaos to compliance in less than 15 minutes.</p>
                        </FadeIn>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { step: "01", title: "Scan", desc: "Pockett maps your entire Drive structure, flagging stale clients & external links." },
                            { step: "02", title: "Review", desc: "Filters proactively suggest: 'Archive 45 closed engagements from 2023'." },
                            { step: "03", title: "Secure", desc: "One click moves files to Archive, locks to Read-Only, and resets permissions." }
                        ].map((item, i) => (
                            <FadeIn key={i} delay={i * 150} className="h-full">
                                <div className="bg-white p-10 rounded-lg shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-purple-900/10 hover:-translate-y-2 transition-all duration-500 group h-full relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <div className="text-[8rem] font-black text-purple-900 leading-none -mt-10 -mr-10 select-none">
                                            {item.step}
                                        </div>
                                    </div>
                                    <div className="text-6xl font-black text-slate-900/10 mb-6 group-hover:text-purple-600 transition-colors relative z-10">{item.step}</div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-4 relative z-10">{item.title}</h3>
                                    <p className="text-slate-600 font-medium leading-relaxed relative z-10">{item.desc}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- PRICING MINI --- */}
            <section className="py-32 bg-white text-center">
                <div className="max-w-4xl mx-auto px-4">
                    <FadeIn>
                        <div className="inline-flex items-center px-4 py-1.5 bg-black text-white rounded-md text-xs font-bold tracking-widest uppercase mb-8 shadow-lg">
                            Simple Pricing
                        </div>
                        <h2 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter mb-10">
                            SCAN FOR FREE. <br />
                            PAY FOR CONTROL.
                        </h2>
                    </FadeIn>

                    <div className="grid md:grid-cols-2 gap-8 text-left max-w-3xl mx-auto">
                        <FadeIn delay={100} className="h-full">
                            <div className="p-8 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors h-full flex flex-col">
                                <div className="font-bold text-xl mb-4 text-slate-900">Insights (Free)</div>
                                <ul className="space-y-4 mb-8 flex-1">
                                    <li className="flex gap-3 text-slate-600 font-medium text-sm items-start"><Check className="w-5 h-5 text-slate-400 shrink-0" /> Stale File Report</li>
                                    <li className="flex gap-3 text-slate-600 font-medium text-sm items-start"><Check className="w-5 h-5 text-slate-400 shrink-0" /> External Access Scan</li>
                                    <li className="flex gap-3 text-slate-600 font-medium text-sm items-start"><Check className="w-5 h-5 text-slate-400 shrink-0" /> Storage Analytics</li>
                                </ul>
                                <Link href="/signup" className="mt-auto">
                                    <Button variant="outline" className="w-full rounded-md font-bold border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white transition-all h-12">Start Free Scan</Button>
                                </Link>
                            </div>
                        </FadeIn>

                        <FadeIn delay={200} className="h-full">
                            <div className="p-8 rounded-lg bg-slate-900 text-white shadow-2xl shadow-purple-900/20 relative overflow-hidden group border border-slate-800 h-full flex flex-col">
                                <div className="absolute top-0 right-0 bg-purple-600 text-xs font-bold px-3 py-1 rounded-bl-lg text-white">POPULAR</div>
                                <div className="font-bold text-xl mb-4 text-white">Lifecycle ($99/mo)</div>
                                <ul className="space-y-4 mb-8 flex-1">
                                    <li className="flex gap-3 text-slate-300 font-medium text-sm items-start"><Check className="w-5 h-5 text-purple-400 shrink-0" /> Automated Archival</li>
                                    <li className="flex gap-3 text-slate-300 font-medium text-sm items-start"><Check className="w-5 h-5 text-purple-400 shrink-0" /> Bulk Offboarding</li>
                                    <li className="flex gap-3 text-slate-300 font-medium text-sm items-start"><Check className="w-5 h-5 text-purple-400 shrink-0" /> Compliance Logs</li>
                                </ul>
                                <Link href="/signup" className="mt-auto">
                                    <Button className="w-full rounded-md font-bold bg-white text-slate-900 hover:bg-purple-50 transition-colors border-none h-12">Get Started</Button>
                                </Link>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            <Footer onOpenModal={openModal} />

            {/* --- MODALS --- */}
            <FAQModal isOpen={activeModal === 'faqs'} onClose={closeModal} />
            <Modal isOpen={activeModal === 'privacy'} onClose={closeModal} title="Privacy Policy">
                <PrivacyPolicy />
            </Modal>
            <Modal isOpen={activeModal === 'cookies'} onClose={closeModal} title="Cookie Policy">
                <CookiePolicy />
            </Modal>
            <Modal isOpen={activeModal === 'terms'} onClose={closeModal} title="Terms of Service">
                <TermsOfService />
            </Modal>
            <Modal isOpen={activeModal === 'support'} onClose={closeModal} title="Support">
                <Support />
            </Modal>
            <CookieConsent />

        </div>
    )
}
