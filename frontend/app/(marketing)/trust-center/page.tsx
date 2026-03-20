"use client"

import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { TrustCards } from "@/components/landing/trust-cards"
import { TrustDiagram } from "@/components/landing/trust-diagram"
import { FadeIn } from "@/components/animations/fade-in"
import { ShieldCheck, ArrowRight, ChevronRight, Home } from "lucide-react"
import { GoogleDriveIcon } from "@/components/ui/google-drive-icon"
import Link from "next/link"

export default function TrustPage() {
    return (
        <div className="min-h-screen bg-purple-50/30 relative overflow-hidden font-sans flex flex-col">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#f3e8ff_1px,transparent_1px),linear-gradient(to_bottom,#f3e8ff_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-50"></div>
            <Header />

            {/* Breadcrumb - Adjusted z-index and positioning */}
            {/* Breadcrumb - Adjusted z-index and positioning */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 relative z-20 w-full">
                <div className="flex items-center justify-start space-x-2 text-sm text-slate-500">
                    <Link href="/" className="hover:text-purple-600 transition-colors p-1 -ml-1 hover:bg-purple-50 rounded-md">
                        <Home className="h-4 w-4" />
                        <span className="sr-only">Home</span>
                    </Link>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                    <span className="font-medium text-slate-900">Trust Architecture</span>
                </div>
            </div>

            {/* Hero Section */}
            {/* Hero Section - Reduced top padding since navigation separates it, reduced bottom padding */}
            <section className="pt-12 pb-12 px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <FadeIn>
                        <div className="inline-flex items-center px-4 py-1.5 bg-black text-white rounded-md text-xs font-bold tracking-widest uppercase mb-6 shadow-xl shadow-purple-900/10">
                            <ShieldCheck className="w-3.5 h-3.5 mr-2 text-purple-400 stroke-2" />
                            Trust Architecture
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-6">
                            Your Business. <span className="inline-flex items-center gap-2 px-2"><GoogleDriveIcon size={32} /> Your Drive.</span> <br />
                            Your Asset. <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Your Control.</span>
                        </h1>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
                            Organize your files without holding them hostage. <span className="text-slate-900 font-bold underline decoration-purple-300 decoration-2 underline-offset-2">Non-Custodial Design</span> means if you leave Pockett, your folders stay exactly as they are.
                        </p>
                    </FadeIn>
                </div>
            </section>

            {/* Trust Cards Section */}
            {/* Trust Cards Section - Reduced vertical padding to bring it closer to hero */}
            <section className="pb-12 px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <TrustCards />
                </div>
            </section>

            {/* Architecture Diagram Section */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-200">
                <div className="max-w-7xl mx-auto">
                    <FadeIn>
                        <div className="text-center mb-6">
                            <h2 className="text-3xl font-bold text-slate-900 mb-4">Transparent Data Flow</h2>
                            <p className="text-slate-600 max-w-2xl mx-auto">
                                See exactly how Pockett interacts with your infrastructure. Logic lives on our servers; files live in your vault.
                            </p>
                        </div>
                        <TrustDiagram />
                    </FadeIn>
                </div>
            </section>

            {/* CTA Section */}


            <Footer />
        </div>
    )
}
