/**
 * Rate limit helpers — endpoint normalization, expiry filter, cross-tab sync
 * Extracted from rateLimitStore.ts for file-size compliance (Epic 134-FE)
 */

import type { RateLimitEntry } from './rateLimitStore'

/**
 * Extract endpoint key from full URL for consistent tracking
 * Normalizes: /v1/tariffs/acceptance/coefficients?warehouseId=123
 * To: /v1/tariffs/acceptance/coefficients
 */
export function normalizeEndpoint(endpoint: string): string {
  try {
    // Remove query parameters for consistent tracking
    const url = endpoint.startsWith('http') ? new URL(endpoint) : ({ pathname: endpoint } as URL)
    return url.pathname
  } catch {
    return endpoint
  }
}

/**
 * Filter out expired rate limit entries from a map.
 * Returns a new map with only entries whose cooldown hasn't elapsed.
 */
export function filterExpired(
  rateLimits: Record<string, RateLimitEntry>,
  now: number
): Record<string, RateLimitEntry> {
  return Object.entries(rateLimits).reduce(
    (acc, [key, entry]) => {
      const expiryTime = entry.timestamp + entry.retryAfter * 1000
      if (now < expiryTime) {
        acc[key] = entry
      }
      return acc
    },
    {} as Record<string, RateLimitEntry>
  )
}

/**
 * Cross-tab sync for rate limit state
 * When one tab hits a rate limit, all tabs respect the cooldown.
 * Must be called once at module level (guarded for SSR).
 */
export function initCrossTabSync(
  setState: (partial: { rateLimits: Record<string, RateLimitEntry> }) => void
): void {
  if (typeof window === 'undefined') return
  window.addEventListener('storage', e => {
    if (e.key === 'rate-limit-storage' && e.newValue) {
      try {
        const newState = JSON.parse(e.newValue)
        if (newState.state?.rateLimits) {
          setState({ rateLimits: newState.state.rateLimits })
        }
      } catch {
        // Ignore parse errors
      }
    }
  })
}
