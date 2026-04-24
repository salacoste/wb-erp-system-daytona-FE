/**
 * Daily Metrics Types
 *
 * TypeScript types for daily breakdown analytics (Story 61.9-FE).
 * Defines interfaces for daily metrics aggregated from multiple API sources.
 *
 * @see Story 61.9-FE: Daily Breakdown Support
 * @see docs/epics/epic-61-fe-dashboard-data-integration.md
 */

// ============================================================================
// Core Daily Metrics Interface
// ============================================================================

/**
 * Daily metrics for dashboard breakdown.
 *
 * Aggregates data from multiple sources:
 * - Orders API: orders volume
 * - Finance Summary API: sales, COGS, logistics, storage
 * - Advertising API: advertising spend
 *
 * Used for daily breakdown charts and theoretical profit calculation.
 */
export interface DailyMetrics {
  /** Date in YYYY-MM-DD format */
  date: string
  /** ISO day of week (1=Monday, 7=Sunday) */
  dayOfWeek: number
  /** Total order amount in rubles (Сумма заказов) */
  orders: number
  /** Number of orders (Заказы шт) */
  ordersCount: number
  /** COGS for orders in rubles. Story 88.2-FE: null = "unknown" (COGS not yet assigned for this day's SKUs). 0 = legitimate zero cost. */
  ordersCogs: number | null
  /** Sales amount in rubles (Выкупы / wb_sales_gross) */
  sales: number
  /** COGS for sales in rubles (from finance daily). Story 88.2-FE: null = "unknown". 0 = legitimate zero cost. */
  salesCogs: number | null
  /** Advertising spend in rubles (Рекламные затраты) */
  advertising: number
  /** Logistics cost in rubles (Логистика) */
  logistics: number
  /** Storage cost in rubles (Хранение) */
  storage: number
  /** Penalties in rubles (Штрафы) */
  penalties: number
  /** Paid acceptance in rubles (Платная приёмка) */
  paidAcceptance: number
  /** WB commission in rubles (Комиссия WB) */
  commission: number
  /** Theoretical profit: sales - salesCogs - logistics - storage - penalties - paidAcceptance - commission - advertising */
  theoreticalProfit: number
  /** Story 92.4 H-3 fix: count of completed sales from finance.sales_count.
   * Integer count (NOT currency). Carried through aggregation for the Monitor weekly chart.
   * 0 = legitimate zero (no sales that day). */
  salesCount: number
  /** Story 92.4 H-3 fix: count of returns from finance.returns_count.
   * Integer count (NOT currency). Carried through aggregation for the Monitor weekly chart.
   * 0 = legitimate zero (no returns that day). */
  returnsCount: number
}

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
 * Raw advertising daily data from Advertising API.
 * GET /v1/analytics/advertising (with daily breakdown)
 */
export interface AdvertisingDailyData {
  /** Date in YYYY-MM-DD format */
  date: string
  /** Total advertising spend */
  total_spend: number
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
  /** Orders COGS value for theoretical profit calculation */
  ordersCogs?: number
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
  /** @deprecated Use ordersCogsByDay. Single COGS value applied to all days. */
  ordersCogs?: number
}

/**
 * @deprecated Story 91.2-FE: Use server netProfit instead. Kept for fallback calc.
 * Moved inline to src/lib/daily/aggregation.ts to keep this file under 200 lines.
 */
export type { TheoreticalProfitInput } from '@/lib/daily/aggregation'
