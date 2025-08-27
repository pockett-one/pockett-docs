const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: export' to support dynamic API routes
  // trailingSlash: true, // Temporarily disabled to fix API routing
  images: {
    unoptimized: true
  },
  serverExternalPackages: ['@']
}

module.exports = nextConfig