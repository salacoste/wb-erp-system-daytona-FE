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

// ============================================================================
// Query Keys Factory
// ============================================================================

/**
 * Query keys for liquidity analysis
 * Follows TanStack Query v5 patterns with factory functions
 */
export const liquidityQueryKeys = {
  /** Base key for all liquidity queries */
  all: ['liquidity'] as const,

  /** Key for liquidity list queries */
  list: (params: LiquidityQueryParams) =>
    [...liquidityQueryKeys.all, 'list', params] as const,

  /** Key for trends queries */
  trends: (period?: number) =>
    [...liquidityQueryKeys.all, 'trends', period] as const,

  /** Key for specific SKU detail (for future expansion) */
  detail: (skuId: string) =>
    [...liquidityQueryKeys.all, 'detail', skuId] as const,
}

// ============================================================================
// Query Hooks
// ============================================================================

export interface UseLiquidityOptions {
  /** Enable/disable the query */
  enabled?: boolean
  /** Refetch interval in milliseconds */
  refetchInterval?: number
  /** Stale time in milliseconds (default: 300000 = 5 min) */
  staleTime?: number
}

/**
 * Hook to fetch liquidity analysis data
 *
 * Returns SKU-level liquidity classification, turnover metrics,
 * frozen capital analysis, and liquidation recommendations.
 *
 * @param params - Query parameters for filtering and sorting
 * @param options - Hook options (enabled, refetchInterval, staleTime)
 * @returns Query result with liquidity data
 *
 * @example
 * // Basic usage - fetch all SKUs with default params
 * const { data, isLoading, error } = useLiquidity();
 *
 * @example
 * // Filter to show only illiquid SKUs with liquidation scenarios
 * const { data } = useLiquidity({
 *   category_filter: 'illiquid',
 *   include_liquidation_scenarios: true,
 *   sort_by: 'turnover_days',
 *   sort_order: 'desc',
 * });
 *
 * @example
 * // Sort by stock value to find highest frozen capital
 * const { data } = useLiquidity({
 *   category_filter: 'illiquid',
 *   sort_by: 'stock_value',
 *   sort_order: 'desc',
 *   limit: 50,
 * });
 */
export function useLiquidity(
  params: LiquidityQueryParams = {},
  options: UseLiquidityOptions = {},
) {
  const {
    enabled = true,
    refetchInterval,
    staleTime = 300000, // 5 minutes - liquidity data doesn't change frequently
  } = options

  return useQuery<LiquidityResponse, Error>({
    queryKey: liquidityQueryKeys.list(params),
    queryFn: () => getLiquidity(params),
    enabled,
    staleTime,
    gcTime: 1800000, // 30 minutes cache (liquidity analysis is expensive)
    refetchOnWindowFocus: true,
    refetchInterval,
    retry: 2,
  })
}

/**
 * Hook to fetch liquidity trends data (historical)
 *
 * Returns historical distribution changes, frozen capital trends,
 * and AI-generated insights.
 *
 * @param period - Number of days of history (default: 90)
 * @param options - Hook options
 * @returns Query result with trends data
 *
 * @example
 * // Fetch 90-day trends (default)
 * const { data } = useLiquidityTrends();
 *
 * @example
 * // Fetch 30-day trends
 * const { data } = useLiquidityTrends({ period: 30 });
 */
export function useLiquidityTrends(
  params: LiquidityTrendsQueryParams = {},
  options: UseLiquidityOptions = {},
) {
  const {
    enabled = true,
    refetchInterval,
    staleTime = 1800000, // 30 minutes - historical data changes slowly
  } = options

  return useQuery<LiquidityTrendsResponse, Error>({
    queryKey: liquidityQueryKeys.trends(params.period),
    queryFn: () => getLiquidityTrends(params),
    enabled,
    staleTime,
    gcTime: 3600000, // 1 hour cache
    refetchOnWindowFocus: false,
    refetchInterval,
    retry: 2,
  })
}

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Hook to fetch only illiquid (dead stock) SKUs
 *
 * Convenience wrapper that pre-filters to category_filter: 'illiquid'
 * with liquidation scenarios enabled.
 *
 * @param options - Additional query params and hook options
 * @returns Query result with illiquid SKUs and liquidation recommendations
 *
 * @example
 * const { data: deadStock, isLoading } = useIlliquidStock({
 *   sort_by: 'stock_value',
 *   sort_order: 'desc',
 *   limit: 20,
 * });
 */
