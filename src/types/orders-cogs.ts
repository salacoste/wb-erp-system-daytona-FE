/**
 * Orders with COGS Types
 * Story 61.4-FE: COGS for Orders Integration
 * Epic 61-FE: Dashboard Data Integration
 *
 * Types for orders volume enriched with COGS data for margin analysis.
 * Extends orders volume types with cost and profit fields.
 *
 * @see docs/stories/epic-61/story-61.4-fe-orders-cogs.md
 */

import type {
  OrdersVolumeResponse,
  OrderStatusBreakdown,
  DailyOrderVolume,
  HourlyOrderVolume,
} from './orders-volume'

// =============================================================================
// COGS-Enriched Order Types
// =============================================================================

/**
 * Daily order volume with COGS data
 * Extends DailyOrderVolume with cost and margin fields
 */
export interface DailyOrderVolumeWithCogs extends DailyOrderVolume {
  /** Total COGS for the day (RUB) */
  cogs_total?: number
  /** Gross profit for the day (amount - cogs_total) */
  profit?: number
  /** Margin percentage for the day */
  margin_pct?: number
}

/**
 * Hourly order volume with COGS data
 * Extends HourlyOrderVolume with cost and margin fields
 */
export interface HourlyOrderVolumeWithCogs extends HourlyOrderVolume {
  /** Total COGS for the hour (RUB) */
  cogs_total?: number
  /** Gross profit for the hour */
  profit?: number
  /** Margin percentage for the hour */
  margin_pct?: number
}

/**
 * Orders volume response enriched with COGS data
 * Extended response from GET /v1/analytics/orders/volume?include_cogs=true
 */
export interface OrdersVolumeWithCogsResponse extends OrdersVolumeResponse {
  /** Total COGS for all orders in period (RUB) */
  cogs_total?: number
  /** Average COGS per order (RUB) */
  avg_cogs_per_order?: number
  /** Gross profit (total_amount - cogs_total) */
  gross_profit?: number
  /** Margin percentage ((total_amount - cogs_total) / total_amount * 100) */
  margin_pct?: number
  /** Number of orders with COGS assigned */
  orders_with_cogs?: number
  /** COGS coverage percentage (orders_with_cogs / total_orders * 100) */
  cogs_coverage_pct?: number
  /** Daily breakdown with COGS (only when aggregation='day' and include_cogs=true) */
  by_day_with_cogs?: DailyOrderVolumeWithCogs[]
  /** Hourly breakdown with COGS (only when aggregation='hour' and include_cogs=true) */
  by_hour_with_cogs?: HourlyOrderVolumeWithCogs[]
}

// =============================================================================
// Transformed/Derived Types for Dashboard
// =============================================================================

/**
 * Orders COGS metrics for dashboard display
 * Summarizes orders profitability based on COGS data
 */
export interface OrdersCogsMetrics {
  /** Total order count */
  totalOrders: number
  /** Total order amount in RUB */
  totalAmount: number
  /**
   * Total COGS in RUB. null when the backend emits NO COGS block at all
   * (cogs_total, gross_profit AND margin_pct all absent) — BD-1: avoids fabricating
   * a 100 %-margin block from `cogs_total || 0` when data is genuinely missing.
   */
  cogsTotal: number | null
  /** Gross profit (totalAmount - cogsTotal). null when no COGS block — see cogsTotal. */
  grossProfit: number | null
  /** Margin percentage. null when no COGS block — see cogsTotal. */
  marginPct: number | null
  /** COGS coverage percentage. null when no COGS block — see cogsTotal. */
  cogsCoveragePct: number | null
  /** Number of orders missing COGS. null when no COGS block — see cogsTotal. */
  ordersMissingCogs: number | null
  /** Average profit per order. null when no COGS block — see cogsTotal. */
  avgProfitPerOrder: number | null
  /** Completion rate % */
  completionRate: number
  /** Cancellation rate % */
  cancellationRate: number
  /** Status breakdown for reference */
  byStatus: OrderStatusBreakdown
  /** Daily breakdown with COGS (when requested) */
  dailyBreakdown?: DailyOrderVolumeWithCogs[]
}

// =============================================================================
// API Parameters
// =============================================================================

/**
 * Parameters for orders with COGS query
 */
export interface OrdersCogsParams {
  /** Start date in YYYY-MM-DD format */
  from: string
  /** End date in YYYY-MM-DD format */
  to: string
  /** Aggregation type: 'day' or 'hour' */
  aggregation?: 'day' | 'hour'
  /** Include COGS data in response */
  include_cogs?: boolean
}
