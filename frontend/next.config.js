/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: export' to support dynamic API routes
  // trailingSlash: true, // Temporarily disabled to fix API routing
  images: {
    unoptimized: true
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add alias resolution for @/ paths
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, '.'),
    }
    
    return config
  }
}

module.exports = nextConfig