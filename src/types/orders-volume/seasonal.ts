/**
 * Orders Volume Types — Status breakdown & seasonal patterns
 * Story 63.7-FE + Story 63.8-FE
 * Split from core.ts for 200-line ESLint cap compliance.
 */

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
