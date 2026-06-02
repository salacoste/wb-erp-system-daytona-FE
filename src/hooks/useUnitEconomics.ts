/**
 * Unit Economics Analytics Hook
 * Epic 5 - Unit Economics Analytics
 * Story 5.1: API Integration
 *
 * TanStack Query hook for fetching unit economics data.
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { ApiError } from '@/types/api'
import { normalizeUnitEconomicsResponse } from '@/lib/api/unit-economics-normalizer'
import type { UnitEconomicsResponse, UnitEconomicsQueryParams } from '@/types/unit-economics'

/**
 * Query keys for unit economics
 */
export const unitEconomicsKeys = {
  all: ['unit-economics'] as const,
  list: (params: UnitEconomicsQueryParams) => [...unitEconomicsKeys.all, 'list', params] as const,
}

/**
 * Fetch unit economics data from API
 */
async function fetchUnitEconomics(
  params: UnitEconomicsQueryParams
): Promise<UnitEconomicsResponse> {
  const searchParams = new URLSearchParams()

  // Required parameters (week + view_by per backend DTO; Story 96.2-FE)
  searchParams.set('week', params.week)
  searchParams.set('view_by', params.view_by)

  // Optional parameters
  if (params.sort_by) {
    searchParams.set('sort_by', params.sort_by)
  }
  if (params.sort_order) {
    searchParams.set('sort_order', params.sort_order)
  }
  if (params.limit !== undefined) {
    searchParams.set('limit', String(params.limit))
  }

  // Validation F-43: this endpoint returns the full wrapper { meta, summary, data } and
  // the page reads all three siblings (data.data, data.summary, data.meta). apiClient's
  // default `{ data }` unwrap would return ONLY the inner array → the page's `!data.data`
  // guard was always true → permanent empty state despite real items. skipDataUnwrap keeps
  // the wrapper. (Same double-unwrap class as F-30/F-32/F-36/F-41.)
  // F-43: also normalize backend item field names (quantity_sold→units_sold,
  // missing_cogs→has_cogs) so components never see the raw shape.
  return apiClient
    .get<UnitEconomicsResponse>(`/v1/analytics/unit-economics?${searchParams.toString()}`, {
      skipDataUnwrap: true,
    })
    .then(normalizeUnitEconomicsResponse)
}

/**
 * Hook options type
 */
type UseUnitEconomicsOptions = Omit<
  UseQueryOptions<UnitEconomicsResponse, Error>,
  'queryKey' | 'queryFn'
>

/**
 * useUnitEconomics Hook
 *
 * Fetches unit economics data with cost breakdown and profitability analysis.
 *
 * @param params - Query parameters (week required)
 * @param options - Additional TanStack Query options
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useUnitEconomics({
 *   week: '2025-W50',
 *   view_by: 'sku',
 *   sort_by: 'net_margin_pct',
 *   sort_order: 'asc',
 *   limit: 100,
 * });
 * ```
 */
export function useUnitEconomics(
  params: UnitEconomicsQueryParams,
  options?: UseUnitEconomicsOptions
) {
  return useQuery<UnitEconomicsResponse, Error>({
    queryKey: unitEconomicsKeys.list(params),
    queryFn: () => fetchUnitEconomics(params),
    // Don't fetch without a week
    enabled: !!params.week && options?.enabled !== false,
    // Cache for 5 minutes (data doesn't change frequently)
    staleTime: 5 * 60 * 1000,
    // Keep in cache for 30 minutes
    gcTime: 30 * 60 * 1000,
    // Don't retry 404 NO_DATA_FOR_WEEK — it's expected for weeks without imported data
    retry: (count, err) => {
      if (err instanceof ApiError && err.status === 404) return false
      return count < 2
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
    ...options,
  })
}

/**
 * Prefetch unit economics data
 * Useful for prefetching when user hovers over navigation
 */
export function prefetchUnitEconomics(
  queryClient: ReturnType<typeof import('@tanstack/react-query').useQueryClient>,
  params: UnitEconomicsQueryParams
) {
  return queryClient.prefetchQuery({
    queryKey: unitEconomicsKeys.list(params),
    queryFn: () => fetchUnitEconomics(params),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Invalidate unit economics cache
 * Call after COGS updates to refresh calculations
 */
export function invalidateUnitEconomics(
  queryClient: ReturnType<typeof import('@tanstack/react-query').useQueryClient>
) {
  return queryClient.invalidateQueries({
    queryKey: unitEconomicsKeys.all,
  })
}
