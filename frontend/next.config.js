/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? '/static' : '',
  basePath: process.env.NODE_ENV === 'production' ? '/static' : '',
}

module.exports = nextConfig