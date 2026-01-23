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
import type { AcceptanceCoefficient } from '@/types/tariffs'
import type { ApiError } from '@/types/api'

/** Query keys for coefficient-related queries */
export const coefficientsQueryKeys = {
  all: ['coefficients'] as const,
  byWarehouse: (warehouseId: number) =>
    [...coefficientsQueryKeys.all, 'warehouse', warehouseId] as const,
}

/** Box type for delivery */
export type BoxType = 'boxes' | 'pallets' | 'supersafe'

/** Box type configuration for UI */
export const BOX_TYPE_CONFIG: Record<BoxType, { id: number; label: string; labelShort: string }> = {
  boxes: { id: 2, label: 'Коробы', labelShort: 'Короб' },
  pallets: { id: 5, label: 'Монопалеты', labelShort: 'Палет' },
  supersafe: { id: 6, label: 'Суперсейф', labelShort: 'Сейф' },
}

/** Daily coefficient data */
export interface DailyCoefficient {
  date: string
  coefficient: number
  isAvailable: boolean
}

/** Coefficients grouped by box type */
export interface BoxTypeCoefficients {
  boxType: BoxType
  boxTypeId: number
  label: string
  dailyCoefficients: DailyCoefficient[]
}

/**
 * Normalized coefficient data for UI use
 * Backend returns integers (100 = 1.0), we normalize to decimals
 * Coefficients are grouped by box type (Boxes, Pallets, Supersafe)
 */
export interface NormalizedCoefficients {
  /** Warehouse ID */
  warehouseId: number
  /** Warehouse name */
  warehouseName: string
  /** Today's acceptance coefficient (normalized: 100 -> 1.0) */
  todayCoefficient: number
  /** Average coefficient over 14-day window */
  averageCoefficient: number
  /** Array of daily coefficients (legacy, for default box type) */
  dailyCoefficients: DailyCoefficient[]
  /** Coefficients grouped by box type */
  byBoxType: BoxTypeCoefficients[]
  /** Delivery tariffs from first available day */
  delivery: {
    baseLiterRub: number
    additionalLiterRub: number
    coefficient: number
  }
  /** Storage tariffs from first available day */
  storage: {
    baseLiterRub: number
    additionalLiterRub: number
    coefficient: number
  }
}

/**
 * Normalize coefficient from API (already decimals from backend, e.g., 1.65)
 * Negative values indicate unavailability, normalized to 0
 */
function normalizeCoefficient(rawCoeff: number): number {
  if (rawCoeff < 0) return 0 // Unavailable (0 for UI, use isAvailable flag)
  // Backend returns decimals directly (e.g., 1.65), no division needed
  return rawCoeff > 10 ? rawCoeff / 100 : rawCoeff
}

/**
 * Get BoxType key from boxTypeId
 */
function getBoxTypeKey(boxTypeId: number): BoxType {
  switch (boxTypeId) {
    case 2: return 'boxes'
    case 5: return 'pallets'
    case 6: return 'supersafe'
    default: return 'boxes'
  }
}

/**
 * Transform API response to normalized coefficients with boxType grouping
 */
