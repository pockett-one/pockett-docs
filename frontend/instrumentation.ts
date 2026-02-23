// Skip all instrumentation in development to avoid build overhead
export async function register() {
    if (process.env.NODE_ENV === 'development') {
        return;
    }

    // Only load Sentry in production and in Node.js runtime (skip Edge to avoid Node APIs in Edge bundle)
    try {
        if (process.env.NEXT_RUNTIME === 'nodejs') {
            await import('@sentry/nextjs');
            await import('./sentry.server.config');
        }
        // Skip Sentry in Edge runtime: @sentry/nextjs edge bundle pulls in Next.js constants that use process.features
    } catch (error) {
        // Log warning if Sentry fails to load (we're already past the development check)
        console.warn('Failed to load Sentry instrumentation:', error);
    }
}

// Lazy load onRequestError only when needed
export const onRequestError = async (error: Error, request: Request) => {
    if (process.env.NODE_ENV === 'development') {
        return;
    }
    try {
        const Sentry = await import('@sentry/nextjs');
        // Use captureException with request context instead of captureRequestError
        Sentry.captureException(error, {
            contexts: {
                request: {
                    url: request.url,
                    method: request.method,
                    headers: Object.fromEntries(request.headers.entries()),
                },
            },
        });
    } catch {
        // Ignore if Sentry is not available
    }
};
