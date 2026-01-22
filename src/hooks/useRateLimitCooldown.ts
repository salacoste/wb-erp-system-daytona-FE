/**
 * useRateLimitCooldown Hook
 * Story 44.34-FE: Debounce Warehouse Selection & Rate Limit Handling
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Hook for managing rate limit cooldown state with automatic countdown
 * Features: Timer-based countdown, expiry detection, per-endpoint tracking
 */

import { useState, useEffect } from 'react'
import { useRateLimitStore } from '@/stores/rateLimitStore'

/** Cooldown state for rate-limited endpoint */
export interface RateLimitCooldownState {
  /** Currently in cooldown period */
  isLimited: boolean
  /** Remaining cooldown seconds */
  remainingSeconds: number
  /** Cooldown end timestamp */
  cooldownUntil: number | null
  /** Original retry-after from backend */
  retryAfter: number | null
}

export interface UseRateLimitCooldownResult {
  /** Current cooldown state */
  cooldown: RateLimitCooldownState
  /** Start cooldown period (usually after 429 error) */
  startCooldown: (endpoint: string, retryAfter: number, context?: string) => void
  /** Manually clear cooldown */
  clearCooldown: () => void
  /** Check if specific endpoint is rate limited */
  isEndpointLimited: (endpoint: string) => boolean
  /** Get remaining seconds for specific endpoint */
  getEndpointRemaining: (endpoint: string) => number
}

/**
 * Hook to manage rate limit cooldown state
 *
 * Features:
 * - Automatic countdown timer (1-second intervals)
 * - Integrates with rateLimitStore for persistence
 * - Auto-clears expired cooldowns
 * - Cross-tab sync via Zustand store
 *
 * @returns Cooldown state and control functions
 */
export function useRateLimitCooldown(endpoint?: string): UseRateLimitCooldownResult {
  const [cooldown, setCooldown] = useState<RateLimitCooldownState>({
    isLimited: false,
    remainingSeconds: 0,
    cooldownUntil: null,
    retryAfter: null,
  })

  const { addRateLimit, isRateLimited, getRemainingSeconds, clearRateLimit } = useRateLimitStore()

  // Start cooldown for an endpoint (typically after 429 error)
  const startCooldown = (ep: string, retryAfter: number, context?: string) => {
    const endTime = Date.now() + retryAfter * 1000

    // Add to global store for cross-tab sync
    addRateLimit(ep, retryAfter, context)

    setCooldown({
      isLimited: true,
      remainingSeconds: retryAfter,
      cooldownUntil: endTime,
      retryAfter,
    })
  }

  // Clear current cooldown state
  const clearCooldown = () => {
    setCooldown({
      isLimited: false,
      remainingSeconds: 0,
      cooldownUntil: null,
      retryAfter: null,
    })
  }

  // Check if endpoint is rate limited
  const isEndpointLimited = (ep: string): boolean => {
    return isRateLimited(ep)
  }

  // Get remaining seconds for endpoint
  const getEndpointRemaining = (ep: string): number => {
    return getRemainingSeconds(ep)
  }

  // Countdown timer effect
  useEffect(() => {
    if (!cooldown.isLimited || !cooldown.cooldownUntil) return

    const interval = setInterval(() => {
      const now = Date.now()
      const remaining = Math.ceil((cooldown.cooldownUntil! - now) / 1000)

      if (remaining <= 0) {
        // Cooldown expired
        clearCooldown()
        if (endpoint) {
          clearRateLimit(endpoint)
        }
      } else {
        // Update remaining seconds
        setCooldown((prev) => ({
          ...prev,
          remainingSeconds: remaining,
        }))
      }
    }, 1000) // Update every second

    return () => clearInterval(interval)
  }, [cooldown.isLimited, cooldown.cooldownUntil, endpoint, clearRateLimit])

  // Sync with store on mount (if endpoint provided)
  useEffect(() => {
    if (!endpoint) return

    // Check if endpoint is already rate limited (from another tab or previous session)
    if (isEndpointLimited(endpoint)) {
      const remaining = getEndpointRemaining(endpoint)
      const endTime = Date.now() + remaining * 1000

      setCooldown({
        isLimited: true,
        remainingSeconds: remaining,
        cooldownUntil: endTime,
        retryAfter: remaining,
      })
    }
  }, [endpoint])

  return {
    cooldown,
    startCooldown,
    clearCooldown,
    isEndpointLimited,
    getEndpointRemaining,
  }
}
