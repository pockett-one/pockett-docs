/**
 * Centralized logging utility with environment-aware log levels
 * 
 * Log Levels:
 * - debug: Detailed information for debugging (dev only)
 * - info: General informational messages (dev only)
 * - warn: Warning messages (all environments)
 * - error: Error messages (all environments)
 * 
 * Production: Only warn and error are logged to console
 * Development: All levels are logged with colors and formatting
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogMetadata {
    [key: string]: any
}

interface LogEntry {
    timestamp: string
    level: LogLevel
    message: string
    context?: string
    metadata?: LogMetadata
    error?: Error
}

class Logger {
    private isDevelopment: boolean
    private isProduction: boolean

    constructor() {
        this.isDevelopment = process.env.NODE_ENV === 'development'
        this.isProduction = process.env.NODE_ENV === 'production'
    }

    /**
     * Debug level - detailed information for debugging
     * Only logged in development
     */
    debug(message: string, contextOrMetadata?: string | LogMetadata, metadata?: LogMetadata) {
        if (!this.isDevelopment) return

        let context: string | undefined
        let meta: LogMetadata | undefined

        if (typeof contextOrMetadata === 'string') {
            context = contextOrMetadata
            meta = metadata
        } else {
            meta = contextOrMetadata
        }

        this.log('debug', message, context, meta)
    }

    /**
     * Info level - general informational messages
     * Only logged in development
     */
    info(message: string, contextOrMetadata?: string | LogMetadata, metadata?: LogMetadata) {
        if (!this.isDevelopment) return

        let context: string | undefined
        let meta: LogMetadata | undefined

        if (typeof contextOrMetadata === 'string') {
            context = contextOrMetadata
            meta = metadata
        } else {
            meta = contextOrMetadata
        }

        this.log('info', message, context, meta)
    }

    /**
     * Warn level - warning messages
     * Logged in all environments
     */
    warn(message: string, contextOrMetadata?: string | LogMetadata, metadata?: LogMetadata) {
        let context: string | undefined
        let meta: LogMetadata | undefined

        if (typeof contextOrMetadata === 'string') {
            context = contextOrMetadata
            meta = metadata
        } else {
            meta = contextOrMetadata
        }

        this.log('warn', message, context, meta)
    }

    /**
     * Error level - error messages
     * Logged in all environments
     */
    error(message: string, error?: Error, context?: string, metadata?: LogMetadata) {
        this.log('error', message, context, { ...metadata, error })
    }

    private log(level: LogLevel, message: string, context?: string, metadata?: LogMetadata) {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context,
            metadata,
        }

        if (this.isDevelopment) {
            this.logToDevelopmentConsole(entry)
        } else {
            this.logToProductionConsole(entry)
        }

        // Send to external logging service (Sentry) in production
        if (this.isProduction && (level === 'error' || level === 'warn')) {
            this.sendToExternalService(entry)
        }
    }

    private logToDevelopmentConsole(entry: LogEntry) {
        const colors = {
            debug: '\x1b[36m', // Cyan
            info: '\x1b[34m',  // Blue
            warn: '\x1b[33m',  // Yellow
            error: '\x1b[31m', // Red
        }
        const reset = '\x1b[0m'
        const color = colors[entry.level]

        const prefix = `${color}[${entry.level.toUpperCase()}]${reset}`
        const timestamp = `\x1b[90m${entry.timestamp}${reset}`
        const contextStr = entry.context ? `\x1b[35m[${entry.context}]${reset}` : ''

        console.log(`${timestamp} ${prefix} ${contextStr} ${entry.message}`)

        if (entry.metadata) {
            console.log('  Metadata:', entry.metadata)
        }

        if (entry.metadata?.error instanceof Error) {
            console.error('  Stack:', entry.metadata.error.stack)
        }
    }

    private logToProductionConsole(entry: LogEntry) {
        // In production, only log warn and error
        if (entry.level !== 'warn' && entry.level !== 'error') return

        const logData = {
            timestamp: entry.timestamp,
            level: entry.level,
            message: entry.message,
            context: entry.context,
            ...entry.metadata,
        }

        if (entry.level === 'error') {
            console.error(JSON.stringify(logData))
        } else {
            console.warn(JSON.stringify(logData))
        }
    }

    // Integration with external services (Sentry)
    private async sendToExternalService(entry: LogEntry) {
        // Only send errors and warnings to Sentry in production
        if (!this.isProduction) return
        if (entry.level !== 'error' && entry.level !== 'warn') return

        try {
            // Dynamically import Sentry to avoid bundling in development
            const Sentry = await import('@sentry/nextjs')

            // Add breadcrumb for context
            Sentry.addBreadcrumb({
                category: entry.context || 'app',
                message: entry.message,
                level: entry.level === 'error' ? 'error' : 'warning',
                data: entry.metadata,
            })

            // Capture error or message
            if (entry.level === 'error' && entry.metadata?.error instanceof Error) {
                Sentry.captureException(entry.metadata.error, {
                    level: 'error',
                    tags: {
                        context: entry.context || 'unknown',
                    },
                    extra: {
                        message: entry.message,
                        ...entry.metadata,
                    },
                })
            } else {
                Sentry.captureMessage(entry.message, {
                    level: entry.level === 'error' ? 'error' : 'warning',
                    tags: {
                        context: entry.context || 'unknown',
                    },
                    extra: entry.metadata,
                })
            }
        } catch (error) {
            // Fail silently if Sentry is not available
            console.error('Failed to send to Sentry:', error)
        }
    }
}

// Export singleton instance
export const logger = new Logger()

// Convenience exports
export const log = {
    debug: (message: string, contextOrMetadata?: string | LogMetadata, metadata?: LogMetadata) =>
        logger.debug(message, contextOrMetadata, metadata),
    info: (message: string, contextOrMetadata?: string | LogMetadata, metadata?: LogMetadata) =>
        logger.info(message, contextOrMetadata, metadata),
    warn: (message: string, contextOrMetadata?: string | LogMetadata, metadata?: LogMetadata) =>
        logger.warn(message, contextOrMetadata, metadata),
    error: (message: string, error?: Error, context?: string, metadata?: LogMetadata) =>
        logger.error(message, error, context, metadata),
}
