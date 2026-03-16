'use client'

import React, { Component, ReactNode } from 'react'
import { logger } from '@/lib/logger'
import { AlertCircle, RefreshCw, Copy } from 'lucide-react'
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
}

/**
 * Reusable error boundary component
 * Catches rendering errors in component tree and shows fallback UI
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, error: null, copied: false }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, copied: false }
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

    render() {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback
            }

            // Default fallback UI
            return (
                <div className="flex items-center justify-center min-h-[400px] p-6">
                    <div className="max-w-md w-full bg-white rounded-lg border border-red-200 p-6 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                                <AlertCircle className="h-6 w-6 text-red-500" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Something went wrong
                                </h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    We encountered an error while rendering this section.
                                    Please try refreshing or contact support if the problem persists.
                                </p>
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
