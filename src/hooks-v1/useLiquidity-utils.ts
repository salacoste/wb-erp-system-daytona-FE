/**
 * Liquidity Analysis - Query Keys, Types & Config Constants
 * Extracted from useLiquidity.ts for file size compliance (Epic 74)
 */

import type { LiquidityQueryParams } from '@/types/liquidity'

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
  list: (params: LiquidityQueryParams) => [...liquidityQueryKeys.all, 'list', params] as const,

  /** Key for trends queries */
  trends: (period?: number) => [...liquidityQueryKeys.all, 'trends', period] as const,

  /** Key for specific SKU detail (for future expansion) */
  detail: (skuId: string) => [...liquidityQueryKeys.all, 'detail', skuId] as const,
}

// ============================================================================
// Hook Options Type
// ============================================================================

export interface UseLiquidityOptions {
  /** Enable/disable the query */
  enabled?: boolean
  /** Refetch interval in milliseconds */
  refetchInterval?: number
  /** Stale time in milliseconds (default: 300000 = 5 min) */
  staleTime?: number
}

// ============================================================================
// Query Config Constants
// ============================================================================

/** Stale time for liquidity list queries (5 minutes) */
export const LIQUIDITY_STALE_TIME = 300000

/** GC time for liquidity list queries (30 minutes - analysis is expensive) */
export const LIQUIDITY_GC_TIME = 1800000

/** Stale time for trend queries (30 minutes - historical data changes slowly) */
export const TRENDS_STALE_TIME = 1800000

/** GC time for trend queries (1 hour) */
export const TRENDS_GC_TIME = 3600000

/** Prefetch stale time for liquidity data */
export const PREFETCH_STALE_TIME = 300000

/** Prefetch stale time for trends data */
export const PREFETCH_TRENDS_STALE_TIME = 1800000
