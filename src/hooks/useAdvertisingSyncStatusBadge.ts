/**
 * Advertising Sync Status Badge Hook
 * Story 63.3-FE: Advertising Sync Status Badge
 *
 * Hook for fetching and displaying advertising sync status in dashboard widget.
 * Extends the base useAdvertisingSyncStatus with dashboard-specific options.
 *
 * Features:
 * - Auto-refresh every 60 seconds when widget visible
 * - Stops polling when tab is in background
 * - 60s staleTime for caching
 *
 * @see src/hooks/advertising/hooks.ts for base implementation
 */

import { useAdvertisingSyncStatus } from './advertising'
import type { UseAdvertisingSyncStatusOptions } from './advertising'
import type { ExtendedSyncStatusResponse } from '@/types/advertising-sync-status'

/**
 * Options for useAdvertisingSyncStatusBadge hook.
 */
export interface UseAdvertisingSyncStatusBadgeOptions {
  /** Enable/disable the query (default: true) */
  enabled?: boolean
  /**
   * Refetch interval in milliseconds.
   * Default: 60000 (1 minute) per Story 63.3-FE AC4.
   */
  refetchInterval?: number
}

/**
 * Hook result for advertising sync status badge.
 */
export interface UseAdvertisingSyncStatusBadgeResult {
  /** Sync status data */
  data: ExtendedSyncStatusResponse | undefined
  /** Whether data is loading */
  isLoading: boolean
  /** Error if request failed */
  error: Error | null
  /** Refetch function for manual refresh */
  refetch: () => void
  /** Whether currently refetching */
  isRefetching: boolean
}

/**
 * Hook for fetching advertising sync status for dashboard badge.
 *
 * Uses the base useAdvertisingSyncStatus with dashboard-specific defaults:
 * - 60s polling interval (AC4)
 * - Stops polling when tab hidden (AC4)
 * - 60s staleTime for caching (AC5)
 *
 * @param options - Hook options
 * @returns Sync status data and loading states
 *
 * @example
 * const { data, isLoading, error } = useAdvertisingSyncStatusBadge();
 * if (data) {
 *   console.log(data.status); // 'completed' | 'syncing' | etc.
 * }
 */
export function useAdvertisingSyncStatusBadge(
  options: UseAdvertisingSyncStatusBadgeOptions = {}
): UseAdvertisingSyncStatusBadgeResult {
  const { enabled = true, refetchInterval = 60000 } = options

  const baseOptions: UseAdvertisingSyncStatusOptions = {
    enabled,
    refetchInterval,
    refetchIntervalInBackground: false, // AC4: Stop when tab hidden
  }

  const result = useAdvertisingSyncStatus(baseOptions)

  // Cast to extended type (backend may return partial_success)
  const data = result.data as ExtendedSyncStatusResponse | undefined

  return {
    data,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
    isRefetching: result.isRefetching,
  }
}

/**
 * Query keys for sync status badge.
 * Re-exports from advertising query keys for convenience.
 */
export { advertisingQueryKeys } from './advertising'
