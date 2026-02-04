/** @type {import('next').NextConfig} */
const createMDX = require('@next/mdx')

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

  // Configure webpack to support excessive deps from @xenova/transformers
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "sharp$": false,
      "onnxruntime-node$": false,
    }
    return config;
  },

}

module.exports = withMDX(nextConfig)