function transformCoefficients(
  coefficients: AcceptanceCoefficient[],
): NormalizedCoefficients | null {
  if (!coefficients || coefficients.length === 0) return null

  const firstCoeff = coefficients[0]

  // Group coefficients by boxType
  const byBoxTypeMap = new Map<BoxType, DailyCoefficient[]>()

  for (const c of coefficients) {
    const boxType = getBoxTypeKey(c.boxTypeId)
    const daily: DailyCoefficient = {
      date: c.date.split('T')[0], // Normalize date format
      coefficient: normalizeCoefficient(c.coefficient),
      isAvailable: c.isAvailable,
    }

    if (!byBoxTypeMap.has(boxType)) {
      byBoxTypeMap.set(boxType, [])
    }
    byBoxTypeMap.get(boxType)!.push(daily)
  }

  // Convert to array, sorted by boxTypeId
  const byBoxType: BoxTypeCoefficients[] = []
  for (const [boxType, dailyCoeffs] of byBoxTypeMap) {
    const config = BOX_TYPE_CONFIG[boxType]
    // Sort by date
    dailyCoeffs.sort((a, b) => a.date.localeCompare(b.date))
    byBoxType.push({
      boxType,
      boxTypeId: config.id,
      label: config.label,
      dailyCoefficients: dailyCoeffs,
    })
  }
  byBoxType.sort((a, b) => a.boxTypeId - b.boxTypeId)

  // Default to boxes for legacy dailyCoefficients
  const boxesCoeffs = byBoxTypeMap.get('boxes') || []
  const availableCoeffs = boxesCoeffs.filter((c) => c.coefficient > 0)
  const avgCoeff = availableCoeffs.length > 0
    ? availableCoeffs.reduce((sum, c) => sum + c.coefficient, 0) / availableCoeffs.length
    : 1.0
  const todayCoeff = boxesCoeffs[0]?.coefficient ?? 1.0

  return {
    warehouseId: firstCoeff.warehouseId,
    warehouseName: firstCoeff.warehouseName,
    todayCoefficient: todayCoeff,
    averageCoefficient: avgCoeff,
    dailyCoefficients: boxesCoeffs, // Legacy: default to boxes
    byBoxType,
    delivery: {
      baseLiterRub: firstCoeff.delivery.baseLiterRub,
      additionalLiterRub: firstCoeff.delivery.additionalLiterRub,
      coefficient: normalizeCoefficient(firstCoeff.delivery.coefficient),
    },
    storage: {
      baseLiterRub: firstCoeff.storage.baseLiterRub,
      additionalLiterRub: firstCoeff.storage.additionalLiterRub,
      coefficient: normalizeCoefficient(firstCoeff.storage.coefficient),
    },
  }
}

/** Options for acceptance coefficients hook */
export interface UseAcceptanceCoefficientsOptions {
  /** Debounce delay in milliseconds (default: 500ms) */
  debounceMs?: number
  /** Enable/disable the query */
  enabled?: boolean
}

/** Enhanced result with debouncing state */
export type UseAcceptanceCoefficientsResult = UseQueryResult<NormalizedCoefficients | null, Error> & {
  /** Currently debouncing warehouse changes */
  isDebouncing: boolean
  /** Rate limited by backend (429 error) */
  isRateLimited: boolean
  /** Remaining cooldown seconds if rate limited */
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
 *
 * @param warehouseId - Warehouse ID to fetch coefficients for
 * @param options - Configuration options (debounceMs, enabled)
 * @returns Query result with debouncing and rate limit state
 */
export function useAcceptanceCoefficients(
  warehouseId: number | null,
  options: UseAcceptanceCoefficientsOptions = {},
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
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Skip if warehouseId is null or disabled
    if (warehouseId === null || !enabled) {
      setDebouncedWarehouseId(null)
      setIsDebouncing(false)
      return
    }

    // Start debouncing
    setIsDebouncing(true)

    // Set timer to update debounced value
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedWarehouseId(warehouseId)
      setIsDebouncing(false)
    }, debounceMs)

    // Cleanup on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [warehouseId, debounceMs, enabled])

  // Check rate limit status
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
        // AC3: Rate Limit Error Handling
        const apiError = error as ApiError
        if (apiError?.status === 429) {
          // Extract retry-after from response data
          const errorData = apiError.data as { retryAfter?: number } | undefined
          const retryAfter = errorData?.retryAfter ?? 10

          // Add to rate limit store for cross-tab sync
          addRateLimit(endpoint, retryAfter, `warehouseId: ${debouncedWarehouseId}`)

          // Log for monitoring (AC8: Analytics & Logging)
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
    staleTime: 60 * 60 * 1000, // 1 hour - coefficients can change daily (AC5: Intelligent Caching)
    gcTime: 2 * 60 * 60 * 1000, // 2 hours garbage collection
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on rate limit (429)
      const apiError = error as ApiError
      if (apiError?.status === 429) {
        return false
      }
      return failureCount < 1 // Single retry for other errors
    },
  })

  return {
    ...queryResult,
    isDebouncing,
    isRateLimited,
    cooldownRemaining,
  }
}
