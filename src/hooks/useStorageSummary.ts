'use client'

/**
 * Hook to fetch storage summary for a date range
 * Extracted from useStorageAnalytics.ts for Story 74.4 (file size compliance)
 * Request #52: For joining with weekly_payout_summary
 */

import { useQuery } from '@tanstack/react-query'
import { getStorageSummary } from '@/lib/api/storage-analytics'
import type { StorageSummaryParams, StorageSummaryResponse } from '@/types/storage-analytics'
import { storageQueryKeys, type UseStorageSummaryOptions } from './storage-analytics-query-keys'

/**
 * Hook to fetch storage summary for a date range
 * Request #52: For joining with weekly_payout_summary
 *
 * @param dateFrom - Start date (YYYY-MM-DD)
 * @param dateTo - End date (YYYY-MM-DD)
 * @param options - Hook options
 * @returns Query result with storage summary
 *
 * @example
 * // Get storage for week 49 (Dec 1-7, 2025)
 * const { data } = useStorageSummary('2025-12-01', '2025-12-07');
 * console.log(data?.data.totalCost); // 1949.52
 */
export function useStorageSummary(
  dateFrom: string,
  dateTo: string,
  options: UseStorageSummaryOptions = {}
) {
  const { enabled = true } = options

  const queryParams: StorageSummaryParams = {
    dateFrom,
    dateTo,
  }

  return useQuery<StorageSummaryResponse, Error>({
    queryKey: storageQueryKeys.summary(queryParams),
    queryFn: () => getStorageSummary(queryParams),
    enabled: enabled && !!dateFrom && !!dateTo,
    staleTime: 30000,
    gcTime: 300000,
    refetchOnWindowFocus: true,
    retry: 1,
  })
}
