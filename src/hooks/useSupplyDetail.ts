/**
 * Hook for fetching supply detail with status-based polling
 * Story 53.4-FE: Supply Detail Page
 * Story 53.7-FE: Status Polling & Sync
 * Epic 53-FE: Supply Management UI
 *
 * Reference: docs/stories/epic-53/story-53.4-fe-supply-detail-page.md
 */

import { useQuery } from '@tanstack/react-query'
import { getSupplyDetail, suppliesQueryKeys } from '@/lib/api/supplies'
import type { SupplyDetailResponse, SupplyStatus } from '@/types/supplies'
import { POLLING_CONFIG } from './useSupplyPolling'

export interface UseSupplyDetailOptions {
  /** Enable/disable the query */
  enabled?: boolean
  /** Stale time in milliseconds (default: 30000 = 30s) */
  staleTime?: number
  /** Refetch interval in milliseconds (overrides status-based polling) */
  refetchInterval?: number
  /** Enable status-based auto-polling (default: true) */
  autoPolling?: boolean
}

/**
 * Get polling interval based on supply status
 * - CLOSED/DELIVERING: poll every 30s (60s for DELIVERING)
 * - DELIVERED/CANCELLED: no polling (terminal states)
 * - OPEN: no polling (manual refresh)
 */
function getPollingInterval(status: SupplyStatus | undefined): number | false {
  if (!status) return false

  // Terminal statuses - stop polling
  if (POLLING_CONFIG.terminalStatuses.includes(status)) {
    return false
  }

  // Active statuses - poll based on status
  if (POLLING_CONFIG.activeStatuses.includes(status)) {
    return status === 'DELIVERING'
      ? POLLING_CONFIG.deliveringInterval
      : POLLING_CONFIG.defaultInterval
  }

  // OPEN status - no auto-polling
  return false
}

/**
 * Hook to fetch a single supply's details with status-based polling
 *
 * Automatically polls for status updates when supply is CLOSED or DELIVERING.
 * Stops polling when status reaches DELIVERED or CANCELLED.
 *
 * @param supplyId - Supply ID to fetch
 * @param options - Hook options
 * @returns Query result with supply detail
 *
 * @example
 * // Basic usage with auto-polling
 * const { data: supply, isLoading, error } = useSupplyDetail('supply-001')
 *
 * @example
 * // Disable auto-polling
 * const { data } = useSupplyDetail('supply-001', { autoPolling: false })
 *
 * @example
 * // Override with custom interval
 * const { data } = useSupplyDetail('supply-001', { refetchInterval: 10000 })
 */
export function useSupplyDetail(
  supplyId: string | undefined,
  options: UseSupplyDetailOptions = {}
) {
  const { enabled = true, staleTime = 30000, refetchInterval, autoPolling = true } = options

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
    // Dynamic refetch interval based on supply status
    refetchInterval: query => {
      // If explicit interval provided, use it
      if (refetchInterval !== undefined) {
        return refetchInterval
      }

      // If auto-polling disabled, no interval
      if (!autoPolling) {
        return false
      }

      // Get interval based on current status
      const data = query.state.data as SupplyDetailResponse | undefined
      return getPollingInterval(data?.status)
    },
    refetchIntervalInBackground: false,
    retry: 1,
  })
}
