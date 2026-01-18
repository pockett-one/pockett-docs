import { cn } from "@/lib/utils"
import { FAQItem } from "@/data/faq-data"
import { Loader2, Sparkles, User, HelpCircle, MessageCircleQuestion, Copy, Check } from "lucide-react"
import { useState, useEffect } from "react"

export interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    items?: FAQItem[] // Optional FAQ items to render
    isTyping?: boolean
    timestamp: number
    disableAnimation?: boolean
}

interface ChatMessageProps {
    message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
    const isUser = message.role === 'user'
    // Initialize state properly to avoid hydration mismatches or instant flash
    const [displayedContent, setDisplayedContent] = useState(
        (isUser || message.disableAnimation) ? message.content : ""
    )
    const [isTypingDone, setIsTypingDone] = useState(
        (isUser || message.disableAnimation) ? true : false
    )
    const [isCopied, setIsCopied] = useState(false)

    useEffect(() => {
        if (isUser || !message.content || message.disableAnimation) {
            setDisplayedContent(message.content)
            setIsTypingDone(true)
            return
        }

        // Typewriter effect for assistant
        let currentIndex = 0
        const text = message.content
        const speed = 20 // ms per char

        const interval = setInterval(() => {
            if (currentIndex < text.length) {
                setDisplayedContent(text.slice(0, currentIndex + 1))
                currentIndex++
            } else {
                clearInterval(interval)
                setIsTypingDone(true)
            }
        }, speed)

        return () => clearInterval(interval)
    }, [message.content, isUser, message.disableAnimation])

    const handleCopy = () => {
        if (!message.content) return
        const textToCopy = [
            message.content,
            ...(message.items?.map(i => `Q: ${i.question}\nA: ${i.answer}`) || [])
        ].join("\n\n")

        navigator.clipboard.writeText(textToCopy)
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
    }

    return (
        <div className={cn(
            "flex w-full mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300",
            isUser ? "justify-end" : "justify-start"
        )}>
            <div className={cn(
                "flex gap-4",
                isUser ? "max-w-[85%] md:max-w-[70%] flex-row-reverse" : "w-full flex-row"
            )}>
                {/* Avatar */}
                <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border",
                    isUser
                        ? "bg-slate-100 border-slate-200 text-slate-600"
                        : "bg-gradient-to-br from-purple-600 to-indigo-600 border-transparent text-white shadow-purple-500/20"
                )}>
                    {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div className={cn(
                    "relative p-5 rounded-2xl shadow-sm border text-sm md:text-base leading-relaxed whitespace-pre-wrap overflow-hidden group/bubble",
                    isUser
                        ? "bg-slate-50 border-slate-200 text-slate-800 rounded-tr-none"
                        : "bg-white border-purple-100 text-slate-800 rounded-tl-none shadow-purple-900/5"
                )}>
                    {/* Copy Button */}
                    {!isUser && !message.isTyping && (
                        <div className="absolute top-3 right-3 opacity-0 group-hover/bubble:opacity-100 transition-opacity z-10">
                            <button
                                onClick={handleCopy}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors bg-white/50 backdrop-blur-sm border border-slate-200/50"
                                title="Copy to clipboard"
                            >
                                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                    )}

                    <div>
                        {message.isTyping ? (
                            <div className="flex items-center space-x-1.5 h-6">
                                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" />
                            </div>
                        ) : (
                            displayedContent
                        )}
                    </div>

                    {/* FAQ Items (render inside the bubble) */}
                    {isTypingDone && message.items && message.items.length > 0 && (
                        <div className="space-y-3 pt-6 mt-4 border-t border-slate-100">
                            {message.items.map((item, idx) => (
                                <div key={idx} className="bg-slate-50 rounded-xl border border-slate-200 p-4 hover:border-purple-200 hover:bg-white transition-all duration-300 animate-in fade-in zoom-in-95 fill-mode-forwards group/card"
                                    style={{ animationDelay: `${idx * 150}ms` }}
                                >
                                    <div className="flex gap-3 items-start">
                                        <div className="p-1.5 bg-white shadow-sm text-purple-600 rounded-lg shrink-0 mt-0.5 group-hover/card:bg-purple-50 transition-colors border border-slate-100">
                                            <MessageCircleQuestion className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-900 text-base mb-1">{item.question}</h4>
                                            <div className="text-slate-600 text-sm leading-relaxed"
                                                dangerouslySetInnerHTML={{ __html: item.displayAnswer || item.answer }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
