/** @type {import('next').NextConfig} */
const path = require("path");
const createMDX = require('@next/mdx')

// Conditionally require Sentry (may not be installed)
let withSentryConfig;
try {
  const sentryModule = require("@sentry/nextjs");
  withSentryConfig = sentryModule.withSentryConfig;
} catch (e) {
  // Sentry not available, will skip Sentry wrapper
  withSentryConfig = null;
}

const withMDX = createMDX({
  // Add markdown plugins here, as desired
})

const nextConfig = {
  // Removed 'output: export' to support dynamic API routes
  // trailingSlash: true, // Temporarily disabled to fix API routing
  images: {
    unoptimized: true
  },
  // Configure `pageExtensions` to include MDX files
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],

  // Experimental features for faster compilation
  experimental: {
    // Optimize package imports - reduces compilation time
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-radio-group',
      'framer-motion',
      'recharts',
      'fuse.js',
    ],
  },
  
  // Compiler optimizations
  swcMinify: true,

  // Configure webpack
  webpack: (config, { isServer, dev }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "sharp$": false,
      "onnxruntime-node$": false,
    }

    // Dev mode optimizations for faster compilation
    if (dev) {
      // Enable webpack cache for faster rebuilds (must use absolute path)
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
        cacheDirectory: path.resolve(process.cwd(), '.next/cache/webpack'),
      };

      // Note: Not setting devtool - Next.js manages this automatically
      // Changing devtool causes performance regressions per Next.js warnings

      // Reduce chunking overhead in dev
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
        // Disable minification in dev for faster compilation
        minimize: false,
        // Reduce module concatenation overhead
        concatenateModules: false,
      };
      
      // Faster module resolution
      config.resolve.symlinks = false;
      
      // Reduce file system calls
      config.snapshot = {
        ...config.snapshot,
        managedPaths: [path.resolve(process.cwd(), 'node_modules')],
      };

      // Silence "Critical dependency" warnings from Prisma/OpenTelemetry in dev
      config.ignoreWarnings = [
        { module: /node_modules\/@opentelemetry\/instrumentation/ }
      ];

      // Exclude heavy libraries from client bundles when possible
      if (!isServer) {
        config.resolve.alias = {
          ...config.resolve.alias,
          // These are server-only, exclude from client bundle
          'nodemailer$': false,
        };
      }
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
// Apply MDX wrapper first, then Sentry wrapper (if available)
const configWithMDX = withMDX(nextConfig);
if (process.env.NODE_ENV === 'development' || !withSentryConfig) {
  module.exports = configWithMDX;
} else {
  module.exports = withSentryConfig(configWithMDX, sentryWebpackPluginOptions);
}
