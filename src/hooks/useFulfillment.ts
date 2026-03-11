/**
 * Fulfillment (FBO/FBS) Analytics Hooks
 * Epic 60: FBO/FBS Order Analytics Separation
 * @see docs/request-backend/130-DASHBOARD-FBO-ORDERS-API.md
 */

import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getFulfillmentSummary,
  getFulfillmentTrends,
  getFulfillmentSyncStatus,
  getFulfillmentProducts,
  startFulfillmentSync,
  fulfillmentQueryKeys,
  type FulfillmentTrendsParams,
  type FulfillmentProductsParams,
} from '@/lib/api/fulfillment'
import type {
  FulfillmentSummaryResponse,
  FulfillmentTrendsResponse,
  FulfillmentSyncStatusResponse,
  FulfillmentProductsResponse,
  StartFulfillmentSyncRequest,
} from '@/types/fulfillment'

export { fulfillmentQueryKeys }

export interface UseFulfillmentSummaryOptions {
  enabled?: boolean
}

export interface UseFulfillmentSyncStatusOptions {
  enabled?: boolean
  refetchInterval?: number
}

export interface UseFulfillmentComparisonParams {
  from: string
  to: string
  previousFrom?: string
  previousTo?: string
}

/** Fetch FBO/FBS summary for a date range */
export function useFulfillmentSummary(
  from: string,
  to: string,
  options: UseFulfillmentSummaryOptions = {}
) {
  const { enabled = true } = options
  return useQuery<FulfillmentSummaryResponse, Error>({
    queryKey: fulfillmentQueryKeys.summary(from, to),
    queryFn: () => getFulfillmentSummary({ from, to }),
    enabled: enabled && !!from && !!to,
    staleTime: 60_000,
    gcTime: 300_000,
  })
}

/** Check FBO/FBS data sync status with optional polling (default: 30s) */
export function useFulfillmentSyncStatus(options: UseFulfillmentSyncStatusOptions = {}) {
  const { enabled = true, refetchInterval = 30_000 } = options
  return useQuery<FulfillmentSyncStatusResponse, Error>({
    queryKey: fulfillmentQueryKeys.syncStatus,
    queryFn: getFulfillmentSyncStatus,
    enabled,
    staleTime: 10_000,
    gcTime: 60_000,
    refetchInterval,
  })
}

/** Fetch FBO/FBS summary for current and previous periods for comparison */
export function useFulfillmentSummaryWithComparison(params: UseFulfillmentComparisonParams) {
  const { from, to, previousFrom, previousTo } = params
  const hasPreviousPeriod = !!previousFrom && !!previousTo

  const queries = useQueries({
    queries: [
      {
        queryKey: fulfillmentQueryKeys.summary(from, to),
        queryFn: () => getFulfillmentSummary({ from, to }),
        enabled: !!from && !!to,
        staleTime: 60_000,
        gcTime: 300_000,
      },
      {
        queryKey: fulfillmentQueryKeys.summary(previousFrom || '', previousTo || ''),
        queryFn: () => getFulfillmentSummary({ from: previousFrom!, to: previousTo! }),
        enabled: hasPreviousPeriod,
        staleTime: 60_000,
        gcTime: 300_000,
      },
    ],
  })

  const [currentQuery, previousQuery] = queries
  return {
    current: currentQuery.data,
    previous: hasPreviousPeriod ? previousQuery.data : undefined,
    isLoading: currentQuery.isLoading || (hasPreviousPeriod && previousQuery.isLoading),
    isSuccess: currentQuery.isSuccess && (!hasPreviousPeriod || previousQuery.isSuccess),
    isError: currentQuery.isError || previousQuery.isError,
    error: currentQuery.error || previousQuery.error,
  }
}

/** Fetch FBO/FBS daily trends for charts */
export function useFulfillmentTrends(params: FulfillmentTrendsParams) {
  return useQuery<FulfillmentTrendsResponse, Error>({
    queryKey: fulfillmentQueryKeys.trends(params.from, params.to, params.type, params.metric),
    queryFn: () => getFulfillmentTrends(params),
    enabled: !!params.from && !!params.to,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  })
}

/** Fetch FBO/FBS product-level breakdown */
export function useFulfillmentProducts(params: FulfillmentProductsParams) {
  return useQuery<FulfillmentProductsResponse, Error>({
    queryKey: fulfillmentQueryKeys.products(params.from, params.to, params.type, params.sort),
    queryFn: () => getFulfillmentProducts(params),
    enabled: !!params.from && !!params.to,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  })
}

/** Start FBO/FBS sync (admin only). Invalidates queries on success. */
export function useStartFulfillmentSync() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: StartFulfillmentSyncRequest) => startFulfillmentSync(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fulfillmentQueryKeys.all })
    },
  })
}
