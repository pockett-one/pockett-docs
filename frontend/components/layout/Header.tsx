"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Logo from "@/components/Logo"

interface HeaderProps {
    onOpenModal?: (modalName: string) => void;
}

export function Header({ onOpenModal }: HeaderProps) {
    return (
        <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
            <header className="bg-white/90 backdrop-blur-xl border border-slate-200 shadow-sm rounded-full pl-6 pr-3 py-2 w-full max-w-7xl flex justify-between items-center transition-all duration-300 hover:shadow-md">
                <div className="flex items-center">
                    <Link href="/" className="flex items-center transition-opacity duration-200 hover:opacity-80">
                        <Logo size="md" />
                    </Link>
                </div>

                <nav className="hidden md:flex items-center gap-2">
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

                <div className="flex items-center gap-3">
                    <Link href="/dash/auth" className="hidden sm:block">
                        <Button
                            className="rounded-full px-6 py-2.5 h-auto text-sm font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200"
                        >
                            Get Started
                        </Button>
                    </Link>
                </div>
            </header>
        </div>
    )
}
