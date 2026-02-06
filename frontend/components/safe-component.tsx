'use client'

import React, { Component, ReactNode } from 'react'
import { logger } from '@/lib/logger'
import { AlertTriangle } from 'lucide-react'

interface Props {
    children: ReactNode
    context?: string
}

interface State {
    hasError: boolean
    error: Error | null
}

/**
 * Higher-order component for non-critical features
 * Fails silently and logs errors without breaking the UI
 * Use for: analytics, third-party widgets, optional features
 */
export class SafeComponent extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log but don't throw - graceful degradation
        logger.warn(
            `Non-critical component failed: ${error.message}`,
            this.props.context || 'SafeComponent',
            {
                error: error.message,
                componentStack: errorInfo.componentStack,
            }
        )
    }

    render() {
        if (this.state.hasError) {
            // In development, show a subtle indicator
            if (process.env.NODE_ENV === 'development') {
                return (
                    <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700 flex items-center gap-2">
                        <AlertTriangle className="h-3 w-3" />
                        <span>
                            Non-critical component failed: {this.state.error?.message}
                        </span>
                    </div>
                )
            }

            // In production, render nothing (graceful degradation)
            return null
        }

        return this.props.children
    }
}

/**
 * HOC wrapper for safe components
 */
export function withSafeComponent<P extends object>(
    Component: React.ComponentType<P>,
    context?: string
) {
    return function SafeWrappedComponent(props: P) {
        return (
            <SafeComponent context={context}>
                <Component {...props} />
            </SafeComponent>
        )
    }
}
