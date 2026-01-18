"use client"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import Link from "next/link"
import { ChevronRight, Home, Send, Trash2, Tag, Sparkles, HelpCircle } from "lucide-react"
import { FAQ_DATA, FAQItem } from "@/data/faq-data"
import { useState, useEffect, useRef } from "react"
import { faqSearch } from "@/lib/faq-search"
import { ChatInterface } from "@/components/faq/ChatInterface"
import { Message } from "@/components/faq/ChatMessage"
import { v4 as uuidv4 } from 'uuid'
import nlp from 'compromise'

const INITIAL_MESSAGE: Message = {
    id: 'init-1',
    role: 'assistant',
    content: "Hi there! I'm your Pockett assistant. \n\nI can help you with questions about security, Google Drive integration, or how to manage your Client Portals.\n\nWhat's on your mind?",
    timestamp: Date.now()
}

export default function FAQPage() {
    const [viewMode, setViewMode] = useState<'list' | 'chat'>('list')
    const [messages, setMessages] = useState<Message[]>([])
    const [inputValue, setInputValue] = useState("")
    const [isThinking, setIsThinking] = useState(false)
    const [isAiReady, setIsAiReady] = useState(false)
    const [isHistoryLoaded, setIsHistoryLoaded] = useState(false) // New State
    const chatContainerRef = useRef<HTMLDivElement>(null)

    // Static FAQ State
    const [activeFilter, setActiveFilter] = useState("All")
    const categories = ["All", ...Array.from(new Set(FAQ_DATA.map(f => f.category || "General")))]

    const filteredStaticFAQs = activeFilter === "All"
        ? FAQ_DATA
        : FAQ_DATA.filter(f => (f.category || "General") === activeFilter)


    // Sync Tab with URL Hash
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const hash = window.location.hash
            if (hash === '#chat') setViewMode('chat')
            else if (hash === '#browse') setViewMode('list')
        }
    }, [])

    const switchTab = (mode: 'list' | 'chat') => {
        setViewMode(mode)
        window.location.hash = mode === 'chat' ? 'chat' : 'browse'
    }

    // Load AI Service
    useEffect(() => {
        const initAI = async () => {
            if (faqSearch.isReady()) {
                setIsAiReady(true)
            } else {
                // Initialize in background
                const ready = await faqSearch.initialize(FAQ_DATA)
                setIsAiReady(ready)
            }
        }
        initAI()
    }, [])

    // Load Session with 24h Expiry
    useEffect(() => {
        // Small delay to ensure client hydration is stable and show skeleton briefly for smoothness
        const timer = setTimeout(() => {
            const saved = localStorage.getItem('pockett-faq-chat-v1')
            let loadedMessages = [INITIAL_MESSAGE]
            const ONE_DAY_MS = 24 * 60 * 60 * 1000

            if (saved) {
                try {
                    const parsed = JSON.parse(saved)
                    // Check expiry (24 hours) and validity
                    if (parsed.timestamp && (Date.now() - parsed.timestamp < ONE_DAY_MS) && Array.isArray(parsed.messages)) {
                        loadedMessages = parsed.messages
                    } else {
                        // Expired
                        localStorage.removeItem('pockett-faq-chat-v1')
                    }
                } catch (e) {
                    console.error("Failed to parse history", e)
                }
            }

            // Disable animation for ALL history messages
            const formatted = loadedMessages.map(m => ({
                ...m,
                disableAnimation: true
            }))

            setMessages(formatted)
            setIsHistoryLoaded(true)
        }, 500) // 500ms artificial delay to show skeleton

        return () => clearTimeout(timer)
    }, [])

    // Save Session
    useEffect(() => {
        if (messages.length > 0 && isHistoryLoaded) {
            const data = {
                timestamp: Date.now(),
                messages: messages
            }
            localStorage.setItem('pockett-faq-chat-v1', JSON.stringify(data))
        }
    }, [messages, isHistoryLoaded])

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return

        const userMsg: Message = {
            id: uuidv4(),
            role: 'user',
            content: inputValue.trim(),
            timestamp: Date.now()
        }

        setMessages(prev => [...prev, userMsg])
        setInputValue("")
        setIsThinking(true)

        // Add temporary "thinking" message
        const thinkingId = uuidv4()
        setMessages(prev => [...prev, {
            id: thinkingId,
            role: 'assistant',
            content: "",
            isTyping: true,
            timestamp: Date.now()
        }])

        // Simulate network/thinking delay
        const delay = Math.random() * 1000 + 800 // 800ms - 1800ms
        await new Promise(r => setTimeout(r, delay))

        try {
            // Search
            const results = await faqSearch.search(userMsg.content, FAQ_DATA)

            let botResponse: Message = {
                id: uuidv4(),
                role: 'assistant',
                content: "",
                timestamp: Date.now()
            }

            if (results.length === 0) {
                botResponse.content = "I'm not sure about that one. \n\nCould you try rephrasing? Or feel free to contact our support team directly."
            } else if (results.length === 1 && results[0].score > 0.75) {
                // High confidence single match
                botResponse.content = "Here is what I found:"
                botResponse.items = [results[0].item]
            } else {
                // Smart Filtering & Summarization
                // Only include results that are relevant enough (> 0.45)
                const relevantResults = results.filter(r => r.score > 0.45)

                // If relevant results exist, summarize them (up to 3)
                // If NO relevant results but some exist (low score), strip summary and just show cards

                const targets = relevantResults.length > 0 ? relevantResults.slice(0, 3) : results.slice(0, 2)

                if (relevantResults.length > 0) {
                    // Generate a "Table of Contents" style summary from Questions
                    const summaryPoints = targets.map(r => {
                        let q = r.item.question

                        // Convert Question to Topic by stripping prefixes
                        const prefixes = [
                            "How do I", "How does", "How to", "Can I", "Do I need",
                            "What is", "What are", "Is there", "Does Pockett", "Why should I"
                        ]

                        // Simple prefix stripping (case insensitive)
                        for (const prefix of prefixes) {
                            if (q.toLowerCase().startsWith(prefix.toLowerCase())) {
                                q = q.slice(prefix.length).trim()
                                break
                            }
                        }

                        q = q.replace(/\?+$/, "") // Remove trailing ?

                        return q.charAt(0).toUpperCase() + q.slice(1)
                    })

                    const summaryList = summaryPoints.map(s => `• ${s}`).join("\n")
                    botResponse.content = `I found a few relevant topics that might help:\n\n${summaryList}`
                } else {
                    botResponse.content = "I found these mentions, though they might not fully answer your question:"
                }

                botResponse.items = targets.map(r => r.item)
            }

            // Replace thinking message with actual response
            setMessages(prev => prev.map(m => m.id === thinkingId ? botResponse : m))

        } catch (e) {
            console.error("Search failed", e)
            setMessages(prev => prev.map(m => m.id === thinkingId ? {
                id: uuidv4(),
                role: 'assistant',
                content: "I'm having a bit of trouble connecting to my brain right now. Please try again in a moment.",
                timestamp: Date.now()
            } : m))
        } finally {
            setIsThinking(false)
        }
    }

    const handleClearChat = () => {
        setMessages([INITIAL_MESSAGE])
        localStorage.removeItem('pockett-faq-chat-v1')
    }

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

                {/* Page Title - Full Width */}
                <div className="mb-12 text-center md:text-left">
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">
                        Frequently Asked Questions
                    </h1>
                    <p className="text-slate-500 text-lg font-medium max-w-xl">
                        Everything you need to know about Pockett's features, security, and Google Drive integration.
                    </p>
                </div>

                {/* Toggle Switcher */}
                <div className="flex justify-center mb-10">
                    <div className="bg-slate-100 p-1.5 rounded-2xl inline-flex gap-1 relative border border-slate-200 shadow-inner">
                        <button
                            onClick={() => switchTab('list')}
                            className={`px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${viewMode === 'list'
                                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                                }`}
                        >
                            <Tag className="w-4 h-4" />
                            Browse FAQs
                        </button>
                        <button
                            onClick={() => switchTab('chat')}
                            className={`px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${viewMode === 'chat'
                                ? "bg-white text-purple-700 shadow-sm ring-1 ring-purple-100"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                                }`}
                        >
                            <Sparkles className="w-4 h-4" />
                            Ask AI Assistant
                        </button>
                    </div>
                </div>

                {/* VIEW: Static List */}
                {viewMode === 'list' && (
                    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Filters */}
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

                        {/* List */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredStaticFAQs.map((faq, idx) => (
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

                        {filteredStaticFAQs.length === 0 && (
                            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                    <HelpCircle className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900">No questions found</h3>
                                <p className="text-slate-500">Try selecting a different topic.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* VIEW: Chatbot */}
                {viewMode === 'chat' && (
                    <div className="w-full mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 relative min-h-[60vh]">
                        {/* Header Status (Simple) */}
                        <div className="flex justify-center mb-4">
                            {isAiReady ? (
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100 text-xs font-medium text-emerald-700">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    AI Online
                                </div>
                            ) : (
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-50 rounded-full border border-yellow-100 text-xs font-medium text-yellow-700">
                                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                                    Connecting...
                                </div>
                            )}
                            {messages.length > 2 && (
                                <button onClick={handleClearChat} className="ml-2 text-xs text-slate-400 hover:text-red-500 underline decoration-slate-300 underline-offset-2">
                                    Clear History
                                </button>
                            )}
                        </div>

                        {/* Chat Area - Natural Flow */}
                        <div className="pb-24">
                            {!isHistoryLoaded ? (
                                <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-pulse opacity-50">
                                    <div className="flex justify-start w-full">
                                        <div className="bg-slate-200 h-24 w-[60%] rounded-2xl rounded-tl-none"></div>
                                    </div>
                                    <div className="flex justify-end w-full">
                                        <div className="bg-slate-200 h-16 w-[30%] rounded-2xl rounded-tr-none"></div>
                                    </div>
                                    <div className="flex justify-start w-full">
                                        <div className="bg-slate-200 h-40 w-[70%] rounded-2xl rounded-tl-none"></div>
                                    </div>
                                </div>
                            ) : (
                                <ChatInterface messages={messages} />
                            )}
                        </div>

                        {/* Sticky Input Area */}
                        <div className="sticky bottom-6 mx-auto max-w-4xl z-30 px-4">
                            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 ring-1 ring-slate-900/5 relative">
                                <div className="relative flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && !isThinking && handleSendMessage()}
                                        placeholder={isThinking ? "Thinking..." : "How do I secure my files?"}
                                        disabled={isThinking}
                                        className="flex-1 bg-transparent border-none text-slate-900 placeholder-slate-400 text-base px-4 py-3 focus:outline-none focus:ring-0 disabled:opacity-50"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!inputValue.trim() || isThinking}
                                        className="p-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl transition-all shadow-sm active:scale-95 disabled:active:scale-100"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="text-center mt-3">
                                <p className="text-[10px] text-slate-400 font-medium">Pockett AI can make mistakes. Verify important info.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    )
}
