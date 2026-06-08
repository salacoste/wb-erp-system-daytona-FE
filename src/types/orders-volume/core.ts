/**
 * Orders Volume Types — Core API response types
 * Story 61.3-FE: Orders Volume API Integration
 * Epic 61-FE: Dashboard Data Integration
 *
 * Types for orders volume analytics with status breakdown.
 * Endpoint: GET /v1/analytics/orders/volume
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
// =============================================================================

/**
 * Order status breakdown
 * Распределение заказов по статусам
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
 * Дневной объём заказов
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
 * Почасовой объём заказов
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
 * Полный ответ API объёма заказов
 */
export interface OrdersVolumeResponse {
  /** Total order count in period */
  total_orders: number
  /** Total order amount in RUB (Заказы ₽) */
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
// =============================================================================

/**
 * Transformed orders volume metrics for dashboard display
 * Метрики для отображения на дашборде
 */
export interface OrdersVolumeMetrics {
  /** Total order count */
  totalOrders: number
  /** Total order amount in RUB (Заказы ₽) */
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
