"use client"

import Link from "next/link"
import { Mail, Share2, Code } from "lucide-react"
import { BrandName } from "@/components/brand/BrandName"
import { platformEmail } from "@/config/platform-domain"
import { requestOpenCookieSettings } from "@/lib/cookie-consent-storage"
import { MARKETING_PAGE_SHELL } from "@/lib/marketing/page-shell"
import { cn } from "@/lib/utils"

interface FooterProps {
    onOpenModal?: (modalName: string) => void
}

/** Global marketing footer — matches `docs/design/v4/landing-v4.html` (white, kinetic columns). */
export function Footer({ onOpenModal: _onOpenModal }: FooterProps) {
    const infoEmail = platformEmail("info")
    const year = new Date().getFullYear()

    return (
        <footer className="border-t border-[#c6c6cc]/10 bg-white pb-12 pt-24 text-[#1b1b1d]">
            <div className={cn(MARKETING_PAGE_SHELL, "w-full")}>
                <div className="mb-20 grid grid-cols-1 gap-12 md:grid-cols-12">
                    <div className="md:col-span-5">
                        <div className="mb-6">
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
                        <p className="mb-8 max-w-sm leading-relaxed text-[#45474c] [font-family:var(--font-kinetic-body),system-ui,sans-serif]">
                            Simple insights &amp; control over Google Drive for freelancers, consultants &amp; small agencies. No
                            per-seat tax.
                        </p>
                        <div className="flex flex-wrap items-center gap-6">
                            <div className="inline-flex items-center gap-2 rounded-full border border-[#c6c6cc] bg-[#f6f3f4] px-3 py-1.5">
                                <span
                                    className="h-2 w-2 rounded-full bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                                    aria-hidden
                                />
                                <span className="text-[10px] font-bold uppercase tracking-widest [font-family:var(--font-kinetic-headline),system-ui,sans-serif]">
                                    Systems Online
                                </span>
                            </div>
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
                        <h4 className="mb-6 text-sm font-bold text-[#1b1b1d] [font-family:var(--font-kinetic-headline),system-ui,sans-serif]">
                            Product
                        </h4>
                        <ul className="space-y-4">
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
                        <h4 className="mb-6 text-sm font-bold text-[#1b1b1d] [font-family:var(--font-kinetic-headline),system-ui,sans-serif]">
                            Resources
                        </h4>
                        <ul className="space-y-4">
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
                        <h4 className="mb-6 text-sm font-bold text-[#1b1b1d] [font-family:var(--font-kinetic-headline),system-ui,sans-serif]">
                            Legal
                        </h4>
                        <ul className="space-y-4">
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

                <div className="flex flex-col items-center justify-between gap-6 border-t border-[#c6c6cc]/10 pt-8 md:flex-row">
                    <div className="flex items-center gap-1 text-[11px] tracking-wide text-[#45474c] [font-family:var(--font-kinetic-body),system-ui,sans-serif]">
                        <span>© {year}</span>
                        <span className="font-bold text-[#1b1b1d]">
                            <BrandName className="text-[11px] font-bold text-[#1b1b1d]" />
                            .
                        </span>
                        <span>All rights reserved.</span>
                    </div>
                    <div className="flex gap-4">
                        <a
                            href="/blog"
                            className={cn(
                                "flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#c6c6cc] bg-[#f6f3f4] transition-all hover:border-[#22c55e]",
                                "group",
                            )}
                            aria-label="Blog"
                        >
                            <Share2 className="h-4 w-4 text-[#45474c] group-hover:text-[#22c55e]" aria-hidden />
                        </a>
                        <a
                            href="/resources/docs"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                                "flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#c6c6cc] bg-[#f6f3f4] transition-all hover:border-[#22c55e]",
                                "group",
                            )}
                            aria-label="Documentation"
                        >
                            <Code className="h-4 w-4 text-[#45474c] group-hover:text-[#22c55e]" aria-hidden />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
