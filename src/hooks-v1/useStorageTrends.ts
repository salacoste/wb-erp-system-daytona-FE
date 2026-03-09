'use client'

/**
 * Hook to fetch storage trends over time
 * Extracted from useStorageAnalytics.ts for Story 74.4 (file size compliance)
 */

import { useQuery } from '@tanstack/react-query'
import { getStorageTrends } from '@/lib/api/storage-analytics'
import type { StorageTrendsParams, StorageTrendsResponse } from '@/types/storage-analytics'
import { storageQueryKeys, type UseStorageTrendsOptions } from './storage-analytics-query-keys'

/**
 * Hook to fetch storage trends over time
 *
 * @param weekStart - Start week (ISO format)
 * @param weekEnd - End week (ISO format)
 * @param options - Additional query parameters and hook options
 * @returns Query result with time series storage data
 *
 * @example
 * const { data, isLoading } = useStorageTrends(
 *   '2025-W44',
 *   '2025-W47',
 *   { nm_id: '12345678', metrics: ['storage_cost', 'volume'] }
 * );
 */
export function useStorageTrends(
  weekStart: string,
  weekEnd: string,
  options: Omit<StorageTrendsParams, 'weekStart' | 'weekEnd'> & UseStorageTrendsOptions = {}
) {
  const { enabled = true, ...params } = options

  const queryParams: StorageTrendsParams = {
    weekStart,
    weekEnd,
    ...params,
  }

  return useQuery<StorageTrendsResponse, Error>({
    queryKey: storageQueryKeys.trends(queryParams),
    queryFn: () => getStorageTrends(queryParams),
    enabled: enabled && !!weekStart && !!weekEnd,
    staleTime: 30000,
    gcTime: 300000,
    refetchOnWindowFocus: true,
    retry: 1,
  })
}
