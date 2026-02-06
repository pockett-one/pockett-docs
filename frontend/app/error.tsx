'use client'

import { useEffect, useState } from 'react'
import { logger } from '@/lib/logger'
import { AlertCircle, Home, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Global error handler for app router
 * Catches errors in app router pages
 */
export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error
        logger.error(
            'Page error occurred',
            error,
            'GlobalError',
            {
                digest: error.digest,
            }
        )
    }, [error])

    const [feedback, setFeedback] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)

    const handleSubmit = async () => {
        if (!feedback.trim()) return

        setIsSubmitting(true)
        try {
            // Dynamically import to avoid server-action-in-client-component issues if any, 
            // though standard import works if action is 'use server'.
            const { submitErrorTicket } = await import('@/app/actions/submit-ticket')

            await submitErrorTicket({
                description: feedback,
                type: 'BUG',
                errorDetails: {
                    message: error.message,
                    stack: error.stack,
                    digest: error.digest,
                    url: window.location.href
                },
                metadata: {
                    userAgent: window.navigator.userAgent,
                    screen: {
                        width: window.screen.width,
                        height: window.screen.height
                    }
                },
                // Extract Slugs from URL
                // Pattern: /o/:orgSlug/c/:clientSlug/p/:projectSlug
                // or just some of them
                ...(() => {
                    const path = window.location.pathname
                    // Simple regex extraction
                    const orgMatch = path.match(/\/o\/([^\/]+)/)
                    const clientMatch = path.match(/\/c\/([^\/]+)/)
                    const projectMatch = path.match(/\/p\/([^\/]+)/)

                    return {
                        orgSlug: orgMatch ? orgMatch[1] : undefined,
                        clientSlug: clientMatch ? clientMatch[1] : undefined,
                        projectSlug: projectMatch ? projectMatch[1] : undefined
                    }
                })()
            })
            setIsSubmitted(true)
        } catch (err) {
            console.error('Failed to submit feedback', err)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
            <div className="max-w-lg w-full bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
                <div className="flex flex-col items-center text-center">
                    <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-6">
                        <AlertCircle className="h-8 w-8 text-gray-900" />
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Something went wrong
                    </h1>

                    <p className="text-gray-600 mb-8 max-w-sm">
                        We encountered an unexpected error. Please help us fix it by checking the details below.
                    </p>

                    {/* Feedback Form */}
                    {!isSubmitted ? (
                        <div className="w-full mb-8 text-left bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                What were you doing when this happened?
                            </label>
                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="E.g., I clicked the 'Save' button..."
                                className="w-full h-24 p-3 text-sm border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
                            />
                            <div className="mt-3 flex justify-end">
                                <Button
                                    onClick={handleSubmit}
                                    disabled={!feedback.trim() || isSubmitting}
                                    size="sm"
                                    className="bg-gray-900 text-white hover:bg-gray-800"
                                >
                                    {isSubmitting ? 'Sending...' : 'Send Report'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col items-center animate-in fade-in zoom-in-95">
                            <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                                <RefreshCw className="h-4 w-4 text-gray-900" />
                            </div>
                            <p className="text-sm font-medium text-gray-900">Thank you! Report submitted.</p>
                        </div>
                    )}

                    {process.env.NODE_ENV === 'development' && (
                        <details className="w-full mb-6 text-left">
                            <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700 mb-2 select-none">
                                Error details (development only)
                            </summary>
                            <div className="bg-gray-50 p-4 rounded border border-gray-200 custom-scrollbar overflow-auto max-h-60">
                                <p className="text-xs font-mono text-gray-700 mb-2 break-words">
                                    {error.message}
                                </p>
                                {error.digest && (
                                    <p className="text-xs text-gray-500 mb-2">
                                        Digest: {error.digest}
                                    </p>
                                )}
                                <pre className="text-[10px] text-gray-700 whitespace-pre-wrap">
                                    {error.stack}
                                </pre>
                            </div>
                        </details>
                    )}

                    <div className="flex gap-3 w-full sm:w-auto">
                        <Button
                            onClick={reset}
                            className="gap-2 w-full sm:w-auto bg-gray-900 text-white hover:bg-black"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Try again
                        </Button>
                        <Button
                            onClick={() => window.location.href = '/'}
                            variant="outline"
                            className="gap-2 w-full sm:w-auto"
                        >
                            <Home className="h-4 w-4" />
                            Go home
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
