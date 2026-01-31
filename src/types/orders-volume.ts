/**
 * Orders Volume Types for Dashboard Integration
 * Story 61.3-FE: Orders Volume API Integration
 * Epic 61-FE: Dashboard Data Integration
 *
 * Types for orders volume analytics with status breakdown.
 * Endpoint: GET /v1/analytics/orders/volume
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

// =============================================================================
// Status Breakdown Types (Story 63.7-FE)
// =============================================================================

/** Order status types */
export type OrderStatusType = 'complete' | 'confirm' | 'new' | 'cancel'

/**
 * Status breakdown item for charts
 * Элемент распределения по статусам
 */
export interface StatusBreakdownItem {
  /** Order status */
  status: OrderStatusType
  /** Number of orders with this status */
  count: number
  /** Percentage of total (0-100, e.g., 80.0) */
  percentage: number
}

/**
 * Transformed status breakdown for chart display
 */
export interface StatusBreakdownData {
  /** Total orders in period */
  total: number
  /** Breakdown by status */
  items: StatusBreakdownItem[]
}

// =============================================================================
// Seasonal Patterns Types (Story 63.8-FE)
// =============================================================================

/**
 * Monthly order pattern data
 */
export interface MonthlyPattern {
  /** English month name (e.g., "January") */
  month: string
  /** Average orders for this month */
  avgOrders: number
  /** Average revenue in RUB */
  avgRevenue: number
}

/**
 * Weekday order pattern data
 */
export interface WeekdayPattern {
  /** English day name (e.g., "Monday") */
  dayOfWeek: string
  /** Average orders for this day */
  avgOrders: number
  /** Peak hour (0-23) */
  peakHour: number
}

/**
 * Seasonal insights summary
 */
export interface SeasonalInsights {
  /** Month with highest average orders */
  peakMonth: string
  /** Month with lowest average orders */
  lowMonth: string
  /** Day with highest average orders */
  peakDay: string
}

/**
 * Complete seasonal patterns response
 */
export interface SeasonalPatternsResponse {
  patterns: {
    monthly: MonthlyPattern[]
    weekday: WeekdayPattern[]
  }
  insights: SeasonalInsights
}

/**
 * Parameters for seasonal patterns API
 */
export interface SeasonalPatternsParams {
  /** Number of months to analyze (default: 12, max: 24) */
  months?: number
  /** Optional view filter */
  view?: 'monthly' | 'weekday'
}
