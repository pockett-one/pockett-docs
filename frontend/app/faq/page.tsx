"use client"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import Link from "next/link"
import { ChevronRight, Home, HelpCircle, Search, MessageSquare, Loader2, Sparkles, X, MessageCircleQuestion } from "lucide-react"
import { FAQ_DATA, FAQItem } from "@/data/faq-data"
import { useState, useEffect } from "react"
import { faqSearch } from "@/lib/faq-search"

export default function FAQPage() {
    const [searchQuery, setSearchQuery] = useState("")
    const [filteredFAQs, setFilteredFAQs] = useState<FAQItem[]>(FAQ_DATA)
    const [isSearching, setIsSearching] = useState(false)
    const [isAiReady, setIsAiReady] = useState(false)

    // Check AI status
    useEffect(() => {
        // Poll for AI readiness
        const checkReady = setInterval(() => {
            if (faqSearch.isReady()) {
                setIsAiReady(true)
                clearInterval(checkReady)
            }
        }, 1000)
        return () => clearInterval(checkReady)
    }, [])

    // Search Effect
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (!searchQuery.trim()) {
                setFilteredFAQs(FAQ_DATA)
                return
            }

            setIsSearching(true)

            try {
                // Perform search
                const results = await faqSearch.search(searchQuery, FAQ_DATA)

                // Update state
                setFilteredFAQs(results.map(r => r.item))
            } catch (e) {
                console.error('[FAQPage] Search error:', e)
                // Fallback to simple local filter on crash
                const fallback = FAQ_DATA.filter(faq =>
                    faq.question.toLowerCase().includes(searchQuery.toLowerCase())
                )
                setFilteredFAQs(fallback)
            } finally {
                setIsSearching(false)
            }
        }, 300) // Debounce

        return () => clearTimeout(timer)
    }, [searchQuery, isAiReady])

    return (
        <div className="min-h-screen bg-white flex flex-col relative overflow-hidden font-sans selection:bg-purple-500 selection:text-white">

            {/* Background Ambience */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                {/* Dot Grid */}
                <div className="absolute inset-0 opacity-[0.4]"
                    style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
                </div>
                {/* Subtle Purple Haze */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-100/40 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-slate-100/50 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />
            </div>

            <Header />

            {/* Main Content */}
            <div className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12 w-full relative z-10">
                {/* Breadcrumb */}
                <div className="mb-6 flex items-center space-x-2 text-sm text-slate-500">
                    <Link href="/" className="hover:text-purple-600 transition-colors p-1 -ml-1 hover:bg-purple-50 rounded-md">
                        <Home className="h-4 w-4" />
                        <span className="sr-only">Home</span>
                    </Link>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                    <span className="font-medium text-slate-900">FAQs</span>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-purple-900/5 border border-slate-200 overflow-hidden">
                    {/* Page Header */}
                    <div className="bg-gradient-to-r from-purple-50/50 to-slate-50/50 px-8 py-12 border-b border-slate-100 relative">
                        {/* AI Badge */}
                        <div className="absolute top-6 right-6">
                            {isAiReady ? (
                                <div className="flex items-center space-x-2 px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold rounded-full shadow-lg shadow-purple-500/30 animate-in fade-in zoom-in duration-300 ring-1 ring-white/20">
                                    <Sparkles className="w-3.5 h-3.5 text-purple-100" />
                                    <span>AI Powered</span>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-2 px-4 py-1.5 bg-white/50 backdrop-blur text-slate-500 text-xs font-medium rounded-full border border-slate-200 shadow-sm">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-500" />
                                    <span>Initializing AI...</span>
                                </div>
                            )}
                        </div>

                        <div className="text-center">
                            <div className="inline-flex items-center justify-center p-3 bg-white rounded-xl shadow-sm border border-slate-100 mb-6">
                                <HelpCircle className="h-8 w-8 text-purple-600" />
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Frequently Asked Questions</h1>
                            <p className="text-slate-500 font-medium max-w-2xl mx-auto mb-8">
                                Everything you need to know about Pockett's features, security, and Google Drive integration.
                            </p>

                            {/* Conversational Search Input */}
                            <div className="max-w-xl mx-auto relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <MessageSquare className="h-5 w-5 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search for answers... (e.g. 'security', 'audit logs')"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="block w-full pl-11 pr-12 py-4 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-sm transition-all text-lg font-medium"
                                />
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                                    {isSearching ? (
                                        <Loader2 className="h-5 w-5 text-purple-500 animate-spin" />
                                    ) : searchQuery ? (
                                        <button
                                            onClick={() => {
                                                setSearchQuery("")
                                                setFilteredFAQs(FAQ_DATA)
                                            }}
                                            className="p-1 hover:bg-slate-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                            aria-label="Clear search"
                                        >
                                            <X className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                                        </button>
                                    ) : (
                                        <Search className="h-5 w-5 text-slate-400 pointer-events-none" />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-8 py-12 min-h-[400px]">
                        {isSearching ? (
                            <div className="space-y-12">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="animate-pulse">
                                        <div className="flex gap-4 mb-4">
                                            <div className="w-10 h-10 bg-slate-100 rounded-lg shrink-0" />
                                            <div className="h-8 bg-slate-100 rounded-md w-3/4 mt-1" />
                                        </div>
                                        <div className="pl-14 space-y-3">
                                            <div className="h-4 bg-slate-100 rounded w-full" />
                                            <div className="h-4 bg-slate-100 rounded w-11/12" />
                                            <div className="h-4 bg-slate-100 rounded w-4/6" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredFAQs.length > 0 ? (
                            <div className="space-y-12">
                                {filteredFAQs.map((faq, index) => (
                                    <div key={index} className="animate-in fade-in slide-in-from-bottom-2 duration-300 group">
                                        <div className="flex gap-4 items-start">
                                            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl shrink-0 group-hover:scale-110 group-hover:bg-purple-100 transition-all duration-300 shadow-sm border border-purple-100">
                                                <MessageCircleQuestion className="w-6 h-6" />
                                            </div>
                                            <div className="space-y-3 pt-0.5">
                                                <h3 className="text-xl font-bold text-slate-900 leading-tight">
                                                    {faq.question}
                                                </h3>
                                                <div className="text-slate-600 leading-relaxed text-lg"
                                                    dangerouslySetInnerHTML={{ __html: faq.displayAnswer || faq.answer }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-50 rounded-full mb-4">
                                    <Search className="h-8 w-8 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">No results found</h3>
                                <p className="text-slate-500">
                                    We couldn't find any answers matching "{searchQuery}".<br />
                                    Try using different keywords or <Link href="/contact" className="text-purple-600 hover:text-purple-700 font-medium">contact support</Link>.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    )
}
