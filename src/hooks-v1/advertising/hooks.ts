/**
 * Advertising Analytics Core Hooks
 * Epic 33-FE: Advertising Analytics
 *
 * Main React Query hooks for advertising analytics:
 * - useAdvertisingAnalytics
 * - useAdvertisingCampaigns
 * - useAdvertisingSyncStatus
 * - useAdvertisingMergedGroups
 * - useAdvertisingAnalyticsComparison
 *
 * @see Story 33.1-fe: Types & API Client
 */

import { useQuery, useQueries } from '@tanstack/react-query'
import {
  getAdvertisingAnalytics,
  getAdvertisingCampaigns,
  getAdvertisingSyncStatus,
} from '@/lib/api/advertising-analytics'
import { advertisingQueryKeys } from './query-keys'
import type {
  UseAdvertisingAnalyticsOptions,
  UseAdvertisingCampaignsOptions,
  UseAdvertisingSyncStatusOptions,
} from './types'
import type {
  AdvertisingAnalyticsParams,
  AdvertisingAnalyticsResponse,
  CampaignsParams,
  CampaignsResponse,
  SyncStatusResponse,
} from '@/types/advertising-analytics'

/**
 * Hook to fetch advertising analytics data.
 *
 * Returns performance metrics aggregated by the specified view_by mode.
 *
 * @param params - Query parameters (from, to, view_by, filters, etc.)
 * @param options - Hook options (enabled, refetchInterval)
 * @returns Query result with analytics data
 */
export function useAdvertisingAnalytics(
  params: AdvertisingAnalyticsParams,
  options: UseAdvertisingAnalyticsOptions = {}
) {
  const { enabled = true, refetchInterval } = options

  return useQuery<AdvertisingAnalyticsResponse, Error>({
    queryKey: advertisingQueryKeys.analytics(params),
    queryFn: () => getAdvertisingAnalytics(params),
    enabled: enabled && !!params.from && !!params.to,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 35 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval,
    retry: 1,
  })
}

/**
 * Hook to fetch advertising campaigns list.
 *
 * @param params - Optional query parameters (status, type, search, pagination)
 * @param options - Hook options (enabled, refetchInterval)
 * @returns Query result with campaigns data
 */
export function useAdvertisingCampaigns(
  params?: CampaignsParams,
  options: UseAdvertisingCampaignsOptions = {}
) {
  const { enabled = true, refetchInterval } = options

  return useQuery<CampaignsResponse, Error>({
    queryKey: advertisingQueryKeys.campaigns(params),
    queryFn: () => getAdvertisingCampaigns(params),
    enabled,
    staleTime: 30 * 60 * 1000,
    gcTime: 35 * 60 * 1000,
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
 * @param options - Hook options (enabled, refetchInterval, refetchIntervalInBackground)
 * @returns Query result with sync status
 */
export function useAdvertisingSyncStatus(options: UseAdvertisingSyncStatusOptions = {}) {
  const { enabled = true, refetchInterval = 60000, refetchIntervalInBackground = false } = options

  return useQuery<SyncStatusResponse, Error>({
    queryKey: advertisingQueryKeys.syncStatus(),
    queryFn: getAdvertisingSyncStatus,
    enabled,
    staleTime: 30000,
    gcTime: 120000,
    refetchOnWindowFocus: true,
    refetchInterval: refetchInterval || undefined,
    refetchIntervalInBackground,
    retry: 1,
  })
}

/**
 * Hook for advertising analytics with merged product groups (Epic 36).
 *
 * Convenience hook that automatically sets group_by=imtId.
 *
 * @param params - Analytics parameters (group_by will be set to 'imtId')
 * @param options - React Query options
 * @returns Query result with merged group data
 */
export function useAdvertisingMergedGroups(
  params: Omit<AdvertisingAnalyticsParams, 'group_by'>,
  options?: UseAdvertisingAnalyticsOptions
) {
  return useAdvertisingAnalytics({ ...params, group_by: 'imtId' }, options)
}

/**
 * Hook for parallel fetching of current + previous advertising analytics.
 * Used for comparison indicators on dashboard.
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
        staleTime: 5 * 60 * 1000,
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
