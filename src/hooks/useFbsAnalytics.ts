/**
 * FBS Analytics React Query Hooks
 * Story 51.2-FE: FBS Analytics React Query Hooks
 * Epic 51-FE: FBS Historical Analytics (365 Days)
 *
 * Hooks for fetching FBS order trends, seasonal patterns, and period comparisons.
 * For backfill admin hooks, see useBackfillAdmin.ts
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getFbsTrends, getFbsSeasonal, getFbsCompare } from '@/lib/api/fbs-analytics'
import type {
  FbsTrendsParams,
  TrendsResponse,
  FbsSeasonalParams,
  SeasonalResponse,
  FbsCompareParams,
  CompareResponse,
} from '@/types/fbs-analytics'

// ============================================================================
// Cache Configuration
// ============================================================================

/** Cache config: Analytics (5 min stale, 30 min gc), Backfill (10s stale for polling) */
export const FBS_ANALYTICS_CACHE = {
  analytics: { staleTime: 5 * 60 * 1000, gcTime: 30 * 60 * 1000 },
  backfill: { staleTime: 10 * 1000, gcTime: 5 * 60 * 1000, refetchInterval: 10 * 1000 },
}

// ============================================================================
// Query Keys Factory
// ============================================================================

/** Query keys for FBS analytics - TanStack Query v5 pattern */
export const fbsAnalyticsQueryKeys = {
  all: ['fbs-analytics'] as const,
  trends: (params: FbsTrendsParams) => [...fbsAnalyticsQueryKeys.all, 'trends', params] as const,
  seasonal: (params: FbsSeasonalParams) =>
    [...fbsAnalyticsQueryKeys.all, 'seasonal', params] as const,
  compare: (params: FbsCompareParams) => [...fbsAnalyticsQueryKeys.all, 'compare', params] as const,
  backfill: () => [...fbsAnalyticsQueryKeys.all, 'backfill'] as const,
  backfillStatus: (cabinetId?: string) =>
    [...fbsAnalyticsQueryKeys.backfill(), 'status', cabinetId] as const,
}

// ============================================================================
// Smart Aggregation Helper (AC5)
// ============================================================================

/**
 * Determine optimal aggregation level based on date range
 * Returns: 'day' for 0-90 days, 'week' for 91-180 days, 'month' for 181+ days
 */
export function getSmartAggregation(daysDiff: number): 'day' | 'week' | 'month' {
  if (daysDiff <= 90) return 'day'
  if (daysDiff <= 180) return 'week'
  return 'month'
}

/** Calculate days difference between two YYYY-MM-DD dates */
export function calculateDaysDiff(from: string, to: string): number {
  const fromDate = new Date(from)
  const toDate = new Date(to)
  const diffTime = Math.abs(toDate.getTime() - fromDate.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// ============================================================================
// Analytics Query Hooks (Public - All Roles)
// ============================================================================

export interface UseFbsTrendsOptions {
  enabled?: boolean
  refetchInterval?: number
}

/**
 * Hook to fetch FBS historical order trends
 * @example const { data } = useFbsTrends({ from: '2025-12-01', to: '2026-01-28' });
 */
export function useFbsTrends(params: FbsTrendsParams, options: UseFbsTrendsOptions = {}) {
  const { enabled = true, refetchInterval } = options

  return useQuery<TrendsResponse, Error>({
    queryKey: fbsAnalyticsQueryKeys.trends(params),
    queryFn: () => getFbsTrends(params),
    enabled: enabled && !!params.from && !!params.to,
    staleTime: FBS_ANALYTICS_CACHE.analytics.staleTime,
    gcTime: FBS_ANALYTICS_CACHE.analytics.gcTime,
    refetchOnWindowFocus: true,
    refetchInterval,
    retry: 1,
  })
}

export interface UseFbsSeasonalOptions {
  enabled?: boolean
}

/**
 * Hook to fetch FBS seasonal patterns
 * @example const { data } = useFbsSeasonal({ months: 12, view: 'monthly' });
 */
export function useFbsSeasonal(params: FbsSeasonalParams, options: UseFbsSeasonalOptions = {}) {
  const { enabled = true } = options

  return useQuery<SeasonalResponse, Error>({
    queryKey: fbsAnalyticsQueryKeys.seasonal(params),
    queryFn: () => getFbsSeasonal(params),
    enabled,
    staleTime: FBS_ANALYTICS_CACHE.analytics.staleTime,
    gcTime: FBS_ANALYTICS_CACHE.analytics.gcTime,
    refetchOnWindowFocus: true,
    retry: 1,
  })
}

export interface UseFbsCompareOptions {
  enabled?: boolean
}

/**
 * Hook to compare two time periods (MoM, QoQ, YoY)
 * @example const { data } = useFbsCompare({ period1From, period1To, period2From, period2To });
 */
export function useFbsCompare(params: FbsCompareParams, options: UseFbsCompareOptions = {}) {
  const { enabled = true } = options

  const isValid =
    !!params.period1From && !!params.period1To && !!params.period2From && !!params.period2To

  return useQuery<CompareResponse, Error>({
    queryKey: fbsAnalyticsQueryKeys.compare(params),
    queryFn: () => getFbsCompare(params),
    enabled: enabled && isValid,
    staleTime: FBS_ANALYTICS_CACHE.analytics.staleTime,
    gcTime: FBS_ANALYTICS_CACHE.analytics.gcTime,
    refetchOnWindowFocus: true,
    retry: 1,
  })
}

// ============================================================================
// Helper Hooks
// ============================================================================

/** Hook to invalidate all FBS analytics queries */
export function useInvalidateFbsAnalyticsQueries() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: fbsAnalyticsQueryKeys.all })
}
