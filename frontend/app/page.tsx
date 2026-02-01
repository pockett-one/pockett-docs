"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import CountUp from "react-countup"
import { motion, AnimatePresence } from "framer-motion"
import {
  ShieldCheck,
  Check,
  LockKeyhole,
  PlayCircle,
  ArrowRight,
  Briefcase,
  UsersRound,
  Users,
  AlertTriangle,
  Tag,
  ChevronDown,
  ChevronRight,
  FileText,
  Cloud,
  Search,
  Building2,
  ArrowUpRight,
  Database,
  Unlock,
  ScrollText,
  ClipboardList,
  Zap,
  BriefcaseBusiness,
  Gem,
  FolderLock,
  UserCheck,
  FileCheck,
  Clock,
  Cable,
  Network,
  Target,
  ShieldAlert,
  DollarSign,
  Share2,
  FileWarning,
  RefreshCw,
  Archive,
  Copy,
  Link2,
  Ghost,
  EyeOff,
  Siren,
  Hourglass,
  ScanEye,
  Handshake,
  Gavel,
  Lightbulb,
  Calendar,
  Repeat,
  Sparkles
} from "lucide-react"
import { GoogleDriveIcon } from "@/components/ui/google-drive-icon"
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
import { TrustCards } from "@/components/landing/trust-cards"
import { TrustDiagram } from "@/components/landing/trust-diagram"

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

