import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Set environment
    environment: process.env.NODE_ENV || 'development',

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: 0.1, // 10% of transactions for performance monitoring

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    // Replay configuration for session replay
    replaysOnErrorSampleRate: 1.0, // 100% - capture replay on every error
    replaysSessionSampleRate: 0.1, // 10% - capture 10% of all sessions

    // You can remove this option if you're not planning to use the Sentry Session Replay feature:
    integrations: [
        process.env.NODE_ENV === 'development' ? undefined : Sentry.replayIntegration({
            // Mask all text content for privacy
            maskAllText: true,
            // Block all media (images, videos, etc.) for privacy
            blockAllMedia: true,
        }),
    ].filter(Boolean) as any,

    // Ignore certain errors
    ignoreErrors: [
        // Browser extensions
        'top.GLOBALS',
        // Random plugins/extensions
        'originalCreateNotification',
        'canvas.contentDocument',
        'MyApp_RemoveAllHighlights',
        // Facebook errors
        'fb_xd_fragment',
        // Network errors that are not actionable
        'NetworkError',
        'Failed to fetch',
        'Load failed',
    ],

    // Filter out transactions for healthcheck endpoints
    beforeSend(event, hint) {
        // Don't send events in development
        if (process.env.NODE_ENV === 'development') {
            return null;
        }

        // Filter out healthcheck/monitoring requests
        if (event.request?.url) {
            const url = event.request.url;
            if (url.includes('/api/health') || url.includes('/api/ping')) {
                return null;
            }
        }

        return event;
    },

    // Add user context from Supabase session
    beforeSendTransaction(event) {
        // Don't send in development
        if (process.env.NODE_ENV === 'development') {
            return null;
        }
        return event;
    },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
