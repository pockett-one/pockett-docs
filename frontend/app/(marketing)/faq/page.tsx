"use client"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import Link from "next/link"
import { ChevronRight, Home, Tag, HelpCircle } from "lucide-react"
import { FAQ_DATA } from "@/data/faq-data"
import { useState } from "react"

export default function FAQPage() {
    const [activeFilter, setActiveFilter] = useState("All")
    const categories = ["All", ...Array.from(new Set(FAQ_DATA.map(f => f.category || "General")))]

    const filteredFAQs = activeFilter === "All"
        ? FAQ_DATA
        : FAQ_DATA.filter(f => (f.category || "General") === activeFilter)

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-purple-500 selection:text-white">
            {/* Background Ambience */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 opacity-[0.4]"
                    style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
                </div>
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-100/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-slate-200/50 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4" />
            </div>

            <Header />

            <div className="flex-grow pt-36 pb-12 px-4 sm:px-6 relative z-10 w-full max-w-7xl mx-auto">
                {/* Breadcrumb */}
                <div className="mb-8 flex items-center space-x-2 text-sm text-slate-500">
                    <Link href="/" className="hover:text-purple-600 transition-colors p-1 -ml-1 hover:bg-purple-50 rounded-md">
                        <Home className="h-4 w-4" />
                        <span className="sr-only">Home</span>
                    </Link>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                    <span className="font-medium text-slate-900">Support Center</span>
                </div>

                {/* Page Title */}
                <div className="mb-12 text-center md:text-left">
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">
                        Frequently Asked Questions
                    </h1>
                    <p className="text-slate-500 text-lg font-medium max-w-xl">
                        Everything you need to know about Pockett's features, security, and Google Drive integration.
                    </p>
                </div>

                {/* FAQ List */}
                <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Category Filters */}
                    <div className="flex flex-col gap-4 items-center">
                        <div className="flex flex-wrap justify-center gap-2">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveFilter(cat)}
                                    className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${activeFilter === cat
                                        ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-105"
                                        : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 hover:border-slate-300"
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* FAQ Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredFAQs.map((faq, idx) => (
                            <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-900/5 transition-all duration-300 group flex flex-col">
                                <div className="mb-4">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wide">
                                        <Tag className="w-3 h-3 mr-1.5" />
                                        {faq.category || "General"}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-purple-600 transition-colors">
                                    {faq.question}
                                </h3>
                                <div
                                    className="text-slate-600 leading-relaxed text-sm flex-grow prose prose-p:my-1 prose-strong:text-slate-900 prose-strong:font-semibold"
                                    dangerouslySetInnerHTML={{ __html: faq.displayAnswer || faq.answer }}
                                />
                            </div>
                        ))}
                    </div>

                    {filteredFAQs.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                <HelpCircle className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900">No questions found</h3>
                            <p className="text-slate-500">Try selecting a different topic.</p>
                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </div>
    )
}
