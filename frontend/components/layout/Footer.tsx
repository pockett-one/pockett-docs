"use client"

import Link from "next/link"
import { useCallback } from "react"
import { Mail, Share2 } from "lucide-react"
import { BrandName } from "@/components/brand/BrandName"
import { BRAND_NAME } from "@/config/brand"
import { platformEmail } from "@/config/platform-domain"
import { requestOpenCookieSettings } from "@/lib/cookie-consent-storage"
import { MARKETING_PAGE_SHELL } from "@/lib/marketing/target-audience-nav"
import { cn } from "@/lib/utils"

interface FooterProps {
    onOpenModal?: (modalName: string) => void
}

/** Global marketing footer — matches `docs/design/v4/landing-v4.html` (white, kinetic columns). */
export function Footer({ onOpenModal: _onOpenModal }: FooterProps) {
    const infoEmail = platformEmail("info")
    const year = new Date().getFullYear()

    const handleSharePage = useCallback(async () => {
        if (typeof window === "undefined") return
        const url = window.location.href
        const title = document.title?.trim() || BRAND_NAME
        const text = `${BRAND_NAME} — Organize · Protect · Deliver`

        if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
            try {
                await navigator.share({ title, text, url })
                return
            } catch (err) {
                if (err instanceof Error && err.name === "AbortError") return
            }
        }

        try {
            await navigator.clipboard.writeText(url)
        } catch {
            window.prompt("Copy this link:", url)
        }
    }, [])

    return (
        <footer className="border-t border-[#c6c6cc]/10 bg-white pb-8 pt-12 text-[#1b1b1d]">
            <div className={cn(MARKETING_PAGE_SHELL, "w-full")}>
                <div className="mb-10 grid grid-cols-1 gap-8 md:grid-cols-12">
                    <div className="md:col-span-5">
                        <div className="mb-4">
                            <span className="mb-2 block text-3xl font-bold tracking-tighter text-slate-900 [font-family:var(--font-kinetic-headline),system-ui,sans-serif]">
                                <BrandName className="text-3xl font-bold tracking-tighter text-slate-900" />
                            </span>
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#22c55e] [font-family:var(--font-kinetic-headline),system-ui,sans-serif]">
                                <span>Organize</span>
                                <span className="h-1 w-1 rounded-full bg-[#22c55e]/50" aria-hidden />
                                <span>Protect</span>
                                <span className="h-1 w-1 rounded-full bg-[#22c55e]/50" aria-hidden />
                                <span>Deliver</span>
                            </div>
                        </div>
                        <p className="mb-5 max-w-sm leading-relaxed text-[#45474c] [font-family:var(--font-kinetic-body),system-ui,sans-serif]">
                            Simple insights &amp; control over Google Drive for freelancers, consultants &amp; small agencies. No
                            per-seat tax.
                        </p>
                        <div className="flex flex-wrap items-center gap-4">
                            <button
                                type="button"
                                onClick={() => void handleSharePage()}
                                className={cn(
                                    "group flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#c6c6cc] bg-[#f6f3f4] transition-all hover:border-[#22c55e]",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22c55e]/40 focus-visible:ring-offset-2",
                                )}
                                aria-label="Share this page"
                            >
                                <Share2 className="h-4 w-4 text-[#45474c] group-hover:text-[#22c55e]" aria-hidden />
                            </button>
                            <a
                                href={`mailto:${infoEmail}`}
                                className="flex items-center gap-2 text-[#45474c] transition-colors hover:text-[#1b1b1d]"
                            >
                                <Mail className="h-5 w-5 shrink-0" aria-hidden />
                                <span className="text-sm [font-family:var(--font-kinetic-body),system-ui,sans-serif]">{infoEmail}</span>
                            </a>
                        </div>
                    </div>

                    <div className="md:col-span-2 md:ml-auto">
                        <h4 className="mb-4 text-sm font-bold text-[#1b1b1d] [font-family:var(--font-kinetic-headline),system-ui,sans-serif]">
                            Product
                        </h4>
                        <ul className="space-y-3">
                            <li>
                                <Link
                                    href="/resources/docs"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-[#45474c] transition-colors hover:text-[#22c55e] [font-family:var(--font-kinetic-body),system-ui,sans-serif]"
                                >
                                    User Guide
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/trust-center"
                                    className="text-sm text-[#45474c] transition-colors hover:text-[#22c55e] [font-family:var(--font-kinetic-body),system-ui,sans-serif]"
                                >
                                    Trust Center
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/contact"
                                    className="text-sm text-[#45474c] transition-colors hover:text-[#22c55e] [font-family:var(--font-kinetic-body),system-ui,sans-serif]"
                                >
                                    Contact
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="md:col-span-2 md:ml-auto">
                        <h4 className="mb-4 text-sm font-bold text-[#1b1b1d] [font-family:var(--font-kinetic-headline),system-ui,sans-serif]">
                            Resources
                        </h4>
                        <ul className="space-y-3">
                            <li>
                                <Link
                                    href="/faq"
                                    className="text-sm text-[#45474c] transition-colors hover:text-[#22c55e] [font-family:var(--font-kinetic-body),system-ui,sans-serif]"
                                >
                                    FAQs
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/blog"
                                    className="text-sm text-[#45474c] transition-colors hover:text-[#22c55e] [font-family:var(--font-kinetic-body),system-ui,sans-serif]"
                                >
                                    Blog
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="md:col-span-3 md:ml-auto">
                        <h4 className="mb-4 text-sm font-bold text-[#1b1b1d] [font-family:var(--font-kinetic-headline),system-ui,sans-serif]">
                            Legal
                        </h4>
                        <ul className="space-y-3">
                            <li>
                                <Link
                                    href="/privacy"
                                    className="text-sm text-[#45474c] transition-colors hover:text-[#22c55e] [font-family:var(--font-kinetic-body),system-ui,sans-serif]"
                                >
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/terms"
                                    className="text-sm text-[#45474c] transition-colors hover:text-[#22c55e] [font-family:var(--font-kinetic-body),system-ui,sans-serif]"
                                >
                                    Terms of Service
                                </Link>
                            </li>
                            <li>
                                <button
                                    type="button"
                                    onClick={() => requestOpenCookieSettings()}
                                    className="text-left text-sm text-[#45474c] transition-colors hover:text-[#22c55e] [font-family:var(--font-kinetic-body),system-ui,sans-serif]"
                                >
                                    Cookie settings
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-[#c6c6cc]/10 pt-6">
                    <div className="flex items-center gap-1 text-[11px] tracking-wide text-[#45474c] [font-family:var(--font-kinetic-body),system-ui,sans-serif]">
                        <span>© {year}</span>
                        <span className="font-bold text-[#1b1b1d]">
                            <BrandName className="text-[11px] font-bold text-[#1b1b1d]" />
                            .
                        </span>
                        <span>All rights reserved.</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}
