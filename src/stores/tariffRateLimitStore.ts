/**
 * Tariff Rate Limit Store
 * Story 52-FE.6: Rate Limit UX & Error Handling
 * Epic 52-FE: Tariff Settings Admin UI
 *
 * Extended Zustand store for managing tariff API rate limits
 * Tracks X-RateLimit-* headers from backend responses
 */

import { create } from 'zustand'
import { toast } from 'sonner'

/** Default rate limit for tariff admin endpoints (10 req/min) */
const DEFAULT_LIMIT = 10

export interface TariffRateLimitState {
  /** Maximum requests allowed per window (from X-RateLimit-Limit) */
  limit: number
  /** Remaining requests in current window (from X-RateLimit-Remaining) */
  remaining: number
  /** Unix timestamp (ms) when rate limit resets (from X-RateLimit-Reset) */
  resetAt: number | null

  /** Update state from API response headers */
  updateFromHeaders: (headers: Headers) => void
  /** Decrement remaining after successful request */
  decrementRemaining: () => void
  /** Reset to default state */
  reset: () => void
}

export const useTariffRateLimitStore = create<TariffRateLimitState>(
  (set, get) => ({
    limit: DEFAULT_LIMIT,
    remaining: DEFAULT_LIMIT,
    resetAt: null,

    updateFromHeaders: (headers: Headers) => {
      const limitHeader = headers.get('X-RateLimit-Limit')
      const remainingHeader = headers.get('X-RateLimit-Remaining')
      const resetHeader = headers.get('X-RateLimit-Reset')

      const limit = limitHeader ? parseInt(limitHeader, 10) : get().limit
      const remaining = remainingHeader
        ? parseInt(remainingHeader, 10)
        : get().remaining
      const resetAt = resetHeader ? parseInt(resetHeader, 10) * 1000 : null

      // Show warning toast when remaining drops to 3 or below (but > 0)
      const prevRemaining = get().remaining
      if (remaining <= 3 && remaining > 0 && remaining < prevRemaining) {
        toast.warning(
          `Осталось ${remaining} запросов. Лимит сбросится через минуту.`
        )
      }

      set({ limit, remaining, resetAt })
    },

    decrementRemaining: () => {
      set((state) => ({
        remaining: Math.max(0, state.remaining - 1),
      }))
    },

    reset: () => {
      set({
        limit: DEFAULT_LIMIT,
        remaining: DEFAULT_LIMIT,
        resetAt: null,
      })
    },
  })
)
