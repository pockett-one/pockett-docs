'use client'

import React, { Component, ReactNode } from 'react'
import { logger } from '@/lib/logger'
import { AlertCircle, RefreshCw, Copy, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
    children: ReactNode
    fallback?: ReactNode
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void
    context?: string
}

interface State {
    hasError: boolean
    error: Error | null
    copied: boolean
    feedback: string
    isSubmitting: boolean
    reportSubmitted: boolean
}

/**
 * Reusable error boundary component
 * Catches rendering errors in component tree and shows fallback UI
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = {
            hasError: false,
            error: null,
            copied: false,
            feedback: '',
            isSubmitting: false,
            reportSubmitted: false,
        }
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return {
            hasError: true,
            error,
            copied: false,
            feedback: '',
            isSubmitting: false,
            reportSubmitted: false,
        }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log error with context
        logger.error(
            `Error in component tree`,
            error,
            this.props.context || 'ErrorBoundary',
            {
                componentStack: errorInfo.componentStack,
            }
        )

        // Call custom error handler if provided
        this.props.onError?.(error, errorInfo)
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, copied: false })
    }

    handleCopyDetails = async () => {
        if (!this.state.error) return

        const { message, stack } = this.state.error
        const text = `${message}${stack ? `\n\n${stack}` : ''}`

        try {
            await navigator.clipboard?.writeText(text)
            this.setState({ copied: true })
            window.setTimeout(() => {
                this.setState((prev) =>
                    prev.hasError ? { ...prev, copied: false } : prev
                )
            }, 2000)
        } catch {
            // ignore clipboard errors
        }
    }

    extractSlugsFromPath = (): {
        orgSlug?: string
        clientSlug?: string
        projectSlug?: string
    } => {
        if (typeof window === 'undefined') return {}
        const path = window.location.pathname
        const orgMatch = path.match(/\/o\/([^/]+)/)
        const clientMatch = path.match(/\/c\/([^/]+)/)
        const projectMatch = path.match(/\/p\/([^/]+)/)
        return {
            orgSlug: orgMatch ? orgMatch[1] : undefined,
            clientSlug: clientMatch ? clientMatch[1] : undefined,
            projectSlug: projectMatch ? projectMatch[1] : undefined,
        }
    }

    handleSubmitReport = async () => {
        const { error, feedback } = this.state
        if (!error || !feedback.trim()) return

        this.setState({ isSubmitting: true })
        try {
            const { submitErrorTicket } = await import('@/app/actions/submit-ticket')
            await submitErrorTicket({
                description: feedback.trim(),
                type: 'BUG',
                errorDetails: {
                    message: error.message,
                    stack: error.stack,
                    url: typeof window !== 'undefined' ? window.location.href : undefined,
                    context: this.props.context,
                },
                metadata: {
                    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
                    screen:
                        typeof window !== 'undefined'
                            ? { width: window.screen.width, height: window.screen.height }
                            : undefined,
                },
                ...this.extractSlugsFromPath(),
            })
            this.setState({ reportSubmitted: true })
        } catch (err) {
            logger.error('Failed to submit error report', err as Error, 'ErrorBoundary')
        } finally {
            this.setState({ isSubmitting: false })
        }
    }

    render() {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback
            }

            // Default fallback UI
            const { reportSubmitted, feedback, isSubmitting } = this.state
            return (
                <div className="flex items-center justify-center min-h-[400px] p-6">
                    <div className="max-w-lg w-full bg-white rounded-lg border border-red-200 p-6 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                                <AlertCircle className="h-6 w-6 text-red-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Something went wrong
                                </h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    We encountered an error while rendering this section.
                                    You can try again or report it so we look into it on priority.
                                </p>

                                {/* Report this error */}
                                {!reportSubmitted ? (
                                    <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Report this error
                                        </label>
                                        <p className="text-xs text-gray-500 mb-2">
                                            What were you doing when this happened? We’ll review your report and follow up.
                                        </p>
                                        <textarea
                                            value={feedback}
                                            onChange={(e) => this.setState({ feedback: e.target.value })}
                                            placeholder="E.g., I was opening the Files tab..."
                                            className="w-full h-20 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                                            disabled={isSubmitting}
                                        />
                                        <div className="mt-3 flex justify-end">
                                            <Button
                                                onClick={this.handleSubmitReport}
                                                disabled={!feedback.trim() || isSubmitting}
                                                size="sm"
                                                className="gap-2 bg-gray-900 text-white hover:bg-gray-800"
                                            >
                                                {isSubmitting ? (
                                                    'Sending...'
                                                ) : (
                                                    <>
                                                        <Send className="h-3.5 w-3.5" />
                                                        Send report
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mb-4 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100">
                                            <Send className="h-4 w-4 text-green-700" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-green-900">
                                                Thank you! Report submitted.
                                            </p>
                                            <p className="text-xs text-green-700">
                                                We’ll look into it on priority and get back if we need more details.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {process.env.NODE_ENV === 'development' && this.state.error && (
                                    <details className="mb-4">
                                        <summary className="flex items-center justify-between gap-2 text-xs text-gray-500 cursor-pointer hover:text-gray-700 mb-1 select-none list-none">
                                            <span className="flex-1">
                                                Error details (dev only)
                                            </span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 shrink-0 [&>svg]:h-3.5 [&>svg]:w-3.5"
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    this.handleCopyDetails()
                                                }}
                                                title={this.state.copied ? 'Copied!' : 'Copy error details'}
                                            >
                                                {this.state.copied ? (
                                                    <span className="text-[10px] text-green-600 font-medium">
                                                        Copied
                                                    </span>
                                                ) : (
                                                    <Copy className="h-3.5 w-3.5" />
                                                )}
                                            </Button>
                                        </summary>
                                        <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto max-h-40">
                                            {this.state.error.message}
                                            {'\n\n'}
                                            {this.state.error.stack}
                                        </pre>
                                    </details>
                                )}
                                <Button
                                    onClick={this.handleReset}
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Try again
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
