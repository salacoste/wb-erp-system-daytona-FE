/**
 * Orders Volume Types — API response types
 * Split from orders-volume.ts for 200-line ESLint cap compliance.
 *
 * @see docs/stories/epic-61/story-61.3-fe-orders-volume-api.md
 */

// =============================================================================
// API Parameters
// =============================================================================

/**
 * Parameters for GET /v1/analytics/orders/volume
 */
export interface OrdersVolumeParams {
  /** Start date in YYYY-MM-DD format */
  from: string
  /** End date in YYYY-MM-DD format */
  to: string
  /** Aggregation type: 'day' or 'hour' (omit for total only) */
  aggregation?: 'day' | 'hour'
}

// =============================================================================
// API Response Types
// ============================================================================

/**
 * Order status breakdown
 */
export interface OrderStatusBreakdown {
  /** Pending/new orders */
  new: number
  /** Confirmed orders */
  confirm: number
  /** Completed orders */
  complete: number
  /** Cancelled orders */
  cancel: number
}

/**
 * Daily order volume breakdown item
 */
export interface DailyOrderVolume {
  /** Date in YYYY-MM-DD format */
  date: string
  /** Order count for the day */
  orders: number
  /** Order amount for the day (RUB) */
  amount: number
}

/**
 * Hourly order volume breakdown item
 */
export interface HourlyOrderVolume {
  /** Hour of day (0-23) */
  hour: number
  /** Order count for the hour */
  orders: number
  /** Order amount for the hour (RUB) */
  amount: number
}

/**
 * Response from GET /v1/analytics/orders/volume
 */
export interface OrdersVolumeResponse {
  /** Total order count in period */
  total_orders: number
  /** Total order amount in RUB */
  total_amount: number
  /** Average order value in RUB */
  avg_order_value: number
  /** Order breakdown by status */
  by_status: OrderStatusBreakdown
  /** Daily breakdown (only when aggregation='day') */
  by_day?: DailyOrderVolume[]
  /** Hourly breakdown (only when aggregation='hour') */
  by_hour?: HourlyOrderVolume[]
}

// =============================================================================
// Transformed/Derived Types for Dashboard
// ============================================================================

/**
 * Transformed orders volume metrics for dashboard display
 */
export interface OrdersVolumeMetrics {
  /** Total order count */
  totalOrders: number
  /** Total order amount in RUB */
  totalAmount: number
  /** Average order value in RUB */
  avgOrderValue: number
  /** Completion rate % (complete / total * 100) */
  completionRate: number
  /** Cancellation rate % (cancel / total * 100) */
  cancellationRate: number
  /** Daily breakdown (when requested) */
  dailyBreakdown?: DailyOrderVolume[]
}