export default function ConsultingLandingPage() {
  const [activeModal, setActiveModal] = useState<string | null>(null)

  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0)

  // Rotating Problem Statements (Headline + Subtext + Badge + Cards)
  const [currentProblem, setCurrentProblem] = useState(0)
  const problems = [
    {
      id: "zombie",
      headline: (
        <>
          The Project Ended 6 Months Ago. <br />
          <span className="text-slate-300">Why Do They Still Have Access?</span>
        </>
      ),
      subtext: "Manual sharing creates 'Zombie Links' that live forever. Without automated revocation, your Intellectual Property is leaking to former clients.",
      badge: { text: "Security Gap", icon: AlertTriangle },
      cards: [
        { title: "Ghost Access", desc: "Clients retain access months after the contract ends.", icon: <Ghost className="w-6 h-6 text-slate-900 stroke-1.5" /> },
        { title: "Zero Revocation", desc: "No way to 'pull back' sent files once they are downloaded.", icon: <Unlock className="w-6 h-6 text-slate-900 stroke-1.5" /> },
        { title: "Silent Leaks", desc: "Links forwarded to unauthorized 3rd parties without you knowing.", icon: <Share2 className="w-6 h-6 text-slate-900 stroke-1.5" /> },
      ]
    },
    {
      id: "competitor",
      headline: (
        <>
          You Sent the Source Files. <br />
          <span className="text-slate-300">Now They're on a Competitor's Drive.</span>
        </>
      ),
      subtext: "Once a file leaves your possession, you lose control. Clients unintentionally share your proprietary frameworks with the lowest bidder.",
      badge: { text: "Intellectual Property", icon: ShieldAlert },
      cards: [
        { title: "The 'Forward' Button", desc: "Your PDF is one click away from your competitor's inbox.", icon: <FileWarning className="w-6 h-6 text-slate-900 stroke-1.5" /> },
        { title: "Source Files", desc: "Giving away editable .ppt/.xls is giving away your trade secrets.", icon: <FileText className="w-6 h-6 text-slate-900 stroke-1.5" /> },
        { title: "No Watermark", desc: "Nothing stops them from rebranding your hard work as their own.", icon: <Copy className="w-6 h-6 text-slate-900 stroke-1.5" /> },
      ]
    },
    {
      id: "retainer",
      headline: (
        <>
          They Stopped Paying Retainer. <br />
          <span className="text-slate-300">Why Is Your Intellectual Property Still Working for Them?</span>
        </>
      ),
      subtext: "Your expertise shouldn't be a one-time download. Turn your intellectual property into a subscription, not a donation.",
      badge: { text: "Revenue Leak", icon: DollarSign },
      cards: [
        { title: "Free Consulting", desc: "They use your frameworks forever without paying you a dime.", icon: <Zap className="w-6 h-6 text-slate-900 stroke-1.5" /> },
        { title: "Scope Creep", desc: "Old files answer new questions for free. Stop the leakage.", icon: <ArrowUpRight className="w-6 h-6 text-slate-900 stroke-1.5" /> },
        { title: "Subscription Value", desc: "Shift from 'One-Time Deliverable' to 'Recurring Access'.", icon: <RefreshCw className="w-6 h-6 text-slate-900 stroke-1.5" /> },
      ]
    },
    {
      id: "professional",
      headline: (
        <>
          Delivering Premium Strategy <br />
          <span className="text-slate-300">in a "New Folder (2)" Feels Wrong.</span>
        </>
      ),
      subtext: "High-ticket clients expect a high-ticket experience. Stop sending messy Drive links and start delivering a professional portal.",
      badge: { text: "Brand Risk", icon: FileWarning }, // Reusing FileWarning as a placeholder for "Risk/Issue"
      cards: [
        { title: "The 'Zip File' Dump", desc: "Overwhelms clients and looks amateur. It dilutes your value.", icon: <Archive className="w-6 h-6 text-slate-900 stroke-1.5" /> },
        { title: "Version Chaos", desc: "Client is using 'Strategy_Final_v2_EDIT.pdf'. Risks errors.", icon: <Copy className="w-6 h-6 text-slate-900 stroke-1.5" /> },
        { title: "Broken Experience", desc: "High-ticket fees, low-budget delivery mechanisms.", icon: <Briefcase className="w-6 h-6 text-slate-900 stroke-1.5" /> },
      ]
    }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentProblem((prev) => (prev + 1) % problems.length)
    }, 6000) // Increased slightly for reading
    return () => clearInterval(timer)
  }, [])

  // Enriched Slides Data (Combined with Workflow Content)
  const slides = [
    {
      id: 'link',
      label: 'Link',
      icon: Cable,
      colorClass: "bg-blue-50 border-blue-100 text-blue-600",
      subtitle: "Connect & Select",
      desc: "Connect your specific Google Drive folders. Import existing client documents directly into structured engagements."
    },
    {
      id: 'setup',
      label: 'Setup',
      icon: Network,
      colorClass: "bg-purple-50 border-purple-100 text-purple-600",
      subtitle: "Project Context",
      desc: "Turn loose files into a professional Project. Map your messy drive folders to a clean Client → Project hierarchy."
    },
    {
      id: 'protect',
      label: 'Protect',
      icon: ShieldCheck,
      colorClass: "bg-indigo-50 border-indigo-100 text-indigo-600",
      subtitle: "Intellectual Property Shield",
      desc: "Share sensitive Intellectual Property with self-destruct timers. Tag internal frameworks as 'Never Share' to prevent accidental leaks."
    },
    {
      id: 'deliver',
      label: 'Deliver',
      icon: Gem,
      colorClass: "bg-fuchsia-50 border-fuchsia-100 text-fuchsia-600",
      subtitle: "White Glove",
      desc: "Deliver a branded, professional experience. No more 'Untitled Folder' links. Impress clients with a secure portal view."
    },
    {
      id: 'wrap',
      label: 'Wrap',
      icon: Check,
      colorClass: "bg-emerald-50 border-emerald-100 text-emerald-600",
      subtitle: "Project Close",
      desc: "One-click to lock a client folder to 'View Only'. Automatically package final deliverables and revoke access to drafts."
    },
    {
      id: 'audit',
      label: 'Audit',
      icon: UserCheck,
      colorClass: "bg-slate-50 border-slate-100 text-slate-600",
      subtitle: "The Mirror",
      desc: "Instantly see every external email that has access to your proprietary folders. Find stale links and orphaned files."
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
      <section className="relative pt-36 pb-20 lg:pt-32 lg:pb-24">

        {/* Giant Background Typography */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none select-none z-0">
          <h1 className="text-[10rem] lg:text-[10rem] font-black text-slate-100/80 tracking-tighter leading-none opacity-50 mix-blend-multiply blur-[1px]">
            PROFESSIONAL
          </h1>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 space-y-6">

            <FadeIn delay={0}>
              <div className="inline-flex items-center px-4 py-1.5 bg-black text-white rounded-md text-xs font-bold tracking-widest uppercase mb-4 shadow-xl shadow-purple-900/10">
                <BriefcaseBusiness className="w-3.5 h-3.5 mr-2 text-purple-400 stroke-2" />
                For Strategic Advisors & Process Consultants
              </div>
            </FadeIn>

            <FadeIn delay={100}>
              <h2 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tighter text-slate-900 leading-[1.1]">
                Turn Your{" "}
                <span className="inline-flex items-center gap-3 align-bottom">
                  <GoogleDriveIcon size={56} className="mb-2 w-10 h-10 md:w-[56px] md:h-[56px]" />
                  Google Drive
                </span>{" "}
                <br />
                into a Professional <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-purple-700 to-purple-600">
                  Client Portal.
                </span>
              </h2>
            </FadeIn>

            <FadeIn delay={150}>
              <div className="mt-8 mb-4 text-lg md:text-2xl font-bold tracking-tight flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
                <span className="text-purple-600">Consumer-Grade Ease</span>
                <span className="text-slate-300 font-light px-1 sm:px-2">|</span>
                <span className="text-slate-900">Institutional Trust</span>
                <span className="text-slate-300 font-light px-1 sm:px-2">|</span>
                <span className="text-slate-500">Frictionless Delivery</span>
              </div>
            </FadeIn>

            <FadeIn delay={200}>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
                Stop sending raw Drive links. Deliver work with a <span className="text-slate-900 font-semibold"> white-glove experience </span> that protects your Intellectual Property. Instantly revoke access when the project is done.
              </p>
            </FadeIn>

            <FadeIn delay={300}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                <Link href="/contact" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto h-14 px-10 rounded-md bg-purple-900 hover:bg-black text-white text-lg font-bold shadow-2xl shadow-purple-900/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ring-4 ring-purple-50 ring-offset-0 border border-transparent">
                    Build Your Portal
                  </Button>
                </Link>
                <Link href="/trust-center" className="w-full sm:w-auto">
                  <div className="w-full sm:w-auto h-14 px-10 rounded-md bg-white text-slate-900 text-lg font-bold border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center justify-center cursor-pointer group">
                    <ShieldCheck className="w-5 h-5 mr-2 stroke-[1.5] group-hover:text-purple-600 transition-colors" />
                    View Solution
                  </div>
                </Link>
              </div>
            </FadeIn>

            <FadeIn delay={400} className="mt-8">
              <p className="text-sm text-slate-500 font-medium tracking-wide">
                BUILT FOR STRATEGIC ADVISORS, FRACTIONAL EXECUTIVES & PROCESS CONSULTANTS
              </p>
            </FadeIn>
          </div>

          {/* Central Floating Dashboard Visual (Carousel) */}
          <FadeIn delay={500} direction="up" className="relative max-w-6xl mx-auto">
            {/* MOBILE: Static Stack (Lean Content) */}
            <div className="md:hidden space-y-4">
              {slides.map((slide, idx) => {
                const Icon = slide.icon
                return (
                  <div key={slide.id} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-12 h-12 rounded-lg border flex items-center justify-center shadow-sm shrink-0", slide.colorClass)}>
                        <Icon className="w-6 h-6 stroke-[1.5]" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{slide.label}</h3>
                        <div className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">{slide.subtitle}</div>
                      </div>
                    </div>
                    <p className="text-slate-600 font-medium leading-relaxed text-base">
                      {slide.desc}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* DESKTOP: Interactive Split Container */}
            <div className="hidden md:flex relative bg-white rounded-xl shadow-[0_40px_100px_-15px_rgba(88,28,135,0.15)] border border-slate-200 overflow-hidden flex-col md:flex-row h-[460px]">

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
                                <GoogleDriveIcon size={16} />
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
                                <FolderLock className="w-5 h-5 fill-slate-200" />
                                <span className="text-sm font-medium text-slate-600">My Strategy Practice</span>
                              </div>

                              {/* Files Inside */}
                              {[
                                { name: "Market_Analysis_vFinal.pdf", type: "pdf", selected: true },
                                { name: "Growth_Model.xlsx", type: "xlsx", selected: true },
                                { name: "Competitor_Review.deck", type: "deck", selected: true },
                                { name: "Meeting_Notes_Internal.docx", type: "docx", selected: false }
                              ].map((file, i) => (
                                <div key={i} className={cn("flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ml-6", file.selected ? "bg-purple-50" : "hover:bg-slate-50")}>
                                  <div className={cn("w-4 h-4 rounded border flex items-center justify-center shrink-0", file.selected ? "bg-purple-600 border-purple-600" : "border-slate-300")}>
                                    {file.selected && <Check className="w-3 h-3 text-white" />}
                                  </div>
                                  <FileText className={cn("w-4 h-4", file.selected ? "text-purple-500" : "text-slate-400")} />
                                  <span className={cn("text-xs font-medium truncate", file.selected ? "text-purple-900" : "text-slate-900")}>{file.name}</span>
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
                                <BriefcaseBusiness className="w-4 h-4" /> My Business
                              </div>
                              <div className="pl-6 space-y-1">
                                <div className="flex items-center gap-2 px-2 py-1.5 text-slate-600 rounded text-sm hover:bg-slate-50">
                                  <ChevronDown className="w-3 h-3" /> Acme Corp
                                </div>
                                <div className="pl-6 space-y-1 border-l border-slate-200 ml-2">
                                  <div className="flex items-center gap-2 px-2 py-1 text-purple-600 font-medium text-sm bg-white border border-slate-100 shadow-sm rounded">
                                    <Gem className="w-3 h-3" /> Acme Rebrand 2024
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="col-span-7">
                            <div className="bg-white border focus-within:ring-2 ring-purple-100 border-slate-200 rounded-lg p-6 shadow-xl">
                              <div className="mb-4">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Project Name</label>
                                <div className="text-lg font-bold text-slate-900">Acme Rebrand 2024</div>
                              </div>
                              <div className="mb-4">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Client</label>
                                <div className="flex items-center gap-2 text-sm text-slate-700 font-medium bg-slate-50 p-2 rounded border border-slate-100">
                                  <UsersRound className="w-4 h-4" /> Acme Corp
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {currentSlide === 2 && (
                        <div className="grid grid-cols-1 gap-4 w-full max-w-md">
                          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-md flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-50 rounded text-purple-600">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-slate-900">Pricing_Model_v3.xlsx</div>
                                <div className="text-xs text-slate-500">Sensitive IP</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100 mb-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Expires in 48h
                              </div>
                            </div>
                          </div>

                          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-md flex items-center justify-between opacity-75">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-slate-50 rounded text-slate-400">
                                <Briefcase className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-slate-900">Internal_Frameworks</div>
                                <div className="text-xs text-slate-500">Do Not Share Tag</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> Protected
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {currentSlide === 3 && (
                        <div className="w-full max-w-lg bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden">
                          <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-400" />
                              <div className="w-3 h-3 rounded-full bg-yellow-400" />
                              <div className="w-3 h-3 rounded-full bg-green-400" />
                            </div>
                            <div className="text-xs font-bold text-slate-400">CLIENT VIEW</div>
                          </div>
                          <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-600">
                              <Gem className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Acme Corp Portal</h3>
                            <p className="text-sm text-slate-500 mb-6">
                              Securely access your project deliverables below.
                            </p>
                            <div className="space-y-2 text-left">
                              <div className="p-3 border border-slate-200 rounded flex items-center gap-3 hover:bg-slate-50">
                                <FolderLock className="w-5 h-5 text-slate-400" />
                                <span className="text-sm font-medium text-slate-700">01 - Final Strategy [Read Only]</span>
                              </div>
                              <div className="p-3 border border-slate-200 rounded flex items-center gap-3 hover:bg-slate-50">
                                <FolderLock className="w-5 h-5 text-slate-400" />
                                <span className="text-sm font-medium text-slate-700">02 - Assets [Downloadable]</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {currentSlide === 4 && (
                        <div className="w-full max-w-sm bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden relative group">
                          <div className="h-2 bg-gradient-to-r from-purple-500 to-indigo-500" />
                          <div className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                              <div className="w-10 h-10 rounded bg-purple-50 flex items-center justify-center text-purple-600">
                                <Briefcase className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-400 uppercase">Active Engagement</div>
                                <h3 className="text-lg font-bold text-slate-900">Acme Rebrand 2024</h3>
                              </div>
                            </div>

                            <div className="space-y-3 mb-6">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600">Status</span>
                                <span className="font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">Active</span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600">Shared With</span>
                                <div className="flex -space-x-2">
                                  <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white text-[9px] flex items-center justify-center font-bold text-slate-500">AC</div>
                                  <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white text-[9px] flex items-center justify-center font-bold text-slate-500">JS</div>
                                </div>
                              </div>
                            </div>

                            <Button className="w-full bg-slate-900 hover:bg-black text-white gap-2 h-10">
                              <LockKeyhole className="w-4 h-4" />
                              Close & Archive Project
                            </Button>
                            <p className="text-[10px] text-center text-slate-400 mt-2">
                              Locks files, revokes external access, moves to Archive.
                            </p>
                          </div>
                        </div>
                      )}

                      {currentSlide === 5 && (
                        <div className="space-y-4 max-w-xl w-full bg-white p-6 rounded-lg border border-slate-200 shadow-xl">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Project Audit Log</div>
                              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-purple-600" />
                                Acme Rebrand 2024
                              </h3>
                            </div>
                            <div className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-mono rounded border border-slate-200">
                              ID: 402-ACME
                            </div>
                          </div>
                          <div className="space-y-2">
                            {[
                              { action: "FILE_UPLOADED", detail: "Market_Analysis_vFinal.pdf", user: "You", time: "Oct 10, 09:42 AM" },
                              { action: "STATUS_CHANGE", detail: "Growth_Model.xlsx moved to Internal Review", user: "You", time: "Oct 12, 02:15 PM" },
                              { action: "SHARED_EXT", detail: "Shared 'Final Strategy' with client@acmecorp.com", user: "You", time: "Oct 14, 10:00 AM" },
                              { action: "PROJECT_LOCKED", detail: "Project wrapped up. Access Revoked.", user: "System (Auto)", time: "Oct 28, 05:00 PM" },
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

        {/* --- HERO SAND DUNES (Daytime Mode) --- */}
        <div className="absolute inset-x-0 bottom-0 h-full w-full overflow-hidden pointer-events-none select-none z-0">
          {/* Back Layer - Broad & Tall */}
          <svg
            className="absolute bottom-0 left-0 w-full h-full text-purple-50 fill-current transform scale-105"
            preserveAspectRatio="none"
            viewBox="0 0 1440 320"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M0,192L60,197.3C120,203,240,213,360,208C480,203,600,181,720,176C840,171,960,181,1080,181.3C1200,181,1320,171,1380,165.3L1440,160L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z" />
          </svg>

          {/* Middle Layer - distinct offsets */}
          <svg
            className="absolute bottom-0 left-0 w-full h-[60%] text-purple-100/60 fill-current"
            preserveAspectRatio="none"
            viewBox="0 0 1440 320"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M0,128L80,138.7C160,149,320,171,480,165.3C640,160,800,128,960,122.7C1120,117,1280,139,1360,149.3L1440,160L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
          </svg>

          {/* Front Layer - Vibrant Accent */}
          <svg
            className="absolute -bottom-2 left-0 w-full h-[30%] text-purple-200/50 fill-current"
            preserveAspectRatio="none"
            viewBox="0 0 1440 320"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,250.7C960,235,1056,181,1152,165.3C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      </section>

      {/* --- ARCHITECTURE & TRUST STRIP (Light/Motion Style) --- */}
      <section id="how-it-works" className="py-24 lg:py-32 bg-purple-50/30 relative overflow-hidden">
        {/* Subtle Background Decoration */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f3e8ff_1px,transparent_1px),linear-gradient(to_bottom,#f3e8ff_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-50"></div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="mt-8 text-center max-w-4xl mx-auto mb-16 relative">

            <FadeIn>
              <div className="inline-flex items-center px-4 py-1.5 bg-black text-white rounded-md text-xs font-bold tracking-widest uppercase mb-6 shadow-xl shadow-purple-900/10">
                <ShieldCheck className="w-3.5 h-3.5 mr-2 text-purple-400 stroke-2" />
                Trust Architecture
              </div>
              <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-6">
                Your Business. <span className="inline-flex items-center gap-2 px-2"><GoogleDriveIcon size={32} /> Your Drive.</span> <br />
                Your Asset. <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Your Control.</span>
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed mb-4">
                Organize your files without holding them hostage. <span className="text-slate-900 font-bold underline decoration-purple-300 decoration-2 underline-offset-2">Non-Custodial Design</span> means if you leave Pockett, your folders stay exactly as they are.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm font-semibold text-emerald-700">
                <Check className="w-4 h-4 text-emerald-600" />
                Currently supports Google Drive
              </div>
            </FadeIn>
          </div>

          <div className="mb-16">
            <TrustCards />
          </div>

          {/* Storage Providers Roadmap */}
          <FadeIn delay={400} className="mb-12">
            <div className="bg-white rounded-xl p-5 lg:p-6 border border-slate-200 shadow-sm">
              <div className="text-center mb-4">
                <h3 className="text-lg lg:text-xl font-black text-slate-900 mb-1">
                  Storage Providers
                </h3>
                <p className="text-xs lg:text-sm text-slate-600">
                  Connect your existing storage. More providers coming soon.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 lg:gap-3">
                {/* Google Drive - Current */}
                <div className="flex items-center gap-2.5 lg:gap-3 p-2.5 lg:p-3 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-50/30 border border-emerald-200">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-white border border-emerald-200 flex items-center justify-center shadow-sm shrink-0">
                    <GoogleDriveIcon size={18} className="lg:w-5 lg:h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs lg:text-sm font-bold text-slate-800 truncate">Google Drive</p>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] lg:text-xs font-semibold rounded-full">
                      <Check className="w-2 h-2 lg:w-2.5 lg:h-2.5" />
                      Available
                    </span>
                  </div>
                </div>

                {/* OneDrive - Coming Soon */}
                <div className="flex items-center gap-2.5 lg:gap-3 p-2.5 lg:p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-50/30 border border-blue-100 opacity-75">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-white border border-blue-200 flex items-center justify-center shadow-sm shrink-0">
                    <svg className="w-4.5 h-4.5 lg:w-5 lg:h-5" width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10.0612 10.0071C4.63381 10.0072 0.576899 14.4499 0.271484 19.3991C0.46055 20.4655 1.08197 22.5713 2.05512 22.4632C3.27156 22.328 6.33519 22.4632 8.94828 17.7326C10.8571 14.2769 14.7838 10.007 10.0612 10.0071Z" fill="url(#paint0_radial_onedrive)"></path>
                      <path d="M8.80561 11.8538C6.98126 14.7423 4.52553 18.8811 3.69671 20.1836C2.71151 21.7317 0.102357 21.074 0.318506 18.8549C0.297198 19.0351 0.280832 19.2167 0.269548 19.3995C-0.0873823 25.173 4.49016 29.9676 10.1863 29.9676C16.4643 29.9676 31.4367 22.1455 29.9215 14.3081C28.3245 9.70109 23.8357 6.39673 18.7486 6.39673C13.6615 6.39673 10.4012 9.32752 8.80561 11.8538Z" fill="url(#paint1_radial_onedrive)"></path>
                      <path d="M10.0947 29.9703C10.0947 29.9703 25.0847 29.9998 27.6273 29.9998C32.2416 29.9998 35.75 26.2326 35.75 21.8368C35.75 17.4409 32.1712 13.6965 27.6274 13.6965C23.0835 13.6965 20.4668 17.0959 18.5015 20.8065C16.1984 25.1546 13.2606 29.9182 10.0947 29.9703Z" fill="url(#paint6_linear_onedrive)"></path>
                      <defs>
                        <radialGradient id="paint0_radial_onedrive" cx="0" cy="0" r="1" gradientTransform="matrix(7.1693 8.5904 -11.9745 14.6167 0.944588 11.3042)" gradientUnits="userSpaceOnUse"><stop stopColor="#4894FE"></stop><stop offset="0.695072" stopColor="#0934B3"></stop></radialGradient>
                        <radialGradient id="paint1_radial_onedrive" cx="0" cy="0" r="1" gradientTransform="matrix(-31.5168 36.3542 -27.7778 -22.3863 30.9814 -1.57881)" gradientUnits="userSpaceOnUse"><stop offset="0.165327" stopColor="#23C0FE"></stop><stop offset="0.534" stopColor="#1C91FF"></stop></radialGradient>
                        <linearGradient id="paint6_linear_onedrive" x1="22.9303" y1="29.9833" x2="22.9303" y2="13.8899" gradientUnits="userSpaceOnUse"><stop stopColor="#0086FF"></stop><stop offset="0.49" stopColor="#00BBFF"></stop></linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs lg:text-sm font-bold text-slate-800 truncate">OneDrive</p>
                    <span className="text-[10px] lg:text-xs font-semibold text-slate-500">Coming Soon</span>
                  </div>
                </div>

                {/* Dropbox - Coming Soon */}
                <div className="flex items-center gap-2.5 lg:gap-3 p-2.5 lg:p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-50/30 border border-blue-100 opacity-75">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-white border border-blue-200 flex items-center justify-center shadow-sm shrink-0">
                    <svg className="w-4.5 h-4.5 lg:w-5 lg:h-5" viewBox="0 0 30 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7.70076 0.320312L0.478516 4.91332L7.70076 9.50633L14.9242 4.91332L22.1465 9.50633L29.3687 4.91332L22.1465 0.320312L14.9242 4.91332L7.70076 0.320312Z" fill="#0061FE" />
                      <path d="M7.70076 18.6925L0.478516 14.0994L7.70076 9.50633L14.9242 14.0994L7.70076 18.6925Z" fill="#0061FE" />
                      <path d="M14.9242 14.0994L22.1465 9.50633L29.3687 14.0994L22.1465 18.6925L14.9242 14.0994Z" fill="#0061FE" />
                      <path d="M14.9242 24.8164L7.70077 20.2234L14.9242 15.6304L22.1465 20.2234L14.9242 24.8164Z" fill="#0061FE" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs lg:text-sm font-bold text-slate-800 truncate">Dropbox</p>
                    <span className="text-[10px] lg:text-xs font-semibold text-slate-500">Coming Soon</span>
                  </div>
                </div>

                {/* Box - Coming Soon */}
                <div className="flex items-center gap-2.5 lg:gap-3 p-2.5 lg:p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-50/30 border border-blue-100 opacity-75">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-white border border-blue-200 flex items-center justify-center shadow-sm shrink-0">
                    <svg className="w-4.5 h-4.5 lg:w-5 lg:h-5" viewBox="0 0 40 21.6">
                      <path d="M39.7 19.2c.5.7.4 1.6-.2 2.1-.7.5-1.7.4-2.2-.2l-3.5-4.5-3.4 4.4c-.5.7-1.5.7-2.2.2-.7-.5-.8-1.4-.3-2.1l4-5.2-4-5.2c-.5-.7-.3-1.7.3-2.2.7-.5 1.7-.3 2.2.3l3.4 4.5L37.3 7c.5-.7 1.4-.8 2.2-.3.7.5.7 1.5.2 2.2L35.8 14l3.9 5.2zm-18.2-.6c-2.6 0-4.7-2-4.7-4.6 0-2.5 2.1-4.6 4.7-4.6s4.7 2.1 4.7 4.6c-.1 2.6-2.2 4.6-4.7 4.6zm-13.8 0c-2.6 0-4.7-2-4.7-4.6 0-2.5 2.1-4.6 4.7-4.6s4.7 2.1 4.7 4.6c0 2.6-2.1 4.6-4.7 4.6zM21.5 6.4c-2.9 0-5.5 1.6-6.8 4-1.3-2.4-3.9-4-6.9-4-1.8 0-3.4.6-4.7 1.5V1.5C3.1.7 2.4 0 1.6 0 .7 0 0 .7 0 1.5v12.6c.1 4.2 3.5 7.5 7.7 7.5 3 0 5.6-1.7 6.9-4.1 1.3 2.4 3.9 4.1 6.8 4.1 4.3 0 7.8-3.4 7.8-7.7.1-4.1-3.4-7.5-7.7-7.5z" fill="#0061D5" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs lg:text-sm font-bold text-slate-800 truncate">Box</p>
                    <span className="text-[10px] lg:text-xs font-semibold text-slate-500">Coming Soon</span>
                  </div>
                </div>

                {/* Notion - Coming Soon */}
                <div className="flex items-center gap-2.5 lg:gap-3 p-2.5 lg:p-3 rounded-lg bg-gradient-to-br from-slate-50 to-slate-50/30 border border-slate-100 opacity-75">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm shrink-0">
                    <svg className="w-4.5 h-4.5 lg:w-5 lg:h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="3" width="18" height="18" rx="2" fill="#000"/>
                      <path d="M8 7h8M8 12h8M8 17h5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs lg:text-sm font-bold text-slate-800 truncate">Notion</p>
                    <span className="text-[10px] lg:text-xs font-semibold text-slate-500">Coming Soon</span>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          <div className="text-center">
            <FadeIn>
              <a
                href="/trust-center"
                className="inline-flex items-center px-8 py-4 bg-white text-slate-900 font-bold rounded-xl border border-slate-200 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/10 transition-all group"
              >
                <ShieldCheck className="w-5 h-5 mr-3 text-purple-600 group-hover:scale-110 transition-transform" />
                Visit Trust Center
                <ArrowRight className="w-4 h-4 ml-2 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </a>
            </FadeIn>
          </div>

        </div>
      </section>

      {/* --- WHO THIS IS FOR (New Section) --- */}
      {/* --- WHO THIS IS FOR (New Section) --- */}
      <section className="py-24 lg:py-32 bg-purple-50/30 relative overflow-hidden border-t border-purple-100">
        {/* Subtle Background Decoration */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f3e8ff_1px,transparent_1px),linear-gradient(to_bottom,#f3e8ff_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-50"></div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <FadeIn className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-1.5 bg-black text-white rounded-md text-xs font-bold tracking-widest uppercase mb-6 shadow-xl shadow-purple-900/10">
              <Users className="w-3.5 h-3.5 mr-2 text-purple-400 stroke-2" />
              Target Audience
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-6">
              Who Is <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Pockett Docs</span> For?
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
              Built for high-touch advisory firms who don’t just work in documents — <span className="text-slate-900 font-semibold">they deliver their value through them.</span>
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* 1. Strategic Advisors */}
            <FadeIn delay={100} className="h-full">
              <div className="p-6 rounded-2xl bg-white border border-slate-200 h-full flex flex-col group hover:border-purple-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 relative overflow-hidden">
                {/* Watermark */}
                <div className="absolute -top-6 -right-6 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-700 pointer-events-none">
                  <Target className="w-64 h-64 text-purple-600" />
                </div>

                <div className="flex items-center gap-5 mb-4 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300 shadow-sm shrink-0">
                    <Target className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 leading-tight">Strategy & Advisory Firms</h3>
                  </div>
                </div>

                <p className="text-slate-600 font-medium mb-4 text-lg leading-relaxed relative z-10">
                  Deliver insights, frameworks, and plans that drive decisions.
                </p>

                <ul className="space-y-3 mb-6 flex-1 relative z-10">
                  {[
                    "Management Consultancies",
                    "Executive Search Firms",
                    "Venture Studios",
                    "Policy Advisory Boards"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-base font-bold text-slate-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]" />
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-5 border-t border-slate-100 relative z-10">
                  <div className="flex justify-between items-baseline mb-3">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Workflow</div>
                    <p className="text-xs font-semibold text-slate-500 italic text-right">Bring clarity and control to every deliverable.</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold text-purple-900 bg-purple-50/80 p-3 rounded-xl border border-purple-100 shadow-sm overflow-x-auto whitespace-nowrap">
                    Create <span className="text-purple-300">→</span> Review <span className="text-purple-300">→</span> Share <span className="text-purple-300">→</span> Track
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* 2. Process Consultants */}
            <FadeIn delay={200} className="h-full relative overflow-visible">

              <div className="p-6 rounded-2xl bg-white border border-slate-200 h-full flex flex-col group hover:border-emerald-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 relative overflow-hidden">
                {/* Watermark */}
                <div className="absolute -top-6 -right-6 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-700 pointer-events-none">
                  <ClipboardList className="w-64 h-64 text-emerald-600" />
                </div>

                <div className="flex items-center gap-5 mb-4 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300 shadow-sm shrink-0">
                    <ClipboardList className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 leading-tight">Process & Implementation <br />Consultancies</h3>
                  </div>
                </div>

                <p className="text-slate-600 font-medium mb-4 text-lg leading-relaxed relative z-10">
                  Deliver SOPs, guides, and assessments that scale execution.
                </p>

                <ul className="space-y-3 mb-6 flex-1 relative z-10">
                  {[
                    "Agile Coaches & Transformation Leads",
                    "Corporate Training Agencies",
                    "Quality Assurance Auditors",
                    "Healthcare Implementation Groups"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-base font-bold text-slate-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-5 border-t border-slate-100 relative z-10">
                  <div className="flex justify-between items-baseline mb-3">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Workflow</div>
                    <p className="text-xs font-semibold text-slate-500 italic text-right">Scale your expertise without scaling your overhead.</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold text-emerald-900 bg-emerald-50/80 p-3 rounded-xl border border-emerald-100 shadow-sm overflow-x-auto whitespace-nowrap">
                    Template <span className="text-emerald-300">→</span> Tailor <span className="text-emerald-300">→</span> Deliver <span className="text-emerald-300">→</span> Iterate
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* --- USE CASES / PROJECT TYPES --- */}
      <section className="py-24 lg:py-32 bg-white relative overflow-hidden border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <FadeIn className="text-center mb-16">
            <div className="flex flex-col items-center gap-4 mb-8">
              <div className="inline-flex items-center px-4 py-1.5 bg-black text-white rounded-md text-xs font-bold tracking-widest uppercase shadow-xl shadow-purple-900/10">
                <Briefcase className="w-3.5 h-3.5 mr-2 text-purple-400 stroke-2" />
                Use Cases
              </div>
              <div className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full text-sm font-bold shadow-lg shadow-purple-500/30 animate-pulse">
                <Sparkles className="w-4 h-4" />
                Coming Soon
              </div>
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-6">
              Organize Work by <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Project Type</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
              Project types to organize work by engagement model, with templated files and workflows tailored to each use case.
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* 1. Engagement */}
            <FadeIn delay={100} className="h-full">
              <div className="p-6 rounded-2xl bg-white border border-slate-200 h-full flex flex-col group hover:border-purple-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 relative overflow-hidden">
                {/* Watermark */}
                <div className="absolute -top-6 -right-6 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-700 pointer-events-none">
                  <Handshake className="w-64 h-64 text-purple-600" />
                </div>

                <div className="flex items-center gap-5 mb-4 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300 shadow-sm shrink-0">
                    <Handshake className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 leading-tight">Engagement</h3>
                  </div>
                </div>

                <p className="text-slate-600 font-medium mb-4 text-lg leading-relaxed relative z-10">
                  Ongoing client work and continuous service delivery.
                </p>

                <ul className="space-y-3 mb-6 flex-1 relative z-10">
                  {["Monthly bookkeeping", "Retainer consulting", "Ongoing marketing"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-base font-bold text-slate-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>

            {/* 2. Case */}
            <FadeIn delay={150} className="h-full">
              <div className="p-6 rounded-2xl bg-white border border-slate-200 h-full flex flex-col group hover:border-blue-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 relative overflow-hidden">
                {/* Watermark */}
                <div className="absolute -top-6 -right-6 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-700 pointer-events-none">
                  <Gavel className="w-64 h-64 text-blue-600" />
                </div>

                <div className="flex items-center gap-5 mb-4 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm shrink-0">
                    <Gavel className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 leading-tight">Case</h3>
                  </div>
                </div>

                <p className="text-slate-600 font-medium mb-4 text-lg leading-relaxed relative z-10">
                  Specific matter or issue requiring focused attention.
                </p>

                <ul className="space-y-3 mb-6 flex-1 relative z-10">
                  {["Legal case", "Support ticket", "Investigation"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-base font-bold text-slate-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>

            {/* 3. Audit */}
            <FadeIn delay={200} className="h-full">
              <div className="p-6 rounded-2xl bg-white border border-slate-200 h-full flex flex-col group hover:border-emerald-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 relative overflow-hidden">
                {/* Watermark */}
                <div className="absolute -top-6 -right-6 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-700 pointer-events-none">
                  <ClipboardList className="w-64 h-64 text-emerald-600" />
                </div>

                <div className="flex items-center gap-5 mb-4 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300 shadow-sm shrink-0">
                    <ClipboardList className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 leading-tight">Audit</h3>
                  </div>
                </div>

                <p className="text-slate-600 font-medium mb-4 text-lg leading-relaxed relative z-10">
                  Review or compliance work with structured documentation.
                </p>

                <ul className="space-y-3 mb-6 flex-1 relative z-10">
                  {["Financial audit", "Security audit", "Compliance review"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-base font-bold text-slate-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>

            {/* 4. Consultation */}
            <FadeIn delay={250} className="h-full">
              <div className="p-6 rounded-2xl bg-white border border-slate-200 h-full flex flex-col group hover:border-amber-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 relative overflow-hidden">
                {/* Watermark */}
                <div className="absolute -top-6 -right-6 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-700 pointer-events-none">
                  <Lightbulb className="w-64 h-64 text-amber-600" />
                </div>

                <div className="flex items-center gap-5 mb-4 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300 shadow-sm shrink-0">
                    <Lightbulb className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 leading-tight">Consultation</h3>
                  </div>
                </div>

                <p className="text-slate-600 font-medium mb-4 text-lg leading-relaxed relative z-10">
                  One-time or short-term advisory engagement.
                </p>

                <ul className="space-y-3 mb-6 flex-1 relative z-10">
                  {["Strategy session", "Assessment", "Review"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-base font-bold text-slate-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>

            {/* 5. Project */}
            <FadeIn delay={300} className="h-full">
              <div className="p-6 rounded-2xl bg-white border border-slate-200 h-full flex flex-col group hover:border-indigo-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 relative overflow-hidden">
                {/* Watermark */}
                <div className="absolute -top-6 -right-6 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-700 pointer-events-none">
                  <BriefcaseBusiness className="w-64 h-64 text-indigo-600" />
                </div>

                <div className="flex items-center gap-5 mb-4 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 shadow-sm shrink-0">
                    <BriefcaseBusiness className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 leading-tight">Project</h3>
                  </div>
                </div>

                <p className="text-slate-600 font-medium mb-4 text-lg leading-relaxed relative z-10">
                  Time-bound deliverable with clear milestones.
                </p>

                <ul className="space-y-3 mb-6 flex-1 relative z-10">
                  {["Website redesign", "Campaign launch", "Implementation"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-base font-bold text-slate-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>

            {/* 6. Retainer */}
            <FadeIn delay={350} className="h-full">
              <div className="p-6 rounded-2xl bg-white border border-slate-200 h-full flex flex-col group hover:border-rose-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 relative overflow-hidden">
                {/* Watermark */}
                <div className="absolute -top-6 -right-6 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-700 pointer-events-none">
                  <Repeat className="w-64 h-64 text-rose-600" />
                </div>

                <div className="flex items-center gap-5 mb-4 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors duration-300 shadow-sm shrink-0">
                    <Repeat className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 leading-tight">Retainer</h3>
                  </div>
                </div>

                <p className="text-slate-600 font-medium mb-4 text-lg leading-relaxed relative z-10">
                  Ongoing service agreement with recurring deliverables.
                </p>

                <ul className="space-y-3 mb-6 flex-1 relative z-10">
                  {["Monthly retainer", "Quarterly review", "Annual service"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-base font-bold text-slate-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          </div>

          {/* Benefits Footer */}
          <FadeIn delay={400} className="mt-16">
            <div className="bg-white rounded-2xl p-8 lg:p-10 border-2 border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.06)] relative overflow-hidden">
              {/* Subtle background pattern */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#f8fafc_1px,transparent_1px),linear-gradient(to_bottom,#f8fafc_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-50"></div>
              
              <div className="relative z-10">
                <div className="text-center mb-8">
                  <h3 className="text-2xl lg:text-3xl font-black text-slate-900 mb-3">
                    Project Types Will Enable
                  </h3>
                  <p className="text-base text-slate-600 max-w-2xl mx-auto">
                    Organize, template, and track your work more effectively
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                  <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-gradient-to-br from-purple-50 to-purple-50/30 border border-purple-100 hover:border-purple-200 hover:shadow-md transition-all duration-300">
                    <div className="w-14 h-14 rounded-xl bg-purple-100 border-2 border-purple-200 flex items-center justify-center text-purple-600 shadow-sm">
                      <FolderLock className="w-7 h-7 stroke-[1.5]" />
                    </div>
                    <p className="text-sm font-bold text-slate-800 leading-tight text-center">Organize by engagement model</p>
                  </div>
                  
                  <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-gradient-to-br from-blue-50 to-blue-50/30 border border-blue-100 hover:border-blue-200 hover:shadow-md transition-all duration-300">
                    <div className="w-14 h-14 rounded-xl bg-blue-100 border-2 border-blue-200 flex items-center justify-center text-blue-600 shadow-sm">
                      <FileText className="w-7 h-7 stroke-[1.5]" />
                    </div>
                    <p className="text-sm font-bold text-slate-800 leading-tight text-center">Templated files in "+ Add" menu</p>
                  </div>
                  
                  <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-50/30 border border-emerald-100 hover:border-emerald-200 hover:shadow-md transition-all duration-300">
                    <div className="w-14 h-14 rounded-xl bg-emerald-100 border-2 border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm">
                      <Target className="w-7 h-7 stroke-[1.5]" />
                    </div>
                    <p className="text-sm font-bold text-slate-800 leading-tight text-center">Track metrics by type</p>
                  </div>
                  
                  <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-50/30 border border-indigo-100 hover:border-indigo-200 hover:shadow-md transition-all duration-300">
                    <div className="w-14 h-14 rounded-xl bg-indigo-100 border-2 border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm">
                      <Search className="w-7 h-7 stroke-[1.5]" />
                    </div>
                    <p className="text-sm font-bold text-slate-800 leading-tight text-center">Filter & report by category</p>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* --- PROBLEM SECTION --- */}
      {/* --- PROBLEM SECTION --- */}
      <section className="py-32 bg-purple-50/30 relative border-t border-purple-100">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f3e8ff_1px,transparent_1px),linear-gradient(to_bottom,#f3e8ff_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-50"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">

          {/* --- REALITY CHECK GRID (Consolidated Stats) --- */}
          <div className="mb-24">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <FadeIn>
                <div className="inline-flex items-center px-4 py-1.5 bg-black text-white rounded-md text-xs font-bold tracking-widest uppercase mb-6 shadow-xl shadow-purple-900/10">
                  <ShieldAlert className="w-3.5 h-3.5 mr-2 text-purple-400 stroke-2" />
                  Reality Check
                </div>
                <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-6">
                  The Hidden Cost of <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Chaos</span>
                </h2>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
                  Inefficient document workflows are quietly draining your margins and exposing your firm to unnecessary risk.
                </p>
              </FadeIn>
            </div>

            {/* 5-Item Organic Grid (Strict 3-Top, 2-Bottom) */}
            <div className="flex flex-col items-center gap-12 lg:gap-16">

              {/* Row 1: 3 Items */}
              <div className="flex flex-wrap justify-center gap-12 lg:gap-24 w-full">
                <FadeIn delay={100} className="w-full sm:w-auto flex justify-center">
                  <OrganicStat
                    icon={Link2}
                    val={23}
                    suffix="%"
                    label="Zombie Links"
                    desc="of shared links remain active 1yr post-contract."
                    bgColorClass="bg-purple-100"
                    iconColorClass="text-purple-600"
                    textColorClass="text-purple-600"
                  />
                </FadeIn>
                <FadeIn delay={200} className="w-full sm:w-auto flex justify-center">
                  <OrganicStat
                    icon={DollarSign}
                    val={65}
                    suffix="%"
                    label="Unpaid Usage"
                    desc="of consulting IP is reused without ongoing payment."
                    bgColorClass="bg-yellow-100"
                    iconColorClass="text-yellow-600"
                    textColorClass="text-yellow-600"
                  />
                </FadeIn>
                <FadeIn delay={300} className="w-full sm:w-auto flex justify-center">
                  <OrganicStat
                    icon={Siren}
                    val={31}
                    suffix="%"
                    label="Data Leakage"
                    desc="of client files are reshared to unauthorized emails."
                    bgColorClass="bg-red-100"
                    iconColorClass="text-red-500"
                    textColorClass="text-red-500"
                  />
                </FadeIn>
              </div>

              {/* Row 2: 2 Items Centered */}
              <div className="flex flex-wrap justify-center gap-12 lg:gap-24 w-full">
                <FadeIn delay={400} className="w-full sm:w-auto flex justify-center">
                  <OrganicStat
                    icon={Hourglass}
                    val={15}
                    suffix="h"
                    label="Lost Productivity"
                    desc="per week spent managing manual file permissions."
                    bgColorClass="bg-orange-100"
                    iconColorClass="text-orange-500"
                    textColorClass="text-orange-500"
                  />
                </FadeIn>
                <FadeIn delay={500} className="w-full sm:w-auto flex justify-center">
                  <OrganicStat
                    icon={ScanEye}
                    val={0}
                    suffix=""
                    label="Audit Trail"
                    desc="visibility into who is accessing your files right now."
                    bgColorClass="bg-blue-100"
                    iconColorClass="text-blue-400"
                    textColorClass="text-blue-500"
                  />
                </FadeIn>
              </div>

            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <FadeIn direction="up">
              <div className="relative">

                {/* Badge (Dynamic) */}
                <div className="h-14 mb-2 relative">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentProblem}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.3 }}
                      className="absolute top-0 left-0"
                    >
                      <div className="inline-flex items-center px-4 py-1.5 bg-black text-white rounded-md text-xs font-bold tracking-widest uppercase shadow-xl shadow-purple-900/10">
                        {(() => {
                          const BadgeIcon = problems[currentProblem].badge.icon
                          return <BadgeIcon className="w-3.5 h-3.5 mr-2 text-purple-400 stroke-2" />
                        })()}
                        {problems[currentProblem].badge.text}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Accent Line */}
                <div className="absolute -left-6 top-16 bottom-2 w-1 bg-gradient-to-b from-purple-600 to-transparent rounded-full" />

                <div className="min-h-[160px] mb-8 relative">
                  <AnimatePresence mode="wait">
                    <motion.h2
                      key={currentProblem}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.5 }}
                      className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter leading-none"
                    >
                      {problems[currentProblem].headline}
                    </motion.h2>
                  </AnimatePresence>
                </div>

                <div className="h-24 mb-10 relative">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={currentProblem}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      className="text-xl text-slate-600 font-medium leading-relaxed absolute top-0 left-0 w-full"
                    >
                      {problems[currentProblem].subtext}
                    </motion.p>
                  </AnimatePresence>
                </div>

                <Link href="/contact">
                  <div className="inline-flex items-center px-6 py-3 bg-[#5D2C91] text-white font-bold rounded-lg shadow-lg hover:bg-black hover:shadow-purple-500/25 transition-all cursor-pointer group">
                    Secure Your Firm&apos;s IP
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </div>
            </FadeIn>

            <div className="relative h-[420px] lg:h-[350px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentProblem}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 space-y-6"
                >
                  {problems[currentProblem].cards.map((item, i) => (
                    <div key={i} className="flex items-start gap-6 p-8 rounded-lg bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-purple-900/5 hover:border-purple-100 transition-all duration-300 group">
                      <div className="w-14 h-14 rounded-md bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:border-purple-200 transition-all">
                        {item.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-purple-700 transition-colors">{item.title}</h3>
                        <p className="text-slate-600 font-medium leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* --- PRICING MINI --- */}
      {/* --- PRICING MINI --- */}
      <section id="pricing" className="py-32 bg-purple-50/30 text-center relative border-t border-purple-100">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f3e8ff_1px,transparent_1px),linear-gradient(to_bottom,#f3e8ff_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-50"></div>
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <FadeIn>
            <div className="inline-flex items-center px-4 py-1.5 bg-black text-white rounded-md text-xs font-bold tracking-widest uppercase mb-8 shadow-xl shadow-purple-900/10">
              <Tag className="w-3.5 h-3.5 mr-2 text-purple-400 stroke-2" />
              Simple Pricing
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-8">
              Start for Free. <br />
              Scale Your Practice.
            </h2>
          </FadeIn>

          <div className="flex justify-center max-w-4xl mx-auto">
            <FadeIn delay={200} className="w-full">
              <div className="p-10 rounded-2xl bg-white text-slate-900 shadow-2xl shadow-purple-900/10 relative overflow-hidden group border-2 border-purple-100 flex flex-col hover:border-purple-200 transition-colors text-left">
                <div className="absolute top-0 right-0 bg-[#5D2C91] text-xs font-bold px-4 py-1.5 rounded-bl-xl text-white tracking-widest">
                  ALL-INCLUSIVE
                </div>

                <div className="mb-6">
                  <div className="font-black text-3xl text-slate-900 mb-2">Professional</div>
                  <div className="text-slate-500 font-medium">
                    <span className="text-slate-900 font-bold">30-Day Free Trial</span>, then monthly subscription.
                  </div>
                </div>

                <div className="h-px bg-slate-100 mb-8" />

                <ul className="grid md:grid-cols-2 gap-x-12 gap-y-6 mb-10 flex-1">
                  <li className="flex gap-4 text-slate-700 font-medium text-base items-start">
                    <div className="p-1 bg-purple-50 rounded text-purple-600 shrink-0 mt-0.5">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <span>
                      <strong className="text-slate-900">Google Drive Integration</strong> <br />
                      <span className="text-sm text-slate-500">Non-custodial, direct sync</span>
                    </span>
                  </li>
                  <li className="flex gap-4 text-slate-700 font-medium text-base items-start">
                    <div className="p-1 bg-purple-50 rounded text-purple-600 shrink-0 mt-0.5">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <span>
                      <strong className="text-slate-900">Detect Duplicates</strong> <br />
                      <span className="text-sm text-slate-500">Clean up near-duplicate files</span>
                    </span>
                  </li>
                  <li className="flex gap-4 text-slate-700 font-medium text-base items-start">
                    <div className="p-1 bg-purple-50 rounded text-purple-600 shrink-0 mt-0.5">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <span>
                      <strong className="text-slate-900">Professional Client Portals</strong> <br />
                      <span className="text-sm text-slate-500">White-glove delivery experience</span>
                    </span>
                  </li>
                  <li className="flex gap-4 text-slate-700 font-medium text-base items-start">
                    <div className="p-1 bg-purple-50 rounded text-purple-600 shrink-0 mt-0.5">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <span>
                      <strong className="text-slate-900">Identify Stale Documents</strong> <br />
                      <span className="text-sm text-slate-500">Find & archive old assets</span>
                    </span>
                  </li>
                  <li className="flex gap-4 text-slate-700 font-medium text-base items-start">
                    <div className="p-1 bg-purple-50 rounded text-purple-600 shrink-0 mt-0.5">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <span>
                      <strong className="text-slate-900">Intellectual Property Shield & Time-Bombs</strong> <br />
                      <span className="text-sm text-slate-500">Auto-expire links & prevent downloads</span>
                    </span>
                  </li>
                  <li className="flex gap-4 text-slate-700 font-medium text-base items-start">
                    <div className="p-1 bg-purple-50 rounded text-purple-600 shrink-0 mt-0.5">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <span>
                      <strong className="text-slate-900">Risky External Shares</strong> <br />
                      <span className="text-sm text-slate-500">Scan for exposed sensitive data</span>
                    </span>
                  </li>
                  <li className="flex gap-4 text-slate-700 font-medium text-base items-start">
                    <div className="p-1 bg-purple-50 rounded text-purple-600 shrink-0 mt-0.5">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <span>
                      <strong className="text-slate-900">One-Click Project Wrap</strong> <br />
                      <span className="text-sm text-slate-500">Instantly revoke access & archive</span>
                    </span>
                  </li>
                  <li className="flex gap-4 text-slate-700 font-medium text-base items-start">
                    <div className="p-1 bg-purple-50 rounded text-purple-600 shrink-0 mt-0.5">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <span>
                      <strong className="text-slate-900">Access Audit Logs</strong> <br />
                      <span className="text-sm text-slate-500">See who viewed what & when</span>
                    </span>
                  </li>
                </ul>

                <Link href="/contact" className="mt-auto">
                  <Button className="w-full rounded-xl font-bold bg-[#5D2C91] text-white hover:bg-black transition-all border-none h-14 text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                    Start Free Trial
                  </Button>
                </Link>
                <div className="mt-4 text-xs text-slate-400 font-medium">
                  No credit card required for trial.
                </div>
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

// --- ORGANIC STAT COMPONENT (No Card, Static, Background Blob) ---
function OrganicStat({
  icon: Icon,
  val,
  suffix,
  label,
  desc,
  bgColorClass,
  iconColorClass,
  textColorClass
}: {
  icon: any,
  val: number,
  suffix: string,
  label: string,
  desc: string,
  bgColorClass?: string,
  iconColorClass?: string,
  textColorClass?: string
}) {
  return (
    <div className="relative flex flex-col items-center justify-center text-center p-4 group w-[220px]">
      {/* Background Graphic (Top-Right Watermark) */}
      <div className="absolute -top-5 -right-5 z-0 pointer-events-none">
        <Icon
          className={cn("w-20 h-20 opacity-15 transform transition-transform duration-700 group-hover:scale-110 group-hover:rotate-12", iconColorClass)}
          strokeWidth={2}
        />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-center gap-0.5 leading-none mb-3">
          <span className="text-[3.5rem] font-bold text-slate-900 tracking-tighter">
            <CountUp end={val} duration={2.5} separator="," enableScrollSpy scrollSpyOnce />
          </span>
          <span className={cn("text-xl font-bold self-start mt-2", textColorClass)}>{suffix}</span>
        </div>

        {/* Description */}
        <p className="text-sm font-medium text-slate-500 max-w-[180px] mx-auto leading-normal mb-4">
          {desc}
        </p>

        {/* Label (All Caps) */}
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</div>
      </div>
    </div>
  )
}
