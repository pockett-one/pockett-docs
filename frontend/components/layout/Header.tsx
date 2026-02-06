"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import Logo from "@/components/Logo"
import { Menu, X, ChevronDown } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface HeaderProps {
    onOpenModal?: (modalName: string) => void;
}

export function Header({ onOpenModal }: HeaderProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const pathname = usePathname()
    const [scrolled, setScrolled] = useState(false)
    const isProduction = process.env.NODE_ENV === 'production'

    // Handle scroll effect for transparency/blur intensity
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const isActive = (path: string) => {
        if (path === '/' && pathname === '/') return true
        if (path !== '/' && pathname?.startsWith(path)) return true
        return false
    }

    const navItemClass = (path: string, isButton = false) => cn(
        "px-4 py-2 text-sm font-medium transition-all duration-200 rounded-full flex items-center gap-1.5",
        isActive(path) && !isButton
            ? "bg-slate-900 text-white shadow-md shadow-purple-900/10"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
    )

    return (
        <div className="fixed top-4 left-0 right-0 z-50 flex flex-col items-center px-4 pointer-events-none sm:top-6">
            <header
                className={cn(
                    "pointer-events-auto transition-all duration-300 w-[95%] md:w-[85%] max-w-7xl flex justify-between items-center pl-4 pr-3 py-2.5 sm:pl-6 sm:py-3",
                    // Shape & Border
                    "rounded-full border border-slate-200/60",
                    // Background & Blur
                    "bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60",
                    // Shadow - subtle purple hint
                    scrolled ? "shadow-xl shadow-purple-900/5" : "shadow-lg shadow-purple-900/5"
                )}
            >
                <div className="flex items-center">
                    <Link href="/" className="flex items-center transition-opacity duration-200 hover:opacity-80">
                        <Logo size="md" />
                    </Link>
                </div>

                <nav className="hidden md:flex items-center gap-1">
                    {/* Solutions Dropdown */}
                    <div className="relative group">
                        <button
                            className={cn(
                                "px-4 py-2 text-sm font-medium rounded-full flex items-center gap-1.5 transition-all duration-200",
                                pathname?.startsWith('/solutions')
                                    ? "bg-slate-900 text-white shadow-md"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            )}
                        >
                            Solutions
                            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-180", pathname?.startsWith('/solutions') ? "text-slate-300" : "opacity-50")} />
                        </button>

                        {/* Dropdown Menu */}
                        <div className="absolute top-full left-0 mt-3 w-72 bg-white/95 backdrop-blur-xl border border-slate-200/60 shadow-2xl shadow-purple-900/10 rounded-2xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-50 origin-top-left">
                            <Link href="/solutions/consulting" className="block p-3 rounded-xl hover:bg-slate-50 transition-colors group/item relative overflow-hidden">
                                <div className="font-semibold text-slate-900 text-sm group-hover/item:text-purple-600 transition-colors relative z-10">Professional Services</div>
                                <div className="text-xs text-slate-500 mt-1 leading-relaxed relative z-10">
                                    Secure client portals for consulting & agency teams.
                                </div>
                            </Link>
                            <Link href="/solutions/accounting" className="block p-3 rounded-xl hover:bg-slate-50 transition-colors group/item">
                                <div className="font-semibold text-slate-900 text-sm group-hover/item:text-purple-600 transition-colors">Tax & Advisory Services</div>
                                <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                                    Automate folder structures, retention, and compliance.
                                </div>
                            </Link>
                        </div>
                    </div>

                    <Link href="/contact" className={navItemClass('/contact')}>
                        Contact
                    </Link>
                    <Link href="/docs" target="_blank" className={navItemClass('/docs')}>
                        User Guide
                    </Link>
                    <Link href="/faq" className={navItemClass('/faq')}>
                        FAQs
                    </Link>
                    <Link href="/pricing" className={navItemClass('/pricing')}>
                        Pricing
                    </Link>
                    <Link href="/blog" className={navItemClass('/blog')}>
                        Blog
                    </Link>
                </nav>

                {!isProduction && (
                    <div className="hidden md:flex items-center gap-3">
                        <Link href="/signin">
                            <Button
                                variant="ghost"
                                className="rounded-full px-5 py-2 h-auto text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            >
                                Sign in
                            </Button>
                        </Link>
                        <Link href="/signup">
                            <Button
                                className="rounded-full px-6 py-2.5 h-auto text-sm font-bold bg-slate-900 hover:bg-purple-900 text-white shadow-lg hover:shadow-xl hover:shadow-purple-900/20 transition-all duration-300"
                            >
                                Sign up
                            </Button>
                        </Link>
                    </div>
                )}

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
                <div className="pointer-events-auto mt-3 w-[95%] bg-white/95 backdrop-blur-2xl border border-slate-200/80 shadow-2xl shadow-purple-900/20 rounded-2xl p-4 flex flex-col gap-2 md:hidden animate-in slide-in-from-top-2 fade-in-20">
                    <div className="px-4 py-1 text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Solutions</div>
                    <Link
                        href="/solutions/consulting"
                        className={cn("px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 border", pathname === '/solutions/consulting' ? "bg-slate-900 text-white border-transparent" : "text-slate-900 bg-slate-50 border-slate-100 hover:bg-slate-100")}
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        Professional Services
                    </Link>
                    <Link
                        href="/solutions/accounting"
                        className={cn("px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 border", pathname === '/solutions/accounting' ? "bg-slate-900 text-white border-transparent" : "text-slate-900 bg-slate-50 border-slate-100 hover:bg-slate-100")}
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        Tax & Advisory Services
                    </Link>

                    <div className="h-px bg-slate-100 my-1" />

                    <Link
                        href="/contact"
                        className={cn("px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200", pathname === '/contact' ? "bg-slate-100" : "text-slate-900 hover:bg-slate-50")}
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
                    <Link
                        href="/faq"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="px-4 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all duration-200 text-left"
                    >
                        FAQs
                    </Link>
                    <Link
                        href="/pricing"
                        className={cn("px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200", pathname === '/pricing' ? "bg-slate-100" : "text-slate-900 hover:bg-slate-50")}
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        Pricing
                    </Link>
                    <Link
                        href="/blog"
                        className={cn("px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200", pathname?.startsWith('/blog') ? "bg-slate-100" : "text-slate-900 hover:bg-slate-50")}
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        Blog
                    </Link>

                    {!isProduction && (
                        <>
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
                                        className="w-full rounded-xl px-6 py-2.5 h-auto text-sm font-bold bg-slate-900 hover:bg-purple-900 text-white shadow-md justify-center"
                                    >
                                        Sign up
                                    </Button>
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
