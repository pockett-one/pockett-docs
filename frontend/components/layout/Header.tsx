"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Logo from "@/components/Logo"
import { Menu, X, ChevronDown } from "lucide-react"
import { useState } from "react"
interface HeaderProps {
    onOpenModal?: (modalName: string) => void;
}

export function Header({ onOpenModal }: HeaderProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    return (
        <div className="fixed top-6 left-0 right-0 z-50 flex flex-col items-center px-4 pointer-events-none">
            <header className="pointer-events-auto bg-white/90 backdrop-blur-xl border border-slate-200 shadow-sm rounded-full pl-6 pr-3 py-2 w-[95%] md:w-[80%] max-w-7xl flex justify-between items-center transition-all duration-300 hover:shadow-md">
                <div className="flex items-center">
                    <Link href="/" className="flex items-center transition-opacity duration-200 hover:opacity-80">
                        <Logo size="md" />
                    </Link>
                </div>

                <nav className="hidden md:flex items-center gap-2">
                    {/* Solutions Dropdown */}
                    <div className="relative group">
                        <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all duration-200">
                            Solutions
                            <ChevronDown className="w-3.5 h-3.5 opacity-50 group-hover:rotate-180 transition-transform duration-200" />
                        </button>
                        <div className="absolute top-full left-0 mt-3 w-64 bg-white border border-slate-200 shadow-xl rounded-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-50 origin-top-left">
                            <Link href="/solutions/accounting" className="block p-3 rounded-lg hover:bg-slate-50 transition-colors group/item">
                                <div className="font-semibold text-slate-900 text-sm group-hover/item:text-purple-600 transition-colors">Tax & Advisory Services</div>
                                <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                                    Automate folder structures, retention, and compliance.
                                </div>
                            </Link>
                        </div>
                    </div>

                    <Link href="/contact" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all duration-200">
                        Contact
                    </Link>
                    <Link href="/docs" target="_blank" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all duration-200">
                        User Guide
                    </Link>
                    <button
                        onClick={() => onOpenModal?.('faqs')}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all duration-200"
                    >
                        FAQs
                    </button>
                    <Link href="/#pricing" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all duration-200">
                        Pricing
                    </Link>
                </nav>

                <div className="hidden md:flex items-center gap-3">
                    <Link href="/signin">
                        <Button
                            variant="outline"
                            className="rounded-full px-6 py-2.5 h-auto text-sm font-medium"
                        >
                            Sign in
                        </Button>
                    </Link>
                    <Link href="/signup">
                        <Button
                            className="rounded-full px-6 py-2.5 h-auto text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                        >
                            Sign up
                        </Button>
                    </Link>
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="pointer-events-auto mt-2 w-[95%] bg-white/95 backdrop-blur-xl border border-slate-200 shadow-xl rounded-2xl p-4 flex flex-col gap-2 md:hidden animate-in slide-in-from-top-2 fade-in-20">
                    <div className="px-4 py-1 text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Solutions</div>
                    <Link
                        href="/solutions/accounting"
                        className="px-4 py-3 text-sm font-semibold text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all duration-200 border border-slate-100"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        Tax & Advisory Services
                    </Link>

                    <div className="h-px bg-slate-100 my-1" />

                    <Link
                        href="/contact"
                        className="px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 rounded-xl transition-all duration-200"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        Contact
                    </Link>
                    <Link
                        href="/docs"
                        target="_blank"
                        className="px-4 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all duration-200"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        User Guide
                    </Link>
                    <button
                        onClick={() => {
                            onOpenModal?.('faqs')
                            setIsMobileMenuOpen(false)
                        }}
                        className="px-4 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all duration-200 text-left"
                    >
                        FAQs
                    </button>
                    <Link
                        href="/#pricing"
                        className="px-4 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all duration-200"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        Pricing
                    </Link>

                    <div className="h-px bg-slate-100 my-1" />

                    <div className="flex flex-col gap-2">
                        <Link href="/signin" onClick={() => setIsMobileMenuOpen(false)}>
                            <Button
                                variant="outline"
                                className="w-full rounded-xl px-6 py-2.5 h-auto text-sm font-medium justify-center"
                            >
                                Sign in
                            </Button>
                        </Link>
                        <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                            <Button
                                className="w-full rounded-xl px-6 py-2.5 h-auto text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md justify-center"
                            >
                                Sign up
                            </Button>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    )
}
