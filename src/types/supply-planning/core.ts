/**
 * Supply Planning Core Types — enums, query params, response interfaces
 * Split from supply-planning.ts for file size compliance
 */

// ============================================================================
// Enums & Constants
// ============================================================================

/**
 * Stockout risk classification
 * Based on days until stockout
 */
export type StockoutRisk =
  | 'out_of_stock' // current_stock = 0
  | 'critical' // 0-7 days
  | 'warning' // 7-14 days
  | 'low' // 14-30 days
  | 'healthy' // > 30 days
  | 'unknown' // absent/unrecognized backend value — Defensive Frontend (Story 169.13): never coerce to 'healthy'

/**
 * Reorder status - recommended action
 */
export type ReorderStatus =
  | 'urgent' // days_until_stockout < 7
  | 'soon' // days_until_stockout < safety_stock_days
  | 'ok' // days_until_stockout >= safety_stock_days
  | 'unknown' // absent/unrecognized backend value — Defensive Frontend (Story 169.13): never coerce to 'ok'

/**
 * Velocity trend - sales acceleration/deceleration
 */
export type VelocityTrend =
  | 'growing' // > +10% vs previous period
  | 'stable' // -10% to +10%
  | 'declining' // < -10%
  | 'no_data' // backend: insufficient sales history (no trend)

/**
 * View aggregation level
 */
export type SupplyPlanningViewBy = 'sku' | 'category' | 'brand'

/**
 * Filter options
 */
export type SupplyPlanningShowOnly = 'all' | 'stockout_risk' | 'reorder_needed'

// ============================================================================
// Query Parameters
// ============================================================================

/**
 * Query parameters for GET /v1/analytics/supply-planning
 */
export interface SupplyPlanningQueryParams {
  /**
   * Reference week (ISO, e.g. "2025-W50"). NOTE: the REAL backend has no `week` param and
   * rejects it with 400 ("week should not exist"). Retained for MSW mock control only.
   * Do NOT pass it in production.
   */
  week?: string
  /** Weeks for average velocity calculation (1-13, default: 4) */
  velocity_weeks?: number
  /** Target safety stock in days (7-60, default: 14) */
  safety_stock_days?: number
  /** Aggregation level */
  view_by?: SupplyPlanningViewBy
  /** Filter to specific risk levels */
  show_only?: SupplyPlanningShowOnly
  /** Sort field */
  sort_by?: 'days_until_stockout' | 'reorder_quantity' | 'avg_daily_sales' | 'current_stock'
  /** Sort order */
  sort_order?: 'asc' | 'desc'
  /** Max results (1-500, default: 100) */
  limit?: number
}
