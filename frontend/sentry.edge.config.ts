// Skip Sentry initialization in development to avoid performance overhead
// Note: This file is only imported in production via instrumentation.ts, but adding check for safety
if (process.env.NODE_ENV !== 'development') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require("@sentry/nextjs");

    Sentry.init({
        // Use private DSN for edge runtime (not exposed to browser)
        dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

        // Set environment
        environment: process.env.NODE_ENV || 'development',

        // Adjust this value in production, or use tracesSampler for greater control
        tracesSampleRate: 0.1,

        // Setting this option to true will print useful information to the console while you're setting up Sentry.
        debug: false,

        // Filter events before sending
        beforeSend(event: unknown) {
            return event;
        },
    });
}

export {}
