import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Set environment
    environment: process.env.NODE_ENV || 'development',

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: 0.1, // 10% of transactions for performance monitoring

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    // Ignore certain errors
    ignoreErrors: [
        // Prisma client errors that are expected
        'PrismaClientKnownRequestError',
        // Network errors
        'NetworkError',
        'Failed to fetch',
    ],

    // Filter events before sending
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

    beforeSendTransaction(event) {
        // Don't send in development
        if (process.env.NODE_ENV === 'development') {
            return null;
        }
        return event;
    },
});
