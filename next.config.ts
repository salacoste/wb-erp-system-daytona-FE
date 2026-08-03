import type { NextConfig } from 'next'
import path from 'path'

const isDevelopment = process.env.NODE_ENV === 'development'

const nextConfig: NextConfig = {
  // Workspace root - monorepo with backend at parent level
  outputFileTracingRoot: path.join(__dirname, '../..'),

  // Next 16 removed build-time ESLint integration entirely (the `eslint`
  // config key is gone from NextConfig). Linting is now exclusively the
  // explicit CI/local gate: `npx eslint 'src/**/*.{ts,tsx}'` — which is
  // what this repo already enforced. No build-time lint to opt out of.

  // Next 16: Turbopack is the default dev bundler. The previous dev-only
  // `webpack` cache-disable block below (a workaround for a webpack ENOENT
  // cache race) made `next dev` fatal-error: "This build is using Turbopack,
  // with a `webpack` config and no `turbopack` config." Removed — Turbopack
  // does not use the webpack cache, so the workaround is obsolete.
  // React strict mode for development
  // TEMPORARILY DISABLED: Investigating infinite reload issue
  // reactStrictMode: true,

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
}

export default nextConfig
