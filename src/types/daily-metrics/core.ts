/**
 * Daily Metrics Types — Core interface & aggregation input
 *
 * TypeScript types for daily breakdown analytics (Story 61.9-FE).
 * @see docs/epics/epic-61-fe-dashboard-data-integration.md
 */

import type {
  OrdersDailyData,
  FinanceDailyData,
  AdvertisingDailyData,
  OrdersCogsDailyData,
} from './api-types'

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
 * Used for daily breakdown charts and server-provided profit metrics.
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
  /** Server-computed net profit from finance daily API. Null when COGS unknown (Anti-Pattern #8 compliance — Story 106.1-FE). Display layer must render '—' for null. */
  theoreticalProfit: number | null
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
