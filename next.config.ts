import type { NextConfig } from 'next'

const isDevelopment = process.env.NODE_ENV === 'development'

const nextConfig: NextConfig = {
  // React strict mode for development
  reactStrictMode: true,

  // Image optimization
  images: {
    domains: [], // Add image domains if needed
    formats: ['image/avif', 'image/webp'],
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },

  // Disable caching in development
  ...(isDevelopment && {
    // Disable build cache in development
    // Note: Next.js dev mode already has minimal caching by default
    onDemandEntries: {
      // Period (in ms) where the server will keep pages in the buffer
      maxInactiveAge: 25 * 1000,
      // Number of pages that should be kept simultaneously without being disposed
      pagesBufferLength: 2,
    },
  }),

  // Output configuration
  // output: 'standalone', // Disabled for PM2 - use 'npm start' instead
}

export default nextConfig

