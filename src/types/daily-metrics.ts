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
  /** Total order amount in rubles (Заказы) */
  orders: number
  /** COGS for orders in rubles */
  ordersCogs: number
  /** Sales amount in rubles (Выкупы / wb_sales_gross) */
  sales: number
  /** COGS for sales in rubles (from finance-summary) */
  salesCogs: number
  /** Advertising spend in rubles (Рекламные затраты) */
  advertising: number
  /** Logistics cost in rubles (Логистика) */
  logistics: number
  /** Storage cost in rubles (Хранение) */
  storage: number
  /** Theoretical profit: orders - ordersCogs - advertising - logistics - storage */
  theoreticalProfit: number
}

// ============================================================================
// API Response Interfaces (Raw data from backend)
// ============================================================================

/**
 * Raw orders daily data from Orders Volume API.
 * GET /v1/analytics/orders/volume?aggregation=day
 */
export interface OrdersDailyData {
  /** Date in YYYY-MM-DD format */
  date: string
  /** Total order amount in rubles */
  total_amount: number
  /** Total number of orders */
  total_orders: number
}

/**
 * Raw finance daily data from Finance Summary API.
 * GET /v1/analytics/weekly/finance-summary (with daily breakdown)
 */
export interface FinanceDailyData {
  /** Date in YYYY-MM-DD format */
  date: string
  /** Gross sales amount (Выкупы) */
  wb_sales_gross: number
  /** Total COGS for sales */
  cogs_total: number
  /** Logistics cost */
  logistics_cost: number
  /** Storage cost */
  storage_cost: number
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
  /** Orders COGS value (applied to all days, optional) */
  ordersCogs?: number
}

/**
 * Input for calculateDailyTheoreticalProfit function.
 */
export interface TheoreticalProfitInput {
  /** Total order amount */
  orders: number
  /** COGS for orders */
  ordersCogs: number
  /** Advertising spend */
  advertising: number
  /** Logistics cost */
  logistics: number
  /** Storage cost */
  storage: number
}
