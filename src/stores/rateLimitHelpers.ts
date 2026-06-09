/**
 * Rate Limit Store — Helpers & Cross-Tab Sync
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
 * Purge expired entries from a rate-limits map.
 * Returns a NEW object (immutable — safe for Zustand set()).
 */
export function purgeExpired(
  rateLimits: Record<string, RateLimitEntry>
): Record<string, RateLimitEntry> {
  const now = Date.now()
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
