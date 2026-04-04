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
    HelpCircle,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import {
    solutionsMegaMenuItems,
    TARGET_AUDIENCE_HREF,
} from "@/lib/marketing/target-audience-nav"

interface HeaderProps {
    onOpenModal?: (modalName: string) => void
}

const labelFont = "[font-family:var(--font-header-label),system-ui,sans-serif]"

/** Shared desktop mega-menu (Solutions + Resources): panel, stack, row hover. */
const megaMenuDropdownClass =
    "invisible absolute left-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] origin-top-left translate-y-1 rounded-2xl border border-slate-200/60 bg-white p-2 opacity-0 shadow-xl shadow-slate-900/5 backdrop-blur-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100"

const megaMenuStackClass = "flex flex-col divide-y divide-slate-100 overflow-hidden rounded-xl"

const megaMenuLinkClass =
    "group/item block px-3 py-3 transition-colors duration-200 first:pt-2.5 last:pb-2.5 hover:bg-slate-50"

const megaMenuTitleClass = cn(
    labelFont,
    "text-xs font-medium uppercase tracking-widest text-slate-700 transition-colors duration-200 group-hover/item:text-emerald-700",
)

const megaMenuDescClass =
    "mt-1.5 text-[11px] font-normal leading-snug text-slate-500 transition-colors duration-200 normal-case group-hover/item:text-slate-600"

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
                        className="shrink-0"
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
                            <div className={megaMenuDropdownClass}>
                                <div className={megaMenuStackClass}>
                                    {solutionsMegaMenuItems.map((item) => (
                                        <Link
                                            key={item.id}
                                            href={TARGET_AUDIENCE_HREF}
                                            className={megaMenuLinkClass}
                                        >
                                            <div className={megaMenuTitleClass}>{item.title}</div>
                                            <div className={megaMenuDescClass}>{item.description}</div>
                                        </Link>
                                    ))}
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
                                                pathname?.startsWith("/resources/faq"),
                                        ),
                                    ),
                                    "m-0 cursor-pointer bg-transparent p-0 text-left outline-none ring-0 focus-visible:ring-2 focus-visible:ring-emerald-500/30",
                                )}
                            >
                                <span className="whitespace-nowrap">Resources</span>
                                <ChevronDown
                                    className={cn(
                                        "h-3.5 w-3.5 shrink-0 text-current opacity-70 transition-transform duration-200 group-hover:rotate-180",
                                        (pathname?.startsWith("/blog") || pathname?.startsWith("/resources/faq")) &&
                                            "opacity-100",
                                    )}
                                    aria-hidden
                                />
                            </button>
                            <div className={megaMenuDropdownClass}>
                                <div className={megaMenuStackClass}>
                                    <Link href="/blog" className={megaMenuLinkClass}>
                                        <div className={megaMenuTitleClass}>Blog</div>
                                        <div className={megaMenuDescClass}>
                                            Insights, guides, and best practices for client portals.
                                        </div>
                                    </Link>
                                    <Link href="/resources/faq" className={megaMenuLinkClass}>
                                        <div className={megaMenuTitleClass}>FAQs</div>
                                        <div className={megaMenuDescClass}>
                                            Common questions and answers about <BrandName className="text-[11px] font-medium" />.
                                        </div>
                                    </Link>
                                </div>
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
                        <div
                            className={cn(
                                labelFont,
                                "mb-1 px-2 py-1.5 text-[10px] font-medium uppercase tracking-widest text-slate-400",
                            )}
                        >
                            Solutions
                        </div>
                        <div
                            className={cn(
                                megaMenuStackClass,
                                "rounded-lg border border-slate-100 bg-white",
                            )}
                        >
                            {solutionsMegaMenuItems.map((item) => (
                                <Link
                                    key={item.id}
                                    href={TARGET_AUDIENCE_HREF}
                                    className={cn(megaMenuLinkClass, "active:bg-slate-100")}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <div className={megaMenuTitleClass}>{item.title}</div>
                                    <div className={megaMenuDescClass}>{item.description}</div>
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
                                href="/resources/faq"
                                className={cn(
                                    "relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors active:bg-slate-100",
                                    pathname === "/resources/faq" ? "bg-slate-100" : "",
                                )}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <div className="absolute bottom-0 left-[11px] top-0 w-px bg-slate-200" />
                                <div className="absolute left-[11px] top-1/2 h-px w-3 bg-slate-200" />
                                <HelpCircle
                                    className={cn(
                                        "relative z-10 ml-4 h-4 w-4 shrink-0",
                                        pathname === "/resources/faq" ? "text-slate-900" : "text-slate-700",
                                    )}
                                />
                                <span
                                    className={cn(
                                        "relative z-10 text-sm",
                                        pathname === "/resources/faq" ? "font-semibold text-slate-900" : "font-medium text-slate-900",
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
