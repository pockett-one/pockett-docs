"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"

interface CodeBlockProps {
    code: string
    language?: string
    filename?: string
}

export function CodeBlock({ code, language = "text", filename }: CodeBlockProps) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
            {filename && (
                <div className="bg-gray-100 px-4 py-2.5 text-xs text-gray-600 font-mono border-b border-gray-200">
                    {filename}
                </div>
            )}
            <div className="relative">
                <button
                    onClick={handleCopy}
                    className="absolute top-3 right-3 p-1.5 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                    title="Copy code"
                >
                    {copied ? (
                        <Check className="h-4 w-4 text-green-600" />
                    ) : (
                        <Copy className="h-4 w-4" />
                    )}
                </button>
                <pre className="p-4 overflow-x-auto">
                    <code className="text-sm text-gray-800 font-mono">
                        {code}
                    </code>
                </pre>
            </div>
        </div>
    )
}
