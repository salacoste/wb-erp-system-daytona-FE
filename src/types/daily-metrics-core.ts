/**
 * Daily Metrics Types — Core metric interfaces
 *
 * Split from daily-metrics.ts for 200-line ESLint cap compliance.
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
  /** COGS for orders in rubles. Story 88.2-FE: null = "unknown" (COGS not yet assigned). 0 = legitimate zero. */
  ordersCogs: number | null
  /** Sales amount in rubles (Выкупы / wb_sales_gross) */
  sales: number
  /** COGS for sales in rubles. Story 88.2-FE: null = "unknown". 0 = legitimate zero. */
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
  /** Server-computed net profit. Null when COGS unknown (Anti-Pattern #8). Display '—' for null. */
  theoreticalProfit: number | null
  /** Count of completed sales from finance.sales_count. Integer count (NOT currency). */
  salesCount: number
  /** Count of returns from finance.returns_count. Integer count (NOT currency). */
  returnsCount: number
}

// ============================================================================
// API Response Interfaces (Raw data from backend)
// ============================================================================

/**
 * Raw orders daily data from Orders Trends API.
 * GET /v1/analytics/orders/trends?aggregation=day
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
  /** Total COGS for sales. Story 88.2-FE: null = no COGS data. 0 = legitimate zero. */
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
  /** Story 91.2-FE: Server-computed net profit. Null when COGS unknown. */
  net_profit: number | null
}
