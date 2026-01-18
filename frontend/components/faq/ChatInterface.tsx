import { useRef, useEffect } from "react"
import { Message, ChatMessage } from "./ChatMessage"

interface ChatInterfaceProps {
    messages: Message[]
    className?: string
}

export function ChatInterface({ messages, className }: ChatInterfaceProps) {
    const bottomRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    return (
        <div className={`flex flex-col w-full max-w-6xl mx-auto ${className}`}>
            <div className="flex-1 px-4 py-8 space-y-6">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
                        {/* Empty state handles in parent or here if needed */}
                    </div>
                ) : (
                    <>
                        {messages.map((msg) => (
                            <ChatMessage key={msg.id} message={msg} />
                        ))}
                        <div ref={bottomRef} />
                    </>
                )}
            </div>
        </div>
    )
}
