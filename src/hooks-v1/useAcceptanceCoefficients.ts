/**
 * useAcceptanceCoefficients Hook
 * Story 44.13-FE: Auto-fill Coefficients from Warehouse
 * Story 44.34-FE: Debounce Warehouse Selection & Rate Limit Handling
 * Epic 44: Price Calculator UI (Frontend)
 *
 * TanStack Query hook for fetching acceptance coefficients per warehouse
 * Cache TTL: 1 hour (coefficients can change daily)
 * Features: Debouncing (500ms), rate limit detection, 429 error handling
 */

import { useState, useEffect, useRef } from 'react'
import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { getAcceptanceCoefficients } from '@/lib/api/tariffs'
import { useRateLimitStore } from '@/stores/rateLimitStore'
import type { ApiError } from '@/types/api'
import {
  coefficientsQueryKeys,
  transformCoefficients,
  type NormalizedCoefficients,
  type UseAcceptanceCoefficientsOptions,
} from './useAcceptanceCoefficients-utils'

// Re-export types and constants for consumers
export {
  coefficientsQueryKeys,
  type BoxType,
  type DailyCoefficient,
  type BoxTypeCoefficients,
  type NormalizedCoefficients,
  type UseAcceptanceCoefficientsOptions,
  BOX_TYPE_CONFIG,
} from './useAcceptanceCoefficients-utils'

/** Enhanced result with debouncing state */
export type UseAcceptanceCoefficientsResult = UseQueryResult<
  NormalizedCoefficients | null,
  Error
> & {
  isDebouncing: boolean
  isRateLimited: boolean
  cooldownRemaining: number
}

/**
 * Hook to fetch acceptance coefficients for a warehouse
 *
 * Features:
 * - 1-hour cache (coefficients can change daily)
 * - Auto-normalization (100 -> 1.0)
 * - Debouncing (500ms default) to prevent API spam
 * - Rate limit detection (429 errors)
 * - Cross-tab cooldown sync
 *
 * Story 44.34-FE: Debounce warehouse selection to prevent rate limit errors
 */
export function useAcceptanceCoefficients(
  warehouseId: number | null,
  options: UseAcceptanceCoefficientsOptions = {}
): UseAcceptanceCoefficientsResult {
  const { debounceMs = 500, enabled = true } = options

  // Debounced warehouse ID state
  const [debouncedWarehouseId, setDebouncedWarehouseId] = useState<number | null>(null)
  const [isDebouncing, setIsDebouncing] = useState(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Rate limit store integration
  const { addRateLimit, isRateLimited: checkRateLimited, getRemainingSeconds } = useRateLimitStore()
  const endpoint = `/v1/tariffs/acceptance/coefficients`

  // Debounce warehouse ID changes (AC1: Warehouse Selection Debouncing)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    if (warehouseId === null || !enabled) {
      setDebouncedWarehouseId(null)
      setIsDebouncing(false)
      return
    }
    setIsDebouncing(true)
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedWarehouseId(warehouseId)
      setIsDebouncing(false)
    }, debounceMs)
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [warehouseId, debounceMs, enabled])

  const isRateLimited = checkRateLimited(endpoint)
  const cooldownRemaining = getRemainingSeconds(endpoint)

  // TanStack Query with rate limit handling
  const queryResult = useQuery<NormalizedCoefficients | null, Error>({
    queryKey: coefficientsQueryKeys.byWarehouse(debouncedWarehouseId ?? 0),
    queryFn: async (): Promise<NormalizedCoefficients | null> => {
      if (!debouncedWarehouseId) return null
      try {
        const response = await getAcceptanceCoefficients(debouncedWarehouseId)
        return transformCoefficients(response.coefficients)
      } catch (error) {
        const apiError = error as ApiError
        if (apiError?.status === 429) {
          const errorData = apiError.data as { retryAfter?: number } | undefined
          const retryAfter = errorData?.retryAfter ?? 10
          addRateLimit(endpoint, retryAfter, `warehouseId: ${debouncedWarehouseId}`)
          console.warn('[RateLimit] Acceptance coefficients API rate limited', {
            warehouseId: debouncedWarehouseId,
            retryAfter,
            timestamp: new Date().toISOString(),
          })
        }
        throw error
      }
    },
    enabled: debouncedWarehouseId !== null && enabled && !isRateLimited,
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      const apiError = error as ApiError
      if (apiError?.status === 429) return false
      return failureCount < 1
    },
  })

  return {
    ...queryResult,
    isDebouncing,
    isRateLimited,
    cooldownRemaining,
  }
}
