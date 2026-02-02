// Skip all instrumentation in development to avoid build overhead
export async function register() {
    if (process.env.NODE_ENV === 'development') {
        return;
    }

    // Only load Sentry in production
    try {
        const Sentry = await import('@sentry/nextjs');
        
        if (process.env.NEXT_RUNTIME === 'nodejs') {
            await import('./sentry.server.config');
        }

        if (process.env.NEXT_RUNTIME === 'edge') {
            await import('./sentry.edge.config');
        }
    } catch (error) {
        // Silently fail if Sentry or config files don't exist
        if (process.env.NODE_ENV !== 'development') {
            console.warn('Failed to load Sentry instrumentation:', error);
        }
    }
}

// Lazy load onRequestError only when needed
export const onRequestError = async (error: Error, request: Request) => {
    if (process.env.NODE_ENV === 'development') {
        return;
    }
    try {
        const Sentry = await import('@sentry/nextjs');
        return Sentry.captureRequestError(error, request);
    } catch {
        // Ignore if Sentry is not available
    }
};
