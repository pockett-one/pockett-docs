/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  // Removed 'output: export' to support dynamic API routes
  // trailingSlash: true, // Temporarily disabled to fix API routing
  images: {
    unoptimized: true
  },
  // Explicitly configure Turbopack (empty = use webpack)
  turbopack: {},
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add alias resolution for @/ paths
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '.'),
    }

    return config
  }
}

module.exports = nextConfig