/**
 * Rate Limit Store
 * Story 44.34-FE: Debounce Warehouse Selection & Rate Limit Handling
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Zustand store for managing API rate limit state across the application
 * Features: Per-endpoint tracking, cross-tab sync, automatic expiry cleanup
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

/** Rate limit entry for a specific endpoint */
export interface RateLimitEntry {
  /** API endpoint path */
  endpoint: string
  /** Timestamp when rate limit was hit */
  timestamp: number
  /** Retry-after seconds from backend 429 response */
  retryAfter: number
  /** HTTP status code (usually 429) */
  statusCode: number
  /** Optional request context for debugging */
  context?: string
}

interface RateLimitStore {
  /** Map of endpoint -> rate limit entry */
  rateLimits: Record<string, RateLimitEntry>

  /** Add a rate limit entry for an endpoint */
  addRateLimit: (endpoint: string, retryAfter: number, context?: string) => void

  /** Check if an endpoint is currently rate limited */
  isRateLimited: (endpoint: string) => boolean

  /** Get remaining cooldown seconds for an endpoint */
  getRemainingSeconds: (endpoint: string) => number

  /** Clear all expired rate limit entries */
  clearExpired: () => void

  /** Clear rate limit for a specific endpoint */
  clearRateLimit: (endpoint: string) => void

  /** Get rate limit entry for an endpoint */
  getRateLimit: (endpoint: string) => RateLimitEntry | null
}

/**
 * Extract endpoint key from full URL for consistent tracking
 * Normalizes: /v1/tariffs/acceptance/coefficients?warehouseId=123
 * To: /v1/tariffs/acceptance/coefficients
 */
function normalizeEndpoint(endpoint: string): string {
  try {
    // Remove query parameters for consistent tracking
    const url = endpoint.startsWith('http') ? new URL(endpoint) : ({ pathname: endpoint } as URL)
    return url.pathname
  } catch {
    return endpoint
  }
}

export const useRateLimitStore = create<RateLimitStore>()(
  persist(
    (set, get) => ({
      rateLimits: {},

      addRateLimit: (endpoint, retryAfter, context) => {
        const normalizedEndpoint = normalizeEndpoint(endpoint)
        const entry: RateLimitEntry = {
          endpoint: normalizedEndpoint,
          timestamp: Date.now(),
          retryAfter,
          statusCode: 429,
          context,
        }

        set((state) => ({
          rateLimits: {
            ...state.rateLimits,
            [normalizedEndpoint]: entry,
          },
        }))

        // Log for monitoring (AC8: Analytics & Logging)
        console.info('[RateLimit] Rate limit detected for', normalizedEndpoint, {
          retryAfter,
          context,
          timestamp: new Date(entry.timestamp).toISOString(),
        })
      },

      isRateLimited: (endpoint) => {
        const normalizedEndpoint = normalizeEndpoint(endpoint)
        const entry = get().rateLimits[normalizedEndpoint]
        if (!entry) return false

        const now = Date.now()
        const expiryTime = entry.timestamp + entry.retryAfter * 1000
        const isLimited = now < expiryTime

        // Auto-clear expired entries
        if (!isLimited) {
          get().clearRateLimit(normalizedEndpoint)
        }

        return isLimited
      },

      getRemainingSeconds: (endpoint) => {
        const normalizedEndpoint = normalizeEndpoint(endpoint)
        const entry = get().rateLimits[normalizedEndpoint]
        if (!entry) return 0

        const now = Date.now()
        const expiryTime = entry.timestamp + entry.retryAfter * 1000
        const remaining = Math.ceil((expiryTime - now) / 1000)
        return Math.max(0, remaining)
      },

      clearExpired: () => {
        const now = Date.now()
        set((state) => {
          const cleaned = Object.entries(state.rateLimits).reduce(
            (acc, [key, entry]) => {
              const expiryTime = entry.timestamp + entry.retryAfter * 1000
              if (now < expiryTime) {
                acc[key] = entry
              }
              return acc
            },
            {} as Record<string, RateLimitEntry>,
          )
          return { rateLimits: cleaned }
        })
      },

      clearRateLimit: (endpoint) => {
        const normalizedEndpoint = normalizeEndpoint(endpoint)
        set((state) => {
          const updated = { ...state.rateLimits }
          delete updated[normalizedEndpoint]
          return { rateLimits: updated }
        })
      },

      getRateLimit: (endpoint) => {
        const normalizedEndpoint = normalizeEndpoint(endpoint)
        return get().rateLimits[normalizedEndpoint] || null
      },
    }),
    {
      name: 'rate-limit-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ rateLimits: state.rateLimits }),
      // Clean expired entries on rehydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.clearExpired()
        }
      },
    },
  ),
)

/**
 * Cross-tab sync for rate limit state
 * When one tab hits a rate limit, all tabs respect the cooldown
 */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'rate-limit-storage' && e.newValue) {
      try {
        const newState = JSON.parse(e.newValue)
        if (newState.state?.rateLimits) {
          useRateLimitStore.setState({ rateLimits: newState.state.rateLimits })
        }
      } catch {
        // Ignore parse errors
      }
    }
  })
}
