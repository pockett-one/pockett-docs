const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: export' to support dynamic API routes
  // trailingSlash: true, // Temporarily disabled to fix API routing
  images: {
    unoptimized: true
  },
  webpack: (config, { isServer }) => {
    // Ensure path aliases are properly resolved during build
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './'),
      '@/components': path.resolve(__dirname, './components'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/data': path.resolve(__dirname, './data')
    }
    
    // Ensure proper module resolution
    config.resolve.modules = [
      path.resolve(__dirname, './'),
      'node_modules'
    ]
    
    return config
  }
}

module.exports = nextConfig