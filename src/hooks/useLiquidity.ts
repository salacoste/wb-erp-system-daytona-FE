/**
 * Liquidity Analysis React Query Hooks
 * Epic 7 - Liquidity Analysis (Ликвидность товаров)
 * Backend: Request #55 - Liquidity API Endpoint
 * Reference: docs/stories/7.1.liquidity-api-integration.md
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getLiquidity, getLiquidityTrends } from '@/lib/api/liquidity'
import type {
  LiquidityQueryParams,
  LiquidityResponse,
  LiquidityTrendsQueryParams,
  LiquidityTrendsResponse,
  LiquidityCategory,
} from '@/types/liquidity'
import {
  liquidityQueryKeys,
  type UseLiquidityOptions,
  LIQUIDITY_STALE_TIME,
  LIQUIDITY_GC_TIME,
  TRENDS_STALE_TIME,
  TRENDS_GC_TIME,
  PREFETCH_STALE_TIME,
  PREFETCH_TRENDS_STALE_TIME,
} from './useLiquidity-utils'
import { logger } from '@/lib/logger'

// Re-export for consumers
export { liquidityQueryKeys, type UseLiquidityOptions } from './useLiquidity-utils'

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook to fetch liquidity analysis data
 *
 * Returns SKU-level liquidity classification, turnover metrics,
 * frozen capital analysis, and liquidation recommendations.
 */
export function useLiquidity(params: LiquidityQueryParams = {}, options: UseLiquidityOptions = {}) {
  const {
    enabled = true,
    refetchInterval,
    staleTime = LIQUIDITY_STALE_TIME,
  } = options

  return useQuery<LiquidityResponse, Error>({
    queryKey: liquidityQueryKeys.list(params),
    queryFn: () => getLiquidity(params),
    enabled,
    staleTime,
    gcTime: LIQUIDITY_GC_TIME,
    refetchOnWindowFocus: true,
    refetchInterval,
    retry: 2,
  })
}

/**
 * Hook to fetch liquidity trends data (historical)
 */
export function useLiquidityTrends(
  params: LiquidityTrendsQueryParams = {},
  options: UseLiquidityOptions = {}
) {
  const {
    enabled = true,
    refetchInterval,
    staleTime = TRENDS_STALE_TIME,
  } = options

  return useQuery<LiquidityTrendsResponse, Error>({
    queryKey: liquidityQueryKeys.trends(params.period),
    queryFn: () => getLiquidityTrends(params),
    enabled,
    staleTime,
    gcTime: TRENDS_GC_TIME,
    refetchOnWindowFocus: false,
    refetchInterval,
    retry: 2,
  })
}

// ============================================================================
// Convenience Hooks
// ============================================================================

/** Hook to fetch only illiquid (dead stock) SKUs */
export function useIlliquidStock(
  options: Omit<LiquidityQueryParams, 'category_filter'> & UseLiquidityOptions = {}
) {
  const { enabled, refetchInterval, staleTime, ...params } = options
  return useLiquidity(
    { ...params, category_filter: 'illiquid' },
    { enabled, refetchInterval, staleTime }
  )
}

/** Hook to fetch highly liquid (fast-moving) SKUs */
export function useHighlyLiquidStock(
  options: Omit<LiquidityQueryParams, 'category_filter'> & UseLiquidityOptions = {}
) {
  const { enabled, refetchInterval, staleTime, ...params } = options
  return useLiquidity(
    { ...params, category_filter: 'highly_liquid' },
    { enabled, refetchInterval, staleTime }
  )
}

/** Hook to fetch SKUs by liquidity category */
export function useLiquidityByCategory(
  category: LiquidityCategory,
  options: Omit<LiquidityQueryParams, 'category_filter'> & UseLiquidityOptions = {}
) {
  const { enabled, refetchInterval, staleTime, ...params } = options
  return useLiquidity(
    { ...params, category_filter: category },
    { enabled, refetchInterval, staleTime }
  )
}

/** Hook to fetch liquidity summary only (limit=1) */
export function useLiquiditySummary(options: UseLiquidityOptions = {}) {
  return useLiquidity({ limit: 1 }, options)
}

// ============================================================================
// Helper Hooks
// ============================================================================

/** Hook to invalidate all liquidity queries */
export function useInvalidateLiquidityQueries() {
  const queryClient = useQueryClient()
  return () => {
    logger.debug('[Liquidity] Invalidating all liquidity queries')
    queryClient.invalidateQueries({ queryKey: liquidityQueryKeys.all })
  }
}

/** Hook to prefetch liquidity data */
export function usePrefetchLiquidity() {
  const queryClient = useQueryClient()
  return (params: LiquidityQueryParams = {}) => {
    queryClient.prefetchQuery({
      queryKey: liquidityQueryKeys.list(params),
      queryFn: () => getLiquidity(params),
      staleTime: PREFETCH_STALE_TIME,
    })
  }
}

/** Hook to prefetch liquidity trends */
export function usePrefetchLiquidityTrends() {
  const queryClient = useQueryClient()
  return (period?: number) => {
    queryClient.prefetchQuery({
      queryKey: liquidityQueryKeys.trends(period),
      queryFn: () => getLiquidityTrends({ period }),
      staleTime: PREFETCH_TRENDS_STALE_TIME,
    })
  }
}
