/** @type {import('next').NextConfig} */
const { withSentryConfig } = require("@sentry/nextjs");

const nextConfig = {
  // Removed 'output: export' to support dynamic API routes
  // trailingSlash: true, // Temporarily disabled to fix API routing
  images: {
    unoptimized: true
  },

  // Configure webpack
  webpack: (config, { isServer, dev }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "sharp$": false,
      "onnxruntime-node$": false,
    }

    // Silence "Critical dependency" warnings from Prisma/OpenTelemetry in dev
    if (dev) {
      config.ignoreWarnings = [
        { module: /node_modules\/@opentelemetry\/instrumentation/ }
      ];
    }

    return config;
  },

}

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only upload source maps in production
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Transpiles SDK to be compatible with IE11 (increases bundle size)
  transpileClientSDK: false,

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors
  // See: https://docs.sentry.io/product/crons/
  // Note: This requires Sentry to be configured in your Vercel project
  automaticVercelMonitors: true,
};

// Make sure adding Sentry options is the last code to run before exporting
if (process.env.NODE_ENV === 'development') {
  module.exports = nextConfig;
} else {
  module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
}