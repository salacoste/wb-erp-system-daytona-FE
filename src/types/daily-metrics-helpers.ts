/**
 * Daily Metrics Types — Advertising, COGS, and aggregation helper types
 * Split from daily-metrics.ts for 200-line ESLint cap compliance.
 */

import type { OrdersDailyData, FinanceDailyData } from './daily-metrics-core'

// ============================================================================
// Additional API Response Types
// ============================================================================

/**
 * Normalized advertising daily data (frontend-canonical shape).
 * Raw backend shape is `AdvertisingDailyResponseItem` in `api.ts`.
 * GET /v1/analytics/daily/advertising?from=...&to=...
 * Story 104.2-FE: enriched with all 9 per-day fields (was spend-only).
 */
export interface AdvertisingDailyData {
  /** Date in YYYY-MM-DD format */
  date: string
  /** Total advertising spend in rubles (= spend from backend). 0 = no ads ran (legitimate zero). */
  total_spend: number
  /** Ad impressions (views) */
  views: number
  /** Ad clicks */
  clicks: number
  /**
   * Click-through rate in percent (clicks / views * 100).
   * Null = backend has no data for this day (preserved per CLAUDE.md Anti-Pattern #8). Render as `—`.
   */
  ctr: number | null
  /**
   * Cost per click in rubles.
   * Null = backend has no data for this day (preserved per CLAUDE.md Anti-Pattern #8). Render as `—`.
   */
  cpc: number | null
  /** Orders attributed to advertising */
  orders: number
  /**
   * Revenue attributed to advertising in rubles.
   * Null = backend has no data for this day (preserved per CLAUDE.md Anti-Pattern #8). Render as `—`.
   */
  revenue: number | null
  /**
   * Return on ad spend (revenue / spend).
   * Null = backend has no data for this day (preserved per CLAUDE.md Anti-Pattern #8). Render as `—`.
   */
  roas: number | null
}

/**
 * Per-day COGS data from Orders Volume API.
 * GET /v1/analytics/orders/volume?include_cogs=true
 */
export interface OrdersCogsDailyData {
  /** Date in YYYY-MM-DD format */
  date: string
  /** COGS for orders on this day. Story 88.2-FE: null = COGS not assigned. */
  cogs: number | null
}

// ============================================================================
// Hook Parameters & Options
// ============================================================================

/**
 * Parameters for useDailyMetrics hook.
 */
export interface UseDailyMetricsParams {
  /** Start date in YYYY-MM-DD format */
  from: string
  /** End date in YYYY-MM-DD format */
  to: string
  /** Period mode: 'week' (7 days) or 'month' (28-31 days) */
  mode: 'week' | 'month'
}

/**
 * Options for useDailyMetrics hook.
 */
export interface UseDailyMetricsOptions {
  /** Enable/disable the query */
  enabled?: boolean
  /** Refetch interval in milliseconds */
  refetchInterval?: number
}

// ============================================================================
// Aggregation Helper Input Types
// ============================================================================

/**
 * Input for aggregateDailyMetrics function.
 * Combines data from multiple API sources.
 */
export interface AggregateDailyMetricsInput {
  /** Daily orders data from Orders Volume API */
  ordersData: OrdersDailyData[]
  /** Daily finance data from Finance Summary API */
  financeData: FinanceDailyData[]
  /** Daily advertising data from Advertising API */
  advertisingData: AdvertisingDailyData[]
  /** Per-day COGS from orders/volume?include_cogs=true */
  ordersCogsByDay?: OrdersCogsDailyData[]
}
