/**
 * Storage Analytics React Query Hooks
 * Story 24.1-FE: TypeScript Types & API Client
 * Epic 24: Paid Storage Analytics (Frontend)
 * Reference: docs/request-backend/36-epic-24-paid-storage-analytics-api.md
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getStorageBySku,
  getStorageTopConsumers,
  getStorageTrends,
  triggerPaidStorageImport,
  getImportStatus,
  getStorageSummary,
} from '@/lib/api/storage-analytics'
import type {
  StorageBySkuParams,
  StorageBySkuResponse,
  StorageTopConsumersParams,
  TopConsumersResponse,
  StorageTrendsParams,
  StorageTrendsResponse,
  PaidStorageImportRequest,
  PaidStorageImportResponse,
  ImportStatusResponse,
  StorageSummaryParams,
  StorageSummaryResponse,
} from '@/types/storage-analytics'

// ============================================================================
// Query Keys Factory
// ============================================================================

/**
 * Query keys for storage analytics
 * Follows TanStack Query v5 patterns with factory functions
 */
export const storageQueryKeys = {
  /** Base key for all storage queries */
  all: ['storage'] as const,

  /** Key for storage by SKU queries */
  bySku: (params: StorageBySkuParams) =>
    [...storageQueryKeys.all, 'by-sku', params] as const,

  /** Key for top consumers queries */
  topConsumers: (params: StorageTopConsumersParams) =>
    [...storageQueryKeys.all, 'top-consumers', params] as const,

  /** Key for trends queries */
  trends: (params: StorageTrendsParams) =>
    [...storageQueryKeys.all, 'trends', params] as const,

  /** Key for import status queries */
  importStatus: (importId: string) =>
    [...storageQueryKeys.all, 'import', importId] as const,

  /** Key for storage summary queries (Request #52) */
  summary: (params: StorageSummaryParams) =>
    [...storageQueryKeys.all, 'summary', params] as const,
}

// ============================================================================
// Query Hooks
// ============================================================================

export interface UseStorageBySkuOptions {
  /** Enable/disable the query */
  enabled?: boolean
  /** Refetch interval in milliseconds */
  refetchInterval?: number
}

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
  options: Omit<StorageBySkuParams, 'weekStart' | 'weekEnd'> &
    UseStorageBySkuOptions = {},
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

export interface UseStorageTopConsumersOptions {
  /** Enable/disable the query */
  enabled?: boolean
}

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
    UseStorageTopConsumersOptions = {},
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

export interface UseStorageTrendsOptions {
  /** Enable/disable the query */
  enabled?: boolean
}

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
  options: Omit<StorageTrendsParams, 'weekStart' | 'weekEnd'> &
    UseStorageTrendsOptions = {},
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

export interface UseStorageSummaryOptions {
  /** Enable/disable the query */
  enabled?: boolean
}

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
  options: UseStorageSummaryOptions = {},
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

// ============================================================================
// Mutation Hooks
// ============================================================================

export interface UsePaidStorageImportOptions {
  /** Callback on successful import trigger */
  onSuccess?: (data: PaidStorageImportResponse) => void
  /** Callback on error */
  onError?: (error: Error) => void
}

/**
 * Hook to trigger paid storage data import
 *
 * @param options - Mutation options (callbacks)
 * @returns Mutation object with mutate function and state
 *
 * @example
 * const { mutate, isPending } = usePaidStorageImport({
 *   onSuccess: (data) => {
 *     console.log('Import started:', data.import_id);
 *     // Start polling for status
 *   },
 * });
 *
 * mutate({ dateFrom: '2025-11-18', dateTo: '2025-11-24' });
 */
export function usePaidStorageImport(options: UsePaidStorageImportOptions = {}) {
  return useMutation<PaidStorageImportResponse, Error, PaidStorageImportRequest>({
    mutationFn: triggerPaidStorageImport,
    onSuccess: (data) => {
      console.info('[Storage Analytics] Import triggered successfully:', {
        importId: data.import_id,
        status: data.status,
      })

      options.onSuccess?.(data)
    },
    onError: (error) => {
      console.error('[Storage Analytics] Import failed:', error)
      options.onError?.(error)
    },
    onSettled: () => {
      // Invalidate storage queries after import completes
      // Note: This runs immediately, actual data refresh happens after polling shows completion
    },
  })
}

export interface UseImportStatusOptions {
  /** Enable/disable the query */
  enabled?: boolean
  /** Polling interval in milliseconds (e.g., 2000 for 2 seconds) */
  refetchInterval?: number | false
}

/**
 * Hook to poll import job status
 *
 * @param importId - Import job ID from usePaidStorageImport
 * @param options - Hook options including polling interval
 * @returns Query result with current import status
 *
 * @example
 * const { data: status } = useImportStatus(importId, {
 *   enabled: !!importId,
 *   refetchInterval: status?.status === 'processing' ? 2000 : false,
 * });
 *
 * if (status?.status === 'completed') {
 *   console.log(`Imported ${status.rows_imported} rows`);
 * }
 */
export function useImportStatus(
  importId: string | null,
  options: UseImportStatusOptions = {},
) {
  const { enabled = true, refetchInterval = false } = options

  return useQuery<ImportStatusResponse, Error>({
    queryKey: storageQueryKeys.importStatus(importId ?? ''),
    queryFn: () => {
      if (!importId) {
        throw new Error('Import ID is required')
      }
      return getImportStatus(importId)
    },
    enabled: enabled && !!importId,
    staleTime: 0, // Always fetch fresh status
    gcTime: 60000, // Keep in cache for 1 minute
    refetchInterval:
      typeof refetchInterval === 'number' ? refetchInterval : undefined,
    retry: 2,
  })
}

// ============================================================================
// Helper Hooks
// ============================================================================

/**
 * Hook to invalidate all storage queries
 * Use after successful import completion to refresh data
 *
 * @returns Function to invalidate all storage queries
 *
 * @example
 * const invalidateStorage = useInvalidateStorageQueries();
 *
 * // After import completes
 * if (status.status === 'completed') {
 *   invalidateStorage();
 * }
 */
export function useInvalidateStorageQueries() {
  const queryClient = useQueryClient()

  return () => {
    console.info('[Storage Analytics] Invalidating all storage queries')
    queryClient.invalidateQueries({ queryKey: storageQueryKeys.all })
  }
}
