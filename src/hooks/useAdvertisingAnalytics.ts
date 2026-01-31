/**
 * Advertising Analytics React Query Hooks
 *
 * React Query hooks for advertising analytics (Epic 33-FE).
 * Based on backend API specification: docs/request-backend/71-advertising-analytics-epic-33.md
 *
 * @see Story 33.1-fe: Types & API Client
 */

import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query'
import {
  getAdvertisingAnalytics,
  getAdvertisingCampaigns,
  getAdvertisingSyncStatus,
} from '@/lib/api/advertising-analytics'
import type {
  AdvertisingAnalyticsParams,
  AdvertisingAnalyticsResponse,
  CampaignsParams,
  CampaignsResponse,
  SyncStatusResponse,
} from '@/types/advertising-analytics'

// ============================================================================
// Query Keys Factory
// ============================================================================

/**
 * Query keys for advertising analytics.
 * Follows TanStack Query v5 patterns with factory functions.
 *
 * @see Story 33.1-fe: Query keys factory for cache management
 */
export const advertisingQueryKeys = {
  /** Base key for all advertising queries */
  all: ['advertising'] as const,

  /** Key for analytics queries */
  analytics: (params: AdvertisingAnalyticsParams) =>
    [...advertisingQueryKeys.all, 'analytics', params] as const,

  /** Key for campaigns queries */
  campaigns: (params?: CampaignsParams) =>
    [...advertisingQueryKeys.all, 'campaigns', params] as const,

  /** Key for sync status queries */
  syncStatus: () => [...advertisingQueryKeys.all, 'sync-status'] as const,
}

// ============================================================================
// Hook Options Interfaces
// ============================================================================

export interface UseAdvertisingAnalyticsOptions {
  /** Enable/disable the query */
  enabled?: boolean
  /** Refetch interval in milliseconds */
  refetchInterval?: number
}

export interface UseAdvertisingCampaignsOptions {
  /** Enable/disable the query */
  enabled?: boolean
  /** Refetch interval in milliseconds */
  refetchInterval?: number
}

