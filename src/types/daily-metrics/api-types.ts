/**
 * Daily Metrics Types — API response & hook parameter types
 * Split from daily-metrics.ts for 200-line ESLint cap compliance.
 */

// ============================================================================
// API Response Interfaces (Raw data from backend)
// ============================================================================

/**
 * Raw orders daily data from Orders Trends API.
 * GET /v1/analytics/orders/trends?aggregation=day
 * Provides both revenue and count per day (Request #137 fix).
 */
export interface OrdersDailyData {
  /** Date in YYYY-MM-DD format */
  date: string
  /** Total order revenue in rubles (from orders/trends.revenue) */
  total_amount: number
  /** Total number of orders (from orders/trends.ordersCount) */
  total_orders: number
}

/**
 * Raw finance daily data from Finance Daily API.
 * GET /v1/analytics/daily/finance?from=...&to=...
 */
export interface FinanceDailyData {
  /** Date in YYYY-MM-DD format */
  date: string
  /** Gross sales amount — Выкупы (= sale_gross from weekly report) */
  wb_sales_gross: number
  /** Net payout — К перечислению (after all deductions) */
  revenue_net: number
  /** Total COGS for sales. Story 88.2-FE: null = no COGS data for this day. 0 = legitimate zero cost. */
  cogs_total: number | null
  /** Logistics cost */
  logistics_cost: number
  /** Storage cost */
  storage_cost: number
  /** Penalties — Штрафы */
  penalties: number
  /** Paid acceptance — Платная приёмка */
  paid_acceptance: number
  /** WB commission — Комиссия WB */
  commission: number
  /** Returns amount in rubles */
  returns: number
  /** Returns count */
  returns_count: number
  /** Sales count */
  sales_count: number
  /** Story 91.2-FE: Advertising spend from adv_daily_stats. 0 = no ads. */
  advertising_spend: number
  /** Story 91.2-FE: Server-computed net profit (operatingProfit - advertisingSpend). Null when COGS unknown. */
  net_profit: number | null
}

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
 * Extracted from by_day_with_cogs response field.
 */
export interface OrdersCogsDailyData {
  /** Date in YYYY-MM-DD format */
  date: string
  /** COGS for orders on this day. Story 88.2-FE: null = COGS not assigned for any SKU ordered on this day. */
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
