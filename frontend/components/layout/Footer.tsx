"use client"

import Link from "next/link"
import Logo from "@/components/Logo"
import { Mail } from "lucide-react"

interface FooterProps {
    onOpenModal?: (modalName: string) => void;
}

export function Footer({ onOpenModal }: FooterProps) {
    return (
        <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Brand Column (Left) */}
                    <div className="lg:col-span-2">
                        <div className="mb-6">
                            <Logo size="md" />
                        </div>
                        <p className="text-slate-500 text-sm mb-6 max-w-sm leading-relaxed">
                            Simple insights & control over Google Drive for freelancers, consultants & small agencies. No per-seat tax.
                        </p>

                        {/* Social Icons (Email only) */}
                        <div className="flex space-x-4 mb-8">
                            <a href="mailto:info@pockett.io" className="flex items-center space-x-2 text-slate-500 hover:text-blue-600 transition-colors">
                                <Mail className="h-5 w-5" />
                                <span className="text-sm font-medium">info@pockett.io</span>
                            </a>
                        </div>

                        {/* Status Badge */}
                        <div className="inline-flex items-center px-3 py-1.5 rounded-full border border-slate-200 bg-white shadow-sm mb-8">
                            <div className="h-2 w-2 bg-green-500 rounded-full mr-2 relative">
                                <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
                            </div>
                            <span className="text-xs font-semibold text-slate-600">All services are online</span>
                        </div>


                    </div>

                    {/* Links Column 1: Product */}
                    <div>
                        <h3 className="font-bold text-slate-900 mb-4 text-sm">Product</h3>
                        <ul className="space-y-3 text-sm">
                            <li><a href="/#video-demo" className="text-slate-500 hover:text-blue-600 transition-colors">Watch Demo</a></li>
                            <li><Link href="/demo/app" className="text-slate-500 hover:text-blue-600 transition-colors">Try Demo</Link></li>
                            <li><a href="/#pricing" className="text-slate-500 hover:text-blue-600 transition-colors">Pricing</a></li>
                            <li><Link href="/dash/auth" className="text-slate-500 hover:text-blue-600 transition-colors">Get Started</Link></li>
                        </ul>
                    </div>

                    {/* Links Column 3: Support */}
                    <div>
                        <h3 className="font-bold text-slate-900 mb-4 text-sm">Support</h3>
                        <ul className="space-y-3 text-sm">
                            {onOpenModal ? (
                                <>
                                    <li><button onClick={() => onOpenModal('privacy')} className="text-slate-500 hover:text-blue-600 transition-colors text-left">Privacy Policy</button></li>
                                    <li><button onClick={() => onOpenModal('cookies')} className="text-slate-500 hover:text-blue-600 transition-colors text-left">Cookie Policy</button></li>
                                    <li><button onClick={() => onOpenModal('terms')} className="text-slate-500 hover:text-blue-600 transition-colors text-left">Terms of Service</button></li>
                                    <li><button onClick={() => onOpenModal('faqs')} className="text-slate-500 hover:text-blue-600 transition-colors text-left">FAQs</button></li>
                                </>
                            ) : (
                                <>
                                    <li><Link href="/?modal=privacy" className="text-slate-500 hover:text-blue-600 transition-colors text-left">Privacy Policy</Link></li>
                                    <li><Link href="/?modal=cookies" className="text-slate-500 hover:text-blue-600 transition-colors text-left">Cookie Policy</Link></li>
                                    <li><Link href="/?modal=terms" className="text-slate-500 hover:text-blue-600 transition-colors text-left">Terms of Service</Link></li>
                                    <li><Link href="/?modal=faqs" className="text-slate-500 hover:text-blue-600 transition-colors text-left">FAQs</Link></li>
                                </>
                            )}
                            <li><Link href="/contact" className="text-slate-500 hover:text-blue-600 transition-colors text-left">Contact</Link></li>
                        </ul>
                        <div className="mt-8 text-slate-400 text-sm font-medium text-right">
                            © 2025 Pockett Docs. All rights reserved.
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
