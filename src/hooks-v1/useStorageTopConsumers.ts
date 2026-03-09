'use client'

/**
 * Hook to fetch top storage consumers
 * Extracted from useStorageAnalytics.ts for Story 74.4 (file size compliance)
 */

import { useQuery } from '@tanstack/react-query'
import { getStorageTopConsumers } from '@/lib/api/storage-analytics'
import type { StorageTopConsumersParams, TopConsumersResponse } from '@/types/storage-analytics'
import {
  storageQueryKeys,
  type UseStorageTopConsumersOptions,
} from './storage-analytics-query-keys'

/**
 * Hook to fetch top storage consumers
 *
 * @param weekStart - Start week (ISO format)
 * @param weekEnd - End week (ISO format)
 * @param options - Additional query parameters and hook options
 * @returns Query result with top N products by storage cost
 *
 * @example
 * const { data, isLoading } = useStorageTopConsumers(
 *   '2025-W44',
 *   '2025-W47',
 *   { limit: 5, include_revenue: true }
 * );
 */
export function useStorageTopConsumers(
  weekStart: string,
  weekEnd: string,
  options: Omit<StorageTopConsumersParams, 'weekStart' | 'weekEnd'> &
    UseStorageTopConsumersOptions = {}
) {
  const { enabled = true, ...params } = options

  const queryParams: StorageTopConsumersParams = {
    weekStart,
    weekEnd,
    ...params,
  }

  return useQuery<TopConsumersResponse, Error>({
    queryKey: storageQueryKeys.topConsumers(queryParams),
    queryFn: () => getStorageTopConsumers(queryParams),
    enabled: enabled && !!weekStart && !!weekEnd,
    staleTime: 30000,
    gcTime: 300000,
    refetchOnWindowFocus: true,
    retry: 1,
  })
}
