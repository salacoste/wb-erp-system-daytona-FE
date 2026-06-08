/**
 * FBO Sales React Query Hooks
 *
 * Hooks for FBO sales list and aggregation.
 * Uses salesFboQueryKeys from API client for cache management.
 */

import { useQuery } from '@tanstack/react-query'
import { getSalesFbo, getSalesFboAggregate, salesFboQueryKeys } from '@/lib/api/sales-fbo'
import type { FboOrdersListParams } from '@/types/orders-fbo'
import type { SalesFboListResponse, SalesFboAggregateResponse } from '@/types/orders-fbo'

export { salesFboQueryKeys }

// --- List Hook ---

export interface UseSalesFboOptions {
  enabled?: boolean
  refetchInterval?: number
}

/** Fetch paginated FBO sales list */
export function useSalesFbo(params: FboOrdersListParams = {}, options: UseSalesFboOptions = {}) {
  const { enabled = true, refetchInterval } = options
  return useQuery<SalesFboListResponse, Error>({
    queryKey: salesFboQueryKeys.list(params),
    queryFn: () => getSalesFbo(params),
    enabled,
    staleTime: 60_000,
    gcTime: 300_000,
    refetchInterval,
    retry: 1,
  })
}

// --- Aggregate Hook ---

/** Fetch aggregated FBO sales statistics */
export function useSalesFboAggregate(params: FboOrdersListParams = {}) {
  return useQuery<SalesFboAggregateResponse, Error>({
    queryKey: salesFboQueryKeys.aggregate(params),
    queryFn: () => getSalesFboAggregate(params),
    enabled: true,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    retry: 1,
  })
}
