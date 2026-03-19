"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
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
    RotateCw,
    History,
    FileJson,
    Link as LinkIcon,
    Settings2,
    Briefcase,
    Archive,
    ScrollText,
    BadgeCheck,
    Cloud,
    Cable,
    Network,
    Radar,
    Vault,
    Folder,
    FileText,
    MoreHorizontal,
    Search,
    ChevronRight,
    Building2,
    LayoutGrid,
    Clock,
    Calendar,
    Eye,
    Globe,
    FileCheck,
    ArrowUpRight,
    Database,
    Unlock
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

    // Carousel State
    const [currentSlide, setCurrentSlide] = useState(0)

    // Enriched Slides Data (Combined with Workflow Content)
    const slides = [
        {
            id: 'link',
            label: 'Link',
            icon: Cable,
            colorClass: "bg-blue-50 border-blue-100 text-blue-600",
            subtitle: "Connect & Import",
            desc: "Connect your Google Drive securely. Import existing client documents directly into structured engagements."
        },
        {
            id: 'setup',
            label: 'Setup',
            icon: Network,
            colorClass: "bg-purple-50 border-purple-100 text-purple-600",
            subtitle: "Define Hierarchy",
            desc: "Organize chaos into structure: Organization > Engagement > Project. Map your messy drive to a taxonomy."
        },
        {
            id: 'manage',
            label: 'Manage',
            icon: Radar,
            colorClass: "bg-emerald-50 border-emerald-100 text-emerald-600",
            subtitle: "Active Lifecycle",
            desc: "Track every document's journey. From 'Client Upload' to 'Review' to 'Filed'—know exactly where files stand."
        },
        {
            id: 'audit',
            label: 'Audit',
            icon: Vault,
            colorClass: "bg-slate-50 border-slate-100 text-slate-600",
            subtitle: "Automated Close",
            desc: "One-click archival. Revoke access, lock files for editing, and generate immutable audit logs for compliance."
        },
    ]

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length)
        }, 6000)
        return () => clearInterval(timer)
    }, [])

    const handleSlideChange = (index: number) => {
        setCurrentSlide(index)
    }

    const openModal = (modalName: string) => setActiveModal(modalName)
    const closeModal = () => setActiveModal(null)

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
            <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-24">

                {/* Giant Background Typography */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none select-none z-0">
                    <h1 className="text-[10rem] lg:text-[18rem] font-black text-slate-100/80 tracking-tighter leading-none opacity-50 mix-blend-multiply blur-[1px]">
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
                                The Engagement Layer for <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-purple-700 to-purple-600">
                                    Google Drive.
                                </span>
                            </h2>
                        </FadeIn>

                        <FadeIn delay={200}>
                            <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
                                Built for Tax & Advisory.
                                <span className="text-slate-900 font-semibold"> Standardize </span> your folder structures by Engagement Year, enforce retention on filed returns, and audit every access—without leaving Drive.
                            </p>
                        </FadeIn>

                        <FadeIn delay={300}>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                                <Link href="/signup">
                                    <Button className="h-14 px-10 rounded-md bg-purple-900 hover:bg-black text-white text-lg font-bold shadow-2xl shadow-purple-900/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ring-4 ring-purple-50 ring-offset-0 border border-transparent">
                                        Start Free Trial
                                    </Button>
                                </Link>
                                <Link href="#how-it-works">
                                    <div className="h-14 px-10 rounded-md bg-white text-slate-900 text-lg font-bold border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center cursor-pointer group">
                                        <PlayCircle className="w-5 h-5 mr-2 stroke-[1.5] group-hover:text-purple-600 transition-colors" />
                                        See Process
                                    </div>
                                </Link>
                            </div>
                        </FadeIn>
                    </div>

                    {/* Central Floating Dashboard Visual (Carousel) */}
                    <FadeIn delay={500} direction="up" className="relative max-w-6xl mx-auto">
                        {/* Main Split Container */}
                        <div className="relative bg-white rounded-xl shadow-[0_40px_100px_-15px_rgba(88,28,135,0.15)] border border-slate-200 overflow-hidden flex flex-col md:flex-row h-[460px]">

                            {/* LEFT: Context & Content */}
                            <div className="w-full md:w-[35%] p-6 md:p-8 relative flex flex-col justify-center bg-white z-10 border-r border-slate-100 overflow-hidden">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentSlide}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                        className="absolute inset-0 flex flex-col justify-center px-8"
                                    >
                                        <div className={cn("w-16 h-16 rounded-lg border flex items-center justify-center mb-6 shadow-sm", slides[currentSlide].colorClass)}>
                                            <motion.div
                                                key={`icon-${currentSlide}`}
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ duration: 0.3, delay: 0.1 }}
                                            >
                                                {/* React.createElement workaround for Icon component */}
                                                {(() => {
                                                    const Icon = slides[currentSlide].icon
                                                    return <Icon className="w-8 h-8 stroke-[1.5]" />
                                                })()}
                                            </motion.div>
                                        </div>
                                        <h3 className="text-3xl font-bold text-slate-900 mb-2">{slides[currentSlide].label}</h3>
                                        <div className="text-xs font-bold text-purple-600 uppercase tracking-widest mb-4">{slides[currentSlide].subtitle}</div>
                                        <p className="text-slate-600 font-medium leading-relaxed relative z-10 text-lg">{slides[currentSlide].desc}</p>

                                        {/* Giant Shadow Number */}
                                        <div className="absolute -bottom-10 -right-0 text-[12rem] font-black text-slate-50 leading-none select-none -z-10 mix-blend-darken">
                                            {currentSlide + 1}
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* RIGHT: Visuals (Interactive Mock) */}
                            <div className="w-full md:w-[65%] bg-slate-50/50 relative overflow-hidden flex flex-col">
                                {/* Browser Header Visual */}
                                <div className="h-10 bg-white border-b border-slate-100 flex items-center px-4 gap-2 flex-shrink-0 relative z-20">
                                    <div className="flex gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                                    </div>
                                    <div className="ml-4 px-3 py-1 bg-slate-50 rounded text-[10px] font-semibold text-slate-400 flex items-center gap-2 border border-slate-100 w-64 shadow-sm">
                                        <LockKeyhole className="w-2.5 h-2.5 opacity-50" />
                                        app.pockett.io/workspace
                                    </div>
                                </div>

                                {/* Slide Content Area */}
                                <div className="flex-1 relative overflow-hidden">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={currentSlide}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.4, ease: "easeOut" }}
                                            className="absolute inset-0 p-8 md:p-12 flex items-center justify-center"
                                        >
                                            {currentSlide === 0 && (
                                                <div className="w-full max-w-lg bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden">
                                                    <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-slate-200">
                                                                <Cloud className="w-4 h-4 text-slate-500" />
                                                            </div>
                                                            <div className="font-bold text-slate-700 text-sm">Select Folders & Files from Google Drive</div>
                                                        </div>
                                                        <Search className="w-4 h-4 text-slate-400" />
                                                    </div>
                                                    <div className="p-2">
                                                        <div className="flex flex-col gap-1">
                                                            {/* Expanded Parent Folder */}
                                                            <div className="flex items-center gap-2 p-2 rounded hover:bg-slate-50 text-slate-400">
                                                                <ChevronDown className="w-4 h-4" />
                                                                <Folder className="w-5 h-5 fill-slate-200" />
                                                                <span className="text-sm font-medium text-slate-600">Acme Corp - 2024</span>
                                                            </div>

                                                            {/* Files Inside */}
                                                            {[
                                                                { name: "1040_Return_Final.pdf", type: "pdf", selected: true },
                                                                { name: "Q4_Financials.xlsx", type: "xlsx", selected: true },
                                                                { name: "Invoices_Aug.pdf", type: "pdf", selected: true },
                                                                { name: "K1_Schedules.pdf", type: "pdf", selected: false }
                                                            ].map((file, i) => (
                                                                <div key={i} className={cn("flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ml-6", file.selected ? "bg-purple-50" : "hover:bg-slate-50")}>
                                                                    <div className={cn("w-4 h-4 rounded border flex items-center justify-center shrink-0", file.selected ? "bg-purple-600 border-purple-600" : "border-slate-300")}>
                                                                        {file.selected && <Check className="w-3 h-3 text-white" />}
                                                                    </div>
                                                                    {file.type === 'pdf' ? <FileText className={cn("w-4 h-4", file.selected ? "text-purple-500" : "text-slate-400")} /> :
                                                                        <div className="w-4 h-4 bg-green-100 rounded flex items-center justify-center text-green-700 text-[8px] font-bold">X</div>}
                                                                    <span className={cn("text-xs font-medium truncate", file.selected ? "text-purple-900" : "text-slate-600")}>{file.name}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="bg-slate-50 border-t border-slate-100 p-3 flex justify-end gap-2">
                                                        <Button variant="ghost" size="sm" className="h-8 text-xs">Cancel</Button>
                                                        <Button size="sm" className="h-8 text-xs bg-purple-600 hover:bg-purple-700">Import Selected (3)</Button>
                                                    </div>
                                                </div>
                                            )}

                                            {currentSlide === 1 && (
                                                <div className="grid grid-cols-12 gap-8 w-full h-full items-center">
                                                    <div className="col-span-5 border-r border-slate-200 pr-4 h-[200px]">
                                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 pl-2">Structure</div>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2 px-2 py-1.5 bg-purple-50 text-purple-700 rounded text-sm font-bold">
                                                                <Building2 className="w-4 h-4" /> My Organization
                                                            </div>
                                                            <div className="pl-6 space-y-1">
                                                                <div className="flex items-center gap-2 px-2 py-1.5 text-slate-600 rounded text-sm hover:bg-slate-50">
                                                                    <ChevronDown className="w-3 h-3" /> Acme Corp
                                                                </div>
                                                                <div className="pl-6 space-y-1 border-l border-slate-200 ml-2">
                                                                    <div className="flex items-center gap-2 px-2 py-1 text-purple-600 font-medium text-sm bg-white border border-slate-100 shadow-sm rounded">
                                                                        <Briefcase className="w-3 h-3" /> Audit 2024
                                                                    </div>
                                                                    <div className="flex items-center gap-2 px-2 py-1 text-slate-500 text-sm">
                                                                        <Briefcase className="w-3 h-3" /> Tax Prep 2024
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2 px-2 py-1.5 text-slate-600 rounded text-sm hover:bg-slate-50 mt-2">
                                                                    <ChevronRight className="w-3 h-3" /> Stark Industries
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-span-7">
                                                        <div className="bg-white border focus-within:ring-2 ring-purple-100 border-slate-200 rounded-lg p-6 shadow-xl">
                                                            <div className="mb-4">
                                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Project Name</label>
                                                                <div className="text-lg font-bold text-slate-900">Audit 2024</div>
                                                            </div>
                                                            <div className="mb-4">
                                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Client</label>
                                                                <div className="flex items-center gap-2 text-sm text-slate-700 font-medium bg-slate-50 p-2 rounded border border-slate-100">
                                                                    <UsersRound className="w-4 h-4" /> Acme Corp
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="p-3 rounded border border-purple-100 bg-purple-50/50">
                                                                    <div className="text-xs text-purple-600 font-bold mb-1">Type</div>
                                                                    <div className="text-xs font-medium truncate">Audit & Assurance</div>
                                                                </div>
                                                                <div className="p-3 rounded border border-slate-200 bg-slate-50">
                                                                    <div className="text-xs text-slate-500 font-bold mb-1">Retention</div>
                                                                    <div className="text-xs font-medium">7 Years</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {currentSlide === 2 && (
                                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xl max-w-sm w-full relative group hover:border-purple-200 transition-colors">
                                                    {/* Decoration */}
                                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-slate-200 rounded-t-xl" />

                                                    <div className="flex items-start gap-4 mb-6">
                                                        <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center text-red-600 border border-red-100 shrink-0">
                                                            <FileText className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tax Return</div>
                                                            <h3 className="font-bold text-slate-900 text-lg leading-tight mb-1">FY24 1040 - Smith.pdf</h3>
                                                            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                                                <Briefcase className="w-3 h-3" />
                                                                John Smith - Indiv Tax
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Lifecycle Status Visualization */}
                                                    <div className="relative pl-3 border-l-2 border-slate-100 space-y-5 py-1">
                                                        {/* Step 1: Uploaded */}
                                                        <div className="relative">
                                                            <div className="absolute -left-[19px] top-1 w-3 h-3 rounded-full bg-slate-200 border-2 border-white ring-1 ring-slate-100" />
                                                            <div className="text-xs text-slate-400 font-medium">Client Uploaded</div>
                                                        </div>
                                                        {/* Step 2: Prep */}
                                                        <div className="relative">
                                                            <div className="absolute -left-[19px] top-1 w-3 h-3 rounded-full bg-slate-200 border-2 border-white ring-1 ring-slate-100" />
                                                            <div className="text-xs text-slate-400 font-medium">Preparation</div>
                                                        </div>
                                                        {/* Step 3: Review (Active) */}
                                                        <div className="relative">
                                                            <div className="absolute -left-[19px] top-0 w-3 h-3 rounded-full bg-purple-600 border-2 border-white ring-2 ring-purple-100 shadow-[0_0_10px_rgba(147,51,234,0.5)] z-10" />
                                                            <div className="flex items-center justify-between">
                                                                <div className="text-sm font-bold text-purple-700">Internal Review</div>
                                                                <div className="text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Current</div>
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 mt-1">Assigned to: <span className="text-slate-600 font-medium">Sarah M. (Partner)</span></div>
                                                        </div>
                                                        {/* Step 4: Filed */}
                                                        <div className="relative opacity-50">
                                                            <div className="absolute -left-[19px] top-1 w-3 h-3 rounded-full bg-slate-100 border-2 border-white ring-1 ring-slate-50" />
                                                            <div className="text-xs text-slate-300 font-medium">Filed & Locked</div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                                                        <div className="flex -space-x-2">
                                                            <div className="w-7 h-7 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-indigo-700">JM</div>
                                                            <div className="w-7 h-7 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-emerald-700">SM</div>
                                                        </div>
                                                        <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-500 hover:text-purple-600 px-2">
                                                            View Details <ArrowUpRight className="w-3 h-3 ml-1" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {currentSlide === 3 && (
                                                <div className="space-y-4 max-w-xl w-full bg-white p-6 rounded-lg border border-slate-200 shadow-xl">
                                                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                                        <div>
                                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Project Audit Log</div>
                                                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                                                <Briefcase className="w-4 h-4 text-purple-600" />
                                                                Acme Corp - Audit 2024
                                                            </h3>
                                                        </div>
                                                        <div className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-mono rounded border border-slate-200">
                                                            ID: 992-ACME
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {[
                                                            { action: "FILE_UPLOADED", detail: "FY24 Financials.pdf", user: "Client Portal", time: "Oct 10, 09:42 AM" },
                                                            { action: "SHARED_EXT", detail: "Shared with external_auditor@firm.com", user: "John Smith (Admin)", time: "Oct 12, 02:15 PM" },
                                                            { action: "VIEWED", detail: "FY24 Financials.pdf", user: "external_auditor@firm.com", time: "Oct 12, 02:20 PM" },
                                                            { action: "PROJECT_LOCKED", detail: "Engagement marked as Closed", user: "System (Auto)", time: "Oct 15, 05:00 PM" },
                                                        ].map((log, i) => (
                                                            <div key={i} className="flex items-center justify-between p-3 rounded border border-slate-100 bg-white hover:bg-slate-50 text-sm group">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-purple-50 group-hover:border-purple-100 transition-colors">
                                                                        <FileCheck className="w-4 h-4 text-slate-500 group-hover:text-purple-600" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-bold text-slate-700 text-xs mb-0.5">{log.action}</div>
                                                                        <div className="text-slate-500 text-xs">{log.detail}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-xs font-medium text-slate-900">{log.user}</div>
                                                                    <div className="text-[10px] text-slate-400">{log.time}</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                {/* Navigation Tabs (Bottom of Right Panel) */}
                                <div className="h-12 bg-white border-t border-slate-100 flex divide-x divide-slate-100 relative z-30">
                                    {slides.map((slide, index) => {
                                        const isActive = currentSlide === index
                                        return (
                                            <button
                                                key={slide.id}
                                                onClick={() => handleSlideChange(index)}
                                                className={cn(
                                                    "flex-1 flex items-center justify-center gap-2 text-xs font-bold transition-all duration-300 relative",
                                                    isActive ? "text-purple-700 bg-purple-50/50" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                                )}
                                            >
                                                <div className={cn("w-2 h-2 rounded-full", isActive ? "bg-purple-600" : "bg-slate-300")} />
                                                {slide.label}
                                                {isActive && (
                                                    <motion.div
                                                        layoutId="activeTabIndicator"
                                                        className="absolute top-0 left-0 right-0 h-0.5 bg-purple-600"
                                                        transition={{ duration: 0.3 }}
                                                    />
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </FadeIn>

                </div>
            </section>

            {/* --- ARCHITECTURE & TRUST STRIP (Light/Motion Style) --- */}
            <section className="py-24 lg:py-32 bg-slate-50 relative overflow-hidden">
                {/* Subtle Background Decoration */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-50"></div>

                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <FadeIn className="text-center mb-16">
                        <div className="inline-flex items-center px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm mb-6">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Trust Architecture</span>
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-6">
                            Your Data. Your Drive. <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                                Zero Compromises.
                            </span>
                        </h2>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
                            We engineered a <span className="text-slate-900 font-bold underline decoration-purple-300 decoration-2 underline-offset-2">True Non-Custodial</span> architecture.
                            Pockett secures your workflows without ever holding the keys to your client data.
                        </p>
                    </FadeIn>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* 1. Data Sovereignty */}
                        <FadeIn delay={100} className="h-full">
                            <div className="bg-white p-8 rounded-2xl h-full border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-700">
                                    <Database className="w-32 h-32 text-purple-600" />
                                </div>
                                <div className="w-14 h-14 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center mb-6 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                                    <Database className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">Data Sovereignty</h3>
                                <p className="text-slate-600 leading-relaxed font-medium">
                                    Your files actually stay in <strong className="text-slate-900">Your Google Drive</strong>.
                                    We simply manage the metadata via the official API.
                                    We never download or store your content.
                                </p>
                            </div>
                        </FadeIn>

                        {/* 2. No Lock-In */}
                        <FadeIn delay={200} className="h-full">
                            <div className="bg-white p-8 rounded-2xl h-full border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-700">
                                    <Unlock className="w-32 h-32 text-emerald-600" />
                                </div>
                                <div className="w-14 h-14 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-6 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                                    <Unlock className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">No Vendor Lock-In</h3>
                                <p className="text-slate-600 leading-relaxed font-medium">
                                    If you cancel, your files remain in your Drive, <strong className="text-slate-900">safe and organized</strong>.
                                    You retain full ownership of your folder structure. Zero migration required.
                                </p>
                            </div>
                        </FadeIn>

                        {/* 3. Audit Compliance (IRS Pub 4557) */}
                        <FadeIn delay={300} className="h-full">
                            <div className="bg-white p-8 rounded-2xl h-full border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-700">
                                    <ScrollText className="w-32 h-32 text-blue-600" />
                                </div>
                                <div className="w-14 h-14 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-6 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                                    <ScrollText className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">IRS Pub 4557 Ready</h3>
                                <p className="text-slate-600 leading-relaxed font-medium">
                                    Strengthen security with mandatory <strong className="text-slate-900">Access Logs</strong> and <strong className="text-slate-900">Data Disposal</strong> workflows.
                                    Generic Drive lacks the audit trails needed for compliance.
                                </p>
                            </div>
                        </FadeIn>
                    </div>
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
                                    Google Drive is Storage. <br />
                                    <span className="text-slate-300">Not Governance.</span>
                                </h2>
                                <p className="text-xl text-slate-600 font-medium leading-relaxed mb-10">
                                    Scale breaks manual processes. Without enforcement mechanisms, your firm faces training bottlenecks and silent compliance risks.
                                </p>
                                <Link href="/signup">
                                    <div className="inline-flex items-center text-lg font-bold text-slate-900 border-b-2 border-slate-900 pb-1 hover:text-purple-600 hover:border-purple-600 transition-colors cursor-pointer group">
                                        Automate Process Enforcement
                                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </Link>
                            </div>
                        </FadeIn>

                        <div className="space-y-6">
                            {[
                                { title: "Lack of Enforcement Mechanisms", desc: "Drive allows anyone to create or move folders anywhere. There are no guardrails to prevent a structured client index from becoming a nested mess.", icon: <Settings2 className="w-6 h-6 text-slate-900 stroke-1.5" /> },
                                { title: "High Staff Training Overhead", desc: "New hires must memorize complex naming conventions. One slip-up creates 'rogue files' that are impossible to find during an audit.", icon: <UsersRound className="w-6 h-6 text-slate-900 stroke-1.5" /> },
                                { title: "Silent Compliance Drift", desc: "Manual permissions don't expire. Client data often remains accessible to former staff or old partners simply because no one clicked 'Remove Access'.", icon: <LockKeyhole className="w-6 h-6 text-slate-900 stroke-1.5" /> },
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

            {/* --- PRICING MINI --- */}
            <section className="py-32 bg-white text-center">
                <div className="max-w-4xl mx-auto px-4">
                    <FadeIn>
                        <div className="inline-flex items-center px-4 py-1.5 bg-black text-white rounded-md text-xs font-bold tracking-widest uppercase mb-8 shadow-lg">
                            Simple Pricing
                        </div>
                        <h2 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter mb-10">
                            START FOR FREE. <br />
                            SCALE FOR PROCESS.
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
                                <div className="font-bold text-xl mb-4 text-white">Lifecycle</div>
                                <ul className="space-y-4 mb-8 flex-1">
                                    <li className="flex gap-3 text-slate-300 font-medium text-sm items-start"><Check className="w-5 h-5 text-purple-400 shrink-0" /> Automated Archival</li>
                                    <li className="flex gap-3 text-slate-300 font-medium text-sm items-start"><Check className="w-5 h-5 text-purple-400 shrink-0" /> Bulk Offboarding</li>
                                    <li className="flex gap-3 text-slate-300 font-medium text-sm items-start"><Check className="w-5 h-5 text-purple-400 shrink-0" /> Compliance Logs</li>
                                </ul>
                                <Link href="/contact" className="mt-auto">
                                    <Button className="w-full rounded-md font-bold bg-white text-slate-900 hover:bg-purple-50 transition-colors border-none h-12">Contact Us</Button>
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
