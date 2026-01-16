"use client"

import Link from "next/link"
import Logo from "@/components/Logo"
import { Mail } from "lucide-react"

interface FooterProps {
    onOpenModal?: (modalName: string) => void;
}

export function Footer({ onOpenModal }: FooterProps) {
    return (
        <footer className="relative bg-[#FDFBFF] pt-16 pb-12 overflow-hidden text-slate-900 border-t border-purple-100">
            {/* --- SAND DUNES SVGs (Refined Broad Waves) --- */}
            <div className="absolute inset-x-0 bottom-0 h-[400px] w-full overflow-hidden pointer-events-none select-none">
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

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Main Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                    {/* Brand Column (Wider) */}
                    <div className="md:col-span-2">
                        <div className="mb-4">
                            <Logo size="md" />
                        </div>
                        <p className="text-slate-600 text-sm mb-6 max-w-sm leading-relaxed font-medium">
                            Simple insights & control over Google Drive for freelancers, consultants & small agencies. No per-seat tax.
                        </p>

                        <div className="flex gap-6 items-center">
                            {/* Status Badge */}
                            <div className="inline-flex items-center px-2.5 py-1 rounded-full border border-slate-200 bg-white/50 shadow-sm backdrop-blur-sm">
                                <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full mr-2 relative">
                                    <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-75"></div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Systems Online</span>
                            </div>

                            {/* Email */}
                            <a href="mailto:info@pockett.io" className="flex items-center space-x-2 text-slate-500 hover:text-purple-700 transition-colors">
                                <Mail className="h-4 w-4" />
                                <span className="text-sm font-medium">info@pockett.io</span>
                            </a>
                        </div>
                    </div>

                    {/* Links Column 1: Product */}
                    <div className="md:col-start-3">
                        <h3 className="font-bold text-slate-900 mb-4 text-sm">Product</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/signin" className="text-slate-500 hover:text-purple-700 transition-colors">Get Started</Link></li>
                            <li><Link href="/docs" target="_blank" className="text-slate-500 hover:text-purple-700 transition-colors">User Guide</Link></li>
                            <li><Link href="/contact" className="text-slate-500 hover:text-purple-700 transition-colors">Contact</Link></li>
                        </ul>
                    </div>

                    {/* Links Column 2: Support */}
                    <div>
                        <h3 className="font-bold text-slate-900 mb-4 text-sm">Resources</h3>
                        <ul className="space-y-2 text-sm">
                            {onOpenModal ? (
                                <>
                                    <li><Link href="/privacy" className="text-slate-500 hover:text-purple-700 transition-colors block py-0.5">Privacy Policy</Link></li>
                                    <li><Link href="/terms" className="text-slate-500 hover:text-purple-700 transition-colors block py-0.5">Terms of Service</Link></li>
                                    <li><Link href="/faq" className="text-slate-500 hover:text-purple-700 transition-colors block py-0.5">FAQs</Link></li>
                                </>
                            ) : (
                                <>
                                    <li><Link href="/privacy" className="text-slate-500 hover:text-purple-700 transition-colors block py-0.5">Privacy Policy</Link></li>
                                    <li><Link href="/terms" className="text-slate-500 hover:text-purple-700 transition-colors block py-0.5">Terms of Service</Link></li>
                                    <li><Link href="/faq" className="text-slate-500 hover:text-purple-700 transition-colors block py-0.5">FAQs</Link></li>
                                </>
                            )}
                        </ul>
                    </div>
                </div>

                {/* Copyright Row (Full Width) */}
                <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-slate-400">
                    <div>
                        &copy; {new Date().getFullYear()} Pockett Docs. All rights reserved.
                    </div>
                    <div className="flex items-center gap-6">
                        {/* Optional bottom links if needed, or empty */}
                    </div>
                </div>
            </div>
        </footer>
    )
}