export interface UseAdvertisingSyncStatusOptions {
  /** Enable/disable the query */
  enabled?: boolean
  /**
   * Refetch interval in milliseconds.
   * Default: 60000 (1 minute) per Story 33.6-fe AC4.
   */
  refetchInterval?: number
  /**
   * Whether to continue polling in background.
   * Default: false (stop when tab is hidden).
   */
  refetchIntervalInBackground?: boolean
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook to fetch advertising analytics data.
 *
 * Returns performance metrics aggregated by the specified view_by mode
 * with filtering, sorting, and pagination support.
 *
 * @param params - Query parameters (from, to, view_by, filters, etc.)
 * @param options - Hook options (enabled, refetchInterval)
 * @returns Query result with analytics data
 *
 * @example
 * // Basic usage with default options
 * const { data, isLoading, error } = useAdvertisingAnalytics({
 *   from: '2025-12-08',
 *   to: '2025-12-21',
 * });
 *
 * @example
 * // With all parameters
 * const { data } = useAdvertisingAnalytics({
 *   from: '2025-12-08',
 *   to: '2025-12-21',
 *   view_by: 'sku',
 *   efficiency_filter: 'excellent',
 *   sort_by: 'spend',
 *   sort_order: 'desc',
 *   limit: 20,
 *   offset: 0,
 * });
 *
 * @example
 * // Filter by campaigns
 * const { data } = useAdvertisingAnalytics({
 *   from: '2025-12-08',
 *   to: '2025-12-21',
 *   campaign_ids: '123,456,789',
 * });
 */
export function useAdvertisingAnalytics(
  params: AdvertisingAnalyticsParams,
  options: UseAdvertisingAnalyticsOptions = {},
) {
  const { enabled = true, refetchInterval } = options

  return useQuery<AdvertisingAnalyticsResponse, Error>({
    queryKey: advertisingQueryKeys.analytics(params),
    queryFn: () => getAdvertisingAnalytics(params),
    enabled: enabled && !!params.from && !!params.to,
    staleTime: 30000, // 30 seconds - data changes infrequently
    gcTime: 300000, // 5 minutes (formerly cacheTime)
    refetchOnWindowFocus: true,
    refetchInterval,
    retry: 1,
  })
}

/**
 * Hook to fetch advertising campaigns list.
 *
 * Returns campaigns for the cabinet with optional filtering
 * and offset-based pagination.
 *
 * @param params - Optional query parameters (status, type, search, pagination)
 * @param options - Hook options (enabled, refetchInterval)
 * @returns Query result with campaigns data
 *
 * @example
 * // Get all campaigns
 * const { data, isLoading } = useAdvertisingCampaigns();
 *
 * @example
 * // Get only active campaigns
 * const { data } = useAdvertisingCampaigns({
 *   status: '9',  // 9 = active, 11 = paused
 * });
 *
 * @example
 * // Search with pagination
 * const { data } = useAdvertisingCampaigns({
 *   search: 'Autumn',
 *   limit: 10,
 *   offset: 0,
 * });
 */
export function useAdvertisingCampaigns(
  params?: CampaignsParams,
  options: UseAdvertisingCampaignsOptions = {},
) {
  const { enabled = true, refetchInterval } = options

  return useQuery<CampaignsResponse, Error>({
    queryKey: advertisingQueryKeys.campaigns(params),
    queryFn: () => getAdvertisingCampaigns(params),
    enabled,
    staleTime: 60000, // 1 minute - campaigns change infrequently
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchInterval,
    retry: 1,
  })
}

/**
 * Hook to fetch advertising sync status.
 *
 * Returns the current sync health status with auto-refresh support.
 * Default polling interval is 60 seconds per Story 33.6-fe AC4.
 *
 * Note: Backend marks sync as "stale" after 26 hours (24h daily sync + 2h buffer).
 *
 * @param options - Hook options (enabled, refetchInterval, refetchIntervalInBackground)
 * @returns Query result with sync status
 *
 * @example
 * // Basic usage with default 60s polling
 * const { data: status, isLoading } = useAdvertisingSyncStatus();
 *
 * if (status?.health_status === 'healthy') {
 *   console.log('Данные актуальны');
 * }
 *
 * @example
 * // Custom polling interval
 * const { data: status } = useAdvertisingSyncStatus({
 *   refetchInterval: 30000, // 30 seconds
 * });
 *
 * @example
 * // Disable polling
 * const { data: status } = useAdvertisingSyncStatus({
 *   refetchInterval: 0, // No polling
 * });
 *
 * @example
 * // Continue polling in background
 * const { data: status } = useAdvertisingSyncStatus({
 *   refetchInterval: 60000,
 *   refetchIntervalInBackground: true,
 * });
 */
export function useAdvertisingSyncStatus(
  options: UseAdvertisingSyncStatusOptions = {},
) {
  const {
    enabled = true,
    refetchInterval = 60000, // Default: 1 minute per AC4
    refetchIntervalInBackground = false, // Default: stop when tab hidden
  } = options

  return useQuery<SyncStatusResponse, Error>({
    queryKey: advertisingQueryKeys.syncStatus(),
    queryFn: getAdvertisingSyncStatus,
    enabled,
    staleTime: 30000, // 30 seconds
    gcTime: 120000, // 2 minutes
    refetchOnWindowFocus: true,
    refetchInterval: refetchInterval || undefined,
    refetchIntervalInBackground,
    retry: 1,
  })
}

// ============================================================================
// Helper Hooks
// ============================================================================

/**
 * Hook to invalidate all advertising queries.
 * Use after data changes to refresh all advertising analytics data.
 *
 * @returns Function to invalidate all advertising queries
 *
 * @example
 * const invalidateAdvertising = useInvalidateAdvertisingQueries();
 *
 * // After some action that changes data
 * invalidateAdvertising();
 */
export function useInvalidateAdvertisingQueries() {
  const queryClient = useQueryClient()

  return () => {
    console.info('[Advertising Analytics] Invalidating all advertising queries')
    queryClient.invalidateQueries({ queryKey: advertisingQueryKeys.all })
  }
}

/**
 * Hook to invalidate only analytics queries (not campaigns or sync status).
 * Use when only analytics data needs refresh.
 *
 * @returns Function to invalidate analytics queries
 */
export function useInvalidateAnalyticsQueries() {
  const queryClient = useQueryClient()

  return () => {
    console.info('[Advertising Analytics] Invalidating analytics queries')
    queryClient.invalidateQueries({
      queryKey: [...advertisingQueryKeys.all, 'analytics'],
    })
  }
}

/**
 * Hook to prefetch advertising analytics data.
 * Useful for preloading data before navigation.
 *
 * @returns Function to prefetch analytics data
 *
 * @example
 * const prefetchAnalytics = usePrefetchAdvertisingAnalytics();
 *
 * // Prefetch on hover or before navigation
 * prefetchAnalytics({
 *   from: '2025-12-08',
 *   to: '2025-12-21',
 * });
 */
export function usePrefetchAdvertisingAnalytics() {
  const queryClient = useQueryClient()

  return (params: AdvertisingAnalyticsParams) => {
    console.info('[Advertising Analytics] Prefetching analytics:', params)
    queryClient.prefetchQuery({
      queryKey: advertisingQueryKeys.analytics(params),
      queryFn: () => getAdvertisingAnalytics(params),
      staleTime: 30000,
    })
  }
}

/**
 * Hook for advertising analytics with merged product groups (Epic 36).
 *
 * Convenience hook that automatically sets group_by=imtId.
 * Returns aggregated metrics for products with the same imtId (склейки).
 *
 * @param params - Analytics parameters (group_by will be set to 'imtId')
 * @param options - React Query options
 * @returns Query result with merged group data
 *
 * @example
 * // Fetch merged groups for last 14 days
 * const { data, isLoading } = useAdvertisingMergedGroups({
 *   from: '2025-12-08',
 *   to: '2025-12-21',
 * });
 *
 * @example
 * // With efficiency filter
 * const { data } = useAdvertisingMergedGroups({
 *   from: '2025-12-01',
 *   to: '2025-12-21',
 *   efficiency_filter: 'excellent',
 * });
 */
export function useAdvertisingMergedGroups(
  params: Omit<AdvertisingAnalyticsParams, 'group_by'>,
  options?: UseAdvertisingAnalyticsOptions,
) {
  return useAdvertisingAnalytics(
    { ...params, group_by: 'imtId' },
    options,
  );
}
/**
 * Hook for parallel fetching of current + previous advertising analytics
 * Used for comparison indicators on dashboard
 */
export function useAdvertisingAnalyticsComparison(
  currentParams: AdvertisingAnalyticsParams,
  previousParams: AdvertisingAnalyticsParams,
  options: UseAdvertisingAnalyticsOptions = {}
) {
  const { enabled = true, refetchInterval } = options

  const results = useQueries({
    queries: [
      {
        queryKey: advertisingQueryKeys.analytics(currentParams),
        queryFn: () => getAdvertisingAnalytics(currentParams),
        enabled: enabled && !!currentParams.from && !!currentParams.to,
        staleTime: 30000,
        gcTime: 300000,
        refetchInterval,
      },
      {
        queryKey: advertisingQueryKeys.analytics(previousParams),
        queryFn: () => getAdvertisingAnalytics(previousParams),
        enabled: enabled && !!previousParams.from && !!previousParams.to,
        staleTime: 5 * 60 * 1000, // Longer stale time for history
        gcTime: 300000,
      },
    ],
  })

  const [currentResult, previousResult] = results

  return {
    current: currentResult.data,
    previous: previousResult.data,
    isLoading: currentResult.isLoading || previousResult.isLoading,
    isError: currentResult.isError || previousResult.isError,
    error: currentResult.error || previousResult.error,
  }
}
