/**
 * Hook for fetching supply detail
 * Story 53.4-FE: Supply Detail Page
 * Epic 53-FE: Supply Management UI
 *
 * Reference: docs/stories/epic-53/story-53.4-fe-supply-detail-page.md
 */

import { useQuery } from '@tanstack/react-query'
import { getSupplyDetail, suppliesQueryKeys } from '@/lib/api/supplies'
import type { SupplyDetailResponse } from '@/types/supplies'

export interface UseSupplyDetailOptions {
  /** Enable/disable the query */
  enabled?: boolean
  /** Stale time in milliseconds (default: 30000 = 30s) */
  staleTime?: number
  /** Refetch interval in milliseconds */
  refetchInterval?: number
}

/**
 * Hook to fetch a single supply's details
 *
 * Returns the full supply including orders and documents.
 *
 * @param supplyId - Supply ID to fetch
 * @param options - Hook options
 * @returns Query result with supply detail
 *
 * @example
 * // Basic usage
 * const { data: supply, isLoading, error } = useSupplyDetail('supply-001')
 *
 * @example
 * // With options
 * const { data, refetch } = useSupplyDetail('supply-001', {
 *   refetchInterval: 30000, // Poll every 30s
 * })
 */
export function useSupplyDetail(
  supplyId: string | undefined,
  options: UseSupplyDetailOptions = {}
) {
  const { enabled = true, staleTime = 30000, refetchInterval } = options

  return useQuery<SupplyDetailResponse, Error>({
    queryKey: suppliesQueryKeys.detail(supplyId || ''),
    queryFn: () => {
      if (!supplyId) {
        throw new Error('Supply ID is required')
      }
      return getSupplyDetail(supplyId)
    },
    enabled: enabled && !!supplyId,
    staleTime,
    gcTime: 300000, // 5 minutes cache
    refetchOnWindowFocus: true,
    refetchInterval,
    retry: 1,
  })
}
