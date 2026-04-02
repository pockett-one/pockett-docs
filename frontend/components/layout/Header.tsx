"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import Logo from "@/components/Logo"
import { BrandName } from "@/components/brand/BrandName"
import {
    Menu,
    X,
    ChevronDown,
    Mail,
    DollarSign,
    FileText,
    BookOpen,
    HelpCircle,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { audienceRoles, useCaseBlocks } from "@/lib/marketing/target-audience-nav"

interface HeaderProps {
    onOpenModal?: (modalName: string) => void
}

const labelFont = "[font-family:var(--font-header-label),system-ui,sans-serif]"

/** design1: flush `top-0` bar; main content needs ~`pt-24 lg:pt-28` (see PublicPageLayout, pricing, landing hero). */
export function Header({ onOpenModal: _onOpenModal }: HeaderProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const pathname = usePathname()
    const isDevelopment = process.env.NODE_ENV === "development"

    const isActive = (path: string) => {
        if (path === "/" && pathname === "/") return true
        if (path !== "/" && pathname?.startsWith(path)) return true
        return false
    }

    /** Shared shell: fixed height + pseudo underline prevents baseline drift between items with/without chevrons. */
    const navItemShell =
        "relative inline-flex h-9 items-center gap-1.5 leading-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:origin-left after:bg-emerald-500 after:transition-transform after:duration-200"

    const navLabelClass = (active: boolean) =>
        cn(
            navItemShell,
            "text-xs font-medium uppercase tracking-widest transition-colors duration-200",
            labelFont,
            active
                ? "text-emerald-500 after:scale-x-100"
                : "text-slate-600 after:scale-x-0 hover:text-emerald-500 hover:after:scale-x-100 group-hover:text-emerald-500 group-hover:after:scale-x-100",
        )

    return (
        <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-slate-200/60 bg-white/70 backdrop-blur-md">
            <div className="relative mx-auto flex w-full max-w-[min(100%,92rem)] items-center justify-between gap-4 px-3 py-4 sm:px-4 md:px-5 lg:px-6 xl:px-10">
                <div className="flex min-w-0 flex-1 items-center">
                    <Link
                        href="/"
                        className="shrink-0 transition-opacity duration-200 hover:opacity-80"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <Logo size="md" showText wordmarkClassName="text-2xl leading-none" />
                    </Link>

                    <nav
                        className="hidden md:absolute md:left-1/2 md:flex md:-translate-x-1/2 md:items-center md:gap-6 lg:gap-8"
                        aria-label="Primary"
                    >
                        <div className="relative group">
                            <button
                                type="button"
                                className={cn(
                                    navLabelClass(false),
                                    "m-0 cursor-pointer bg-transparent p-0 text-left outline-none ring-0 focus-visible:ring-2 focus-visible:ring-emerald-500/30",
                                )}
                            >
                                <span className="whitespace-nowrap">Solutions</span>
                                <ChevronDown
                                    className="h-3.5 w-3.5 shrink-0 text-current opacity-70 transition-transform duration-200 group-hover:rotate-180"
                                    aria-hidden
                                />
                            </button>
                            <div className="invisible absolute left-0 top-full z-50 mt-2 w-[min(42rem,calc(100vw-2rem))] origin-top-left translate-y-1 rounded-2xl border border-slate-200/60 bg-white/95 p-3 opacity-0 shadow-xl shadow-slate-900/5 backdrop-blur-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-0">
                                    <div className="sm:pr-3">
                                        <p className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                            Who it&apos;s for
                                        </p>
                                        <div className="max-h-[min(60vh,22rem)] space-y-0.5 overflow-y-auto overscroll-contain pr-1">
                                            {audienceRoles.map((role) => (
                                                <Link
                                                    key={role.id}
                                                    href={`/#${role.id}`}
                                                    className="group/item block rounded-xl px-2 py-2 transition-colors hover:bg-slate-50"
                                                >
                                                    <div className="text-sm font-semibold text-slate-900 transition-colors group-hover/item:text-emerald-700">
                                                        {role.label}
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="border-t border-slate-100 pt-3 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
                                        <p className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                            Use cases
                                        </p>
                                        <div className="max-h-[min(60vh,22rem)] space-y-0.5 overflow-y-auto overscroll-contain pr-1">
                                            {useCaseBlocks.map((block) => (
                                                <Link
                                                    key={block.id}
                                                    href={`/#${block.id}`}
                                                    className="group/item block rounded-xl px-2 py-2 transition-colors hover:bg-slate-50"
                                                >
                                                    <div className="text-sm font-semibold text-slate-900 transition-colors group-hover/item:text-emerald-700">
                                                        {block.menuTitle}
                                                    </div>
                                                    <div className="mt-0.5 text-xs leading-snug text-slate-500">
                                                        {block.menuDescription}
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Link href="/contact" className={navLabelClass(isActive("/contact"))}>
                            Contact
                        </Link>

                        <Link href="/pricing" className={navLabelClass(isActive("/pricing"))}>
                            Pricing
                        </Link>

                        <div className="relative group">
                            <button
                                type="button"
                                className={cn(
                                    navLabelClass(
                                        Boolean(
                                            pathname?.startsWith("/blog") ||
                                                pathname?.startsWith("/faq") ||
                                                pathname?.startsWith("/resources/docs"),
                                        ),
                                    ),
                                    "m-0 cursor-pointer bg-transparent p-0 text-left outline-none ring-0 focus-visible:ring-2 focus-visible:ring-emerald-500/30",
                                )}
                            >
                                <span className="whitespace-nowrap">Resources</span>
                                <ChevronDown
                                    className={cn(
                                        "h-3.5 w-3.5 shrink-0 text-current opacity-70 transition-transform duration-200 group-hover:rotate-180",
                                        (pathname?.startsWith("/blog") ||
                                            pathname?.startsWith("/faq") ||
                                            pathname?.startsWith("/resources/docs")) && "opacity-100",
                                    )}
                                    aria-hidden
                                />
                            </button>
                            <div className="absolute left-0 top-full z-50 mt-2 w-72 origin-top-left rounded-2xl border border-slate-200/60 bg-white/95 p-2 opacity-0 shadow-xl shadow-slate-900/5 backdrop-blur-xl transition-all duration-200 invisible group-hover:visible group-hover:opacity-100 translate-y-1 group-hover:translate-y-0">
                                <Link
                                    href="/blog"
                                    className="group/item relative block overflow-hidden rounded-xl p-3 transition-colors hover:bg-slate-50"
                                >
                                    <div className="relative z-10 text-sm font-semibold text-slate-900 transition-colors group-hover/item:text-emerald-700">
                                        Blog
                                    </div>
                                    <div className="relative z-10 mt-1 text-xs leading-relaxed text-slate-500">
                                        Insights, guides, and best practices for client portals.
                                    </div>
                                </Link>
                                <Link
                                    href="/resources/docs"
                                    target="_blank"
                                    className="group/item block rounded-xl p-3 transition-colors hover:bg-slate-50"
                                >
                                    <div className="text-sm font-semibold text-slate-900 transition-colors group-hover/item:text-emerald-700">
                                        User Guide
                                    </div>
                                    <div className="mt-1 text-xs leading-relaxed text-slate-500">
                                        Learn how to use <BrandName className="text-xs font-medium" /> effectively.
                                    </div>
                                </Link>
                                <Link href="/faq" className="group/item block rounded-xl p-3 transition-colors hover:bg-slate-50">
                                    <div className="text-sm font-semibold text-slate-900 transition-colors group-hover/item:text-emerald-700">
                                        FAQs
                                    </div>
                                    <div className="mt-1 text-xs leading-relaxed text-slate-500">
                                        Common questions and answers about <BrandName className="text-xs font-medium" />.
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </nav>
                </div>

                <div className="flex shrink-0 items-center gap-3 sm:gap-4 md:gap-6">
                    <Link
                        href="/signin"
                        className={cn(
                            navLabelClass(false),
                            "hidden sm:inline-flex",
                        )}
                    >
                        Sign in
                    </Link>

                    <Link
                        href="/signup"
                        className={cn(
                            labelFont,
                            "inline-flex items-center justify-center rounded bg-[#72ff70] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#002203] shadow-[0_1px_0_rgba(0,34,3,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_10px_24px_-12px_rgba(0,34,3,0.65)] active:translate-y-0 active:scale-95 sm:px-6",
                        )}
                    >
                        <span className="sm:hidden">Start</span>
                        <span className="hidden sm:inline">Get started</span>
                    </Link>

                    <button
                        type="button"
                        className="p-2 text-slate-600 transition-colors hover:bg-slate-100/80 md:hidden"
                        onClick={() => setIsMobileMenuOpen((o) => !o)}
                        aria-expanded={isMobileMenuOpen}
                        aria-controls="site-header-mobile-panel"
                        aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                    >
                        {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </div>

            {isMobileMenuOpen && (
                <div
                    id="site-header-mobile-panel"
                    className="border-t border-slate-200/60 bg-white/95 px-4 py-4 backdrop-blur-md md:hidden"
                >
                    <div className="mb-4">
                        <div className="mb-1 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Solutions
                        </div>
                        <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Who it&apos;s for
                        </div>
                        <div className="mb-3 space-y-0">
                            {audienceRoles.map((role) => (
                                <Link
                                    key={role.id}
                                    href={`/#${role.id}`}
                                    className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-900 transition-colors active:bg-slate-100"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {role.label}
                                </Link>
                            ))}
                        </div>
                        <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Use cases
                        </div>
                        <div className="space-y-0">
                            {useCaseBlocks.map((block) => (
                                <Link
                                    key={block.id}
                                    href={`/#${block.id}`}
                                    className="block rounded-lg px-3 py-2.5 transition-colors active:bg-slate-100"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <span className="text-sm font-semibold text-slate-900">{block.menuTitle}</span>
                                    <span className="mt-0.5 block text-xs leading-snug text-slate-500">
                                        {block.menuDescription}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="mb-4">
                        <div className="mb-1 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Main
                        </div>
                        <div className="space-y-0">
                            <Link
                                href="/contact"
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors active:bg-slate-100",
                                    pathname === "/contact" ? "bg-slate-100" : "",
                                )}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <Mail
                                    className={cn(
                                        "h-4 w-4 shrink-0",
                                        pathname === "/contact" ? "text-slate-900" : "text-slate-700",
                                    )}
                                />
                                <span
                                    className={cn(
                                        "text-sm",
                                        pathname === "/contact" ? "font-semibold text-slate-900" : "font-medium text-slate-900",
                                    )}
                                >
                                    Contact
                                </span>
                            </Link>
                            <Link
                                href="/pricing"
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors active:bg-slate-100",
                                    pathname === "/pricing" ? "bg-slate-100" : "",
                                )}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <DollarSign
                                    className={cn(
                                        "h-4 w-4 shrink-0",
                                        pathname === "/pricing" ? "text-slate-900" : "text-slate-700",
                                    )}
                                />
                                <span
                                    className={cn(
                                        "text-sm",
                                        pathname === "/pricing" ? "font-semibold text-slate-900" : "font-medium text-slate-900",
                                    )}
                                >
                                    Pricing
                                </span>
                            </Link>
                        </div>
                    </div>

                    <div className="mb-4">
                        <div className="mb-1 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Resources
                        </div>
                        <div className="space-y-0">
                            <Link
                                href="/blog"
                                className={cn(
                                    "relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors active:bg-slate-100",
                                    pathname?.startsWith("/blog") ? "bg-slate-100" : "",
                                )}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <div className="absolute bottom-0 left-[11px] top-0 w-px bg-slate-200" />
                                <div className="absolute left-[11px] top-1/2 h-px w-3 bg-slate-200" />
                                <FileText
                                    className={cn(
                                        "relative z-10 ml-4 h-4 w-4 shrink-0",
                                        pathname?.startsWith("/blog") ? "text-slate-900" : "text-slate-700",
                                    )}
                                />
                                <span
                                    className={cn(
                                        "relative z-10 text-sm",
                                        pathname?.startsWith("/blog")
                                            ? "font-semibold text-slate-900"
                                            : "font-medium text-slate-900",
                                    )}
                                >
                                    Blog
                                </span>
                            </Link>
                            <Link
                                href="/resources/docs"
                                target="_blank"
                                className={cn(
                                    "relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors active:bg-slate-100",
                                    pathname?.startsWith("/resources/docs") ? "bg-slate-100" : "",
                                )}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <div className="absolute bottom-0 left-[11px] top-0 w-px bg-slate-200" />
                                <div className="absolute left-[11px] top-1/2 h-px w-3 bg-slate-200" />
                                <BookOpen
                                    className={cn(
                                        "relative z-10 ml-4 h-4 w-4 shrink-0",
                                        pathname?.startsWith("/resources/docs") ? "text-slate-900" : "text-slate-700",
                                    )}
                                />
                                <span
                                    className={cn(
                                        "relative z-10 text-sm",
                                        pathname?.startsWith("/resources/docs")
                                            ? "font-semibold text-slate-900"
                                            : "font-medium text-slate-900",
                                    )}
                                >
                                    User Guide
                                </span>
                            </Link>
                            <Link
                                href="/faq"
                                className={cn(
                                    "relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors active:bg-slate-100",
                                    pathname === "/faq" ? "bg-slate-100" : "",
                                )}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <div className="absolute bottom-0 left-[11px] top-0 w-px bg-slate-200" />
                                <div className="absolute left-[11px] top-1/2 h-px w-3 bg-slate-200" />
                                <HelpCircle
                                    className={cn(
                                        "relative z-10 ml-4 h-4 w-4 shrink-0",
                                        pathname === "/faq" ? "text-slate-900" : "text-slate-700",
                                    )}
                                />
                                <span
                                    className={cn(
                                        "relative z-10 text-sm",
                                        pathname === "/faq" ? "font-semibold text-slate-900" : "font-medium text-slate-900",
                                    )}
                                >
                                    FAQs
                                </span>
                            </Link>
                        </div>
                    </div>

                    {isDevelopment && (
                        <>
                            <div className="my-2 h-px bg-slate-200" />
                            <div className="flex flex-col gap-2">
                                <Link href="/signin" onClick={() => setIsMobileMenuOpen(false)}>
                                    <Button
                                        variant="outline"
                                        className="h-auto w-full justify-center rounded-lg border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-900 hover:border-slate-300 hover:bg-slate-50"
                                    >
                                        Sign in
                                    </Button>
                                </Link>
                                <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                                    <Button className="h-auto w-full justify-center rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
                                        Sign up
                                    </Button>
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            )}
        </header>
    )
}