export function useIlliquidStock(
  options: Omit<LiquidityQueryParams, 'category_filter' | 'include_liquidation_scenarios'> &
    UseLiquidityOptions = {},
) {
  const { enabled, refetchInterval, staleTime, ...params } = options

  return useLiquidity(
    {
      ...params,
      category_filter: 'illiquid',
      include_liquidation_scenarios: true,
    },
    { enabled, refetchInterval, staleTime },
  )
}

/**
 * Hook to fetch highly liquid (fast-moving) SKUs
 *
 * Convenience wrapper that pre-filters to category_filter: 'highly_liquid'
 *
 * @param options - Additional query params and hook options
 * @returns Query result with highly liquid SKUs
 *
 * @example
 * const { data: fastMovers, isLoading } = useHighlyLiquidStock({
 *   sort_by: 'velocity_per_day',
 *   sort_order: 'desc',
 * });
 */
export function useHighlyLiquidStock(
  options: Omit<LiquidityQueryParams, 'category_filter'> &
    UseLiquidityOptions = {},
) {
  const { enabled, refetchInterval, staleTime, ...params } = options

  return useLiquidity(
    { ...params, category_filter: 'highly_liquid' },
    { enabled, refetchInterval, staleTime },
  )
}

/**
 * Hook to fetch SKUs by liquidity category
 *
 * Generic convenience wrapper for any category filter
 *
 * @param category - Liquidity category to filter by
 * @param options - Additional query params and hook options
 * @returns Query result with filtered SKUs
 *
 * @example
 * const { data } = useLiquidityByCategory('low_liquid', {
 *   sort_by: 'turnover_days',
 *   limit: 100,
 * });
 */
export function useLiquidityByCategory(
  category: LiquidityCategory,
  options: Omit<LiquidityQueryParams, 'category_filter'> &
    UseLiquidityOptions = {},
) {
  const { enabled, refetchInterval, staleTime, ...params } = options

  return useLiquidity(
    {
      ...params,
      category_filter: category,
      include_liquidation_scenarios: category === 'illiquid',
    },
    { enabled, refetchInterval, staleTime },
  )
}

/**
 * Hook to fetch liquidity summary only
 *
 * Uses limit=1 to minimize data transfer when only summary stats are needed.
 * Useful for dashboard widgets and overview cards.
 *
 * @param options - Hook options
 * @returns Query result with summary statistics
 *
 * @example
 * const { data } = useLiquiditySummary();
 * console.log(data?.summary.frozen_capital_pct); // % of frozen capital
 */
export function useLiquiditySummary(
  options: UseLiquidityOptions = {},
) {
  return useLiquidity(
    { limit: 1 }, // Minimal data, we just need summary
    options,
  )
}

// ============================================================================
// Helper Hooks
// ============================================================================

/**
 * Hook to invalidate all liquidity queries
 * Use after data updates to refresh the cache
 *
 * @returns Function to invalidate all liquidity queries
 *
 * @example
 * const invalidateLiquidity = useInvalidateLiquidityQueries();
 *
 * // After stock update or COGS assignment
 * invalidateLiquidity();
 */
export function useInvalidateLiquidityQueries() {
  const queryClient = useQueryClient()

  return () => {
    console.info('[Liquidity] Invalidating all liquidity queries')
    queryClient.invalidateQueries({ queryKey: liquidityQueryKeys.all })
  }
}

/**
 * Hook to prefetch liquidity data
 * Use for optimistic loading when user is likely to navigate to liquidity page
 *
 * @returns Function to prefetch liquidity data
 *
 * @example
 * const prefetchLiquidity = usePrefetchLiquidity();
 *
 * // Prefetch on hover over navigation link
 * <Link onMouseEnter={() => prefetchLiquidity()}>
 *   Ликвидность
 * </Link>
 */
export function usePrefetchLiquidity() {
  const queryClient = useQueryClient()

  return (params: LiquidityQueryParams = {}) => {
    queryClient.prefetchQuery({
      queryKey: liquidityQueryKeys.list(params),
      queryFn: () => getLiquidity(params),
      staleTime: 300000,
    })
  }
}

/**
 * Hook to prefetch liquidity trends
 *
 * @returns Function to prefetch trends data
 */
export function usePrefetchLiquidityTrends() {
  const queryClient = useQueryClient()

  return (period?: number) => {
    queryClient.prefetchQuery({
      queryKey: liquidityQueryKeys.trends(period),
      queryFn: () => getLiquidityTrends({ period }),
      staleTime: 1800000,
    })
  }
}
