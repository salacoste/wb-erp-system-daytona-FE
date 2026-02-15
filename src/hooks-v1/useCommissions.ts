/**
 * Commissions Hook
 * Story 44.16-FE: Category Selection with Search
 * Epic 44: Price Calculator UI (Frontend)
 *
 * TanStack Query hook for fetching WB category commissions.
 * Caches 7346 categories for 24 hours to minimize API calls.
 */

import { useQuery } from '@tanstack/react-query'
import { getCommissions } from '@/lib/api/tariffs'
import type { CommissionsResponse } from '@/types/tariffs'

/** 24 hours in milliseconds */
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000

/**
 * Query keys for tariffs endpoints
 * Follows TanStack Query v5 patterns with factory functions
 */
export const tariffsQueryKeys = {
  /** Base key for all tariffs queries */
  all: ['tariffs'] as const,
  /** Key for commissions list */
  commissions: () => [...tariffsQueryKeys.all, 'commissions'] as const,
  /** Key for warehouses list */
  warehouses: () => [...tariffsQueryKeys.all, 'warehouses'] as const,
  /** Key for tariff settings */
  settings: () => [...tariffsQueryKeys.all, 'settings'] as const,
  /** Key for acceptance coefficients by warehouse */
  acceptanceByWarehouse: (warehouseId: number) =>
    [...tariffsQueryKeys.all, 'acceptance', warehouseId] as const,
}

/**
 * Hook to fetch category commissions
 *
 * Features:
 * - Fetches 7346 WB categories on mount
 * - Caches for 24 hours (matches backend cache TTL)
 * - No refetch on window focus (large dataset, rarely changes)
 * - Rate limit aware: 10 req/min on tariffs scope
 *
 * @param options - Optional query configuration
 * @returns Query result with commissions data
 *
 * @example
 * const { data, isLoading, error } = useCommissions()
 * // data?.commissions => CategoryCommission[]
 * // data?.meta.total => 7346
 */
export function useCommissions(options?: {
  /** Enable/disable the query */
  enabled?: boolean
}) {
  return useQuery<CommissionsResponse>({
    queryKey: tariffsQueryKeys.commissions(),
    queryFn: getCommissions,
    staleTime: TWENTY_FOUR_HOURS,
    gcTime: TWENTY_FOUR_HOURS,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: options?.enabled ?? true,
  })
}
