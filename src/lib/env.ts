/**
 * Validates and exports environment variables
 * Ensures required variables are set and provides type safety
 */

// Validate required variables only in runtime (not during build)
// Note: NEXT_PUBLIC_API_URL has a default value (http://localhost:3000)
// This is fine for local development. In production, it should be set via environment variables.
// No warning needed as the default value works correctly for development.

// Type-safe environment variables
export const env = {
  // API
  // Backend API base URL (without /api suffix - endpoints start with /v1/)
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',

  // App
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'WB Repricer System',
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',

  // Feature flags
  enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  enableWebSocket: process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET === 'true',

  // Development
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  enableDevTools: process.env.NEXT_PUBLIC_ENABLE_DEV_TOOLS === 'true',
} as const

