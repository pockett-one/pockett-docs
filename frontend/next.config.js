/** @type {import('next').NextConfig} */


const nextConfig = {
  // Removed 'output: export' to support dynamic API routes
  // trailingSlash: true, // Temporarily disabled to fix API routing
  images: {
    unoptimized: true
  },

}

module.exports = nextConfig