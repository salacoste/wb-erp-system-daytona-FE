'use client'

/**
 * Hook to fetch storage analytics by SKU
 * Extracted from useStorageAnalytics.ts for Story 74.4 (file size compliance)
 */

import { useQuery } from '@tanstack/react-query'
import { getStorageBySku } from '@/lib/api/storage-analytics'
import type { StorageBySkuParams, StorageBySkuResponse } from '@/types/storage-analytics'
import { storageQueryKeys, type UseStorageBySkuOptions } from './storage-analytics-query-keys'

/**
 * Hook to fetch storage analytics by SKU
 *
 * @param weekStart - Start week (ISO format, e.g., "2025-W44")
 * @param weekEnd - End week (ISO format)
 * @param options - Additional query parameters and hook options
 * @returns Query result with paginated SKU storage data
 *
 * @example
 * const { data, isLoading, error } = useStorageBySku(
 *   '2025-W44',
 *   '2025-W47',
 *   { sort_by: 'storage_cost', sort_order: 'desc' }
 * );
 */
export function useStorageBySku(
  weekStart: string,
  weekEnd: string,
  options: Omit<StorageBySkuParams, 'weekStart' | 'weekEnd'> & UseStorageBySkuOptions = {}
) {
  const { enabled = true, refetchInterval, ...params } = options

  const queryParams: StorageBySkuParams = {
    weekStart,
    weekEnd,
    ...params,
  }

  return useQuery<StorageBySkuResponse, Error>({
    queryKey: storageQueryKeys.bySku(queryParams),
    queryFn: () => getStorageBySku(queryParams),
    enabled: enabled && !!weekStart && !!weekEnd,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes (formerly cacheTime)
    refetchOnWindowFocus: true,
    refetchInterval,
    retry: 1,
  })
}
