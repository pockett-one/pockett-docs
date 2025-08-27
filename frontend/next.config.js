const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: export' to support dynamic API routes
  // trailingSlash: true, // Temporarily disabled to fix API routing
  images: {
    unoptimized: true
  },
  webpack: (config) => {
    // Ensure path aliases are properly resolved during build
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname)
    }
    return config
  }
}

module.exports = nextConfig