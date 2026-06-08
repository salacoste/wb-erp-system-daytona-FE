/**
 * Liquidity Analysis Types — Core enums, params, and item interfaces
 * Epic 7 - Liquidity Analysis (Ликвидность товаров)
 * Backend: Request #55 - Liquidity API Endpoint
 * Reference: docs/stories/7.1.liquidity-api-integration.md
 *
 * Split from liquidity.ts for 200-line ESLint cap compliance.
 */

// ============================================================================
// Enums & Constants
// ============================================================================

/**
 * Liquidity classification based on turnover days
 * - highly_liquid: ≤30 days (fast movers)
 * - medium: 31-60 days (acceptable)
 * - low: 61-90 days (slow movers)
 * - illiquid: >90 days (dead stock)
 */
export type LiquidityCategory = 'highly_liquid' | 'medium' | 'low' | 'illiquid'

/**
 * Action type recommendation
 */
export type ActionType =
  | 'MAXIMIZE' // Scale up - invest more
  | 'MAINTAIN' // Keep current level
  | 'REDUCE' // Reduce stock
  | 'LIQUIDATE' // Discount and sell

/**
 * Benchmark comparison status
 */
export type BenchmarkStatus =
  | 'excellent' // Better than target
  | 'good' // Meeting target
  | 'warning' // Below target
  | 'critical' // Far below target

/**
 * Trend insight type
 */
export type TrendInsightType = 'improvement' | 'warning' | 'info'

// ============================================================================
// Query Parameters
// ============================================================================

/**
 * Query parameters for GET /v1/analytics/liquidity
 */
export interface LiquidityQueryParams {
  /** Filter by liquidity category */
  category_filter?: LiquidityCategory | 'all'
  /**
   * Sort field — MUST match backend LiquiditySortByEnum (liquidity-query.dto.ts). Sending any
   * other value (e.g. the table's stock_value / velocity_per_day UI columns) 400s the request and
   * blanks the page. Use mapLiquiditySortToApi() to translate UI columns to these values.
   */
  sort_by?: 'frozen_capital' | 'turnover_days' | 'current_stock' | 'product_name'
  /** Sort order */
  sort_order?: 'asc' | 'desc'
  /** Max results (1-500, default: 100) */
  limit?: number
}

/**
 * Query parameters for GET /v1/analytics/liquidity/trends
 */
export interface LiquidityTrendsQueryParams {
  /** Days of history (default: 90) */
  period?: number
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Liquidation scenario for illiquid SKU
 * Calculates ROI for different discount levels
 */
export interface LiquidationScenario {
  /** Target turnover days (mapped from backend daysToClear) */
  target_days: number
  /** Required daily velocity to achieve target (null when backend omits) */
  required_velocity: number | null
  /** Multiplier needed vs current velocity (null when backend omits) */
  velocity_multiplier: number | null
  /** Suggested discount percentage (mapped from backend discountPct fraction) */
  suggested_discount_pct: number
  /** New price after discount (null when backend omits) */
  new_price: number | null
  /** Expected revenue if all stock sells; backend recovery maps here (null when backend omits) */
  expected_revenue: number | null
  /** Expected profit after COGS (null when backend omits) */
  expected_profit: number | null
  /** Is this scenario profitable? (null when backend omits) */
  is_profitable: boolean | null
}

/**
 * Single SKU liquidity data
 */
export interface LiquidityItem {
  /** WB article ID */
  sku_id: string
  /** Product name */
  product_name: string
  /** Category name */
  category: string
  /** Brand name */
  brand: string

  /** Current stock quantity */
  current_stock_qty: number
  /** Average stock quantity over 30 days */
  avg_stock_qty_30d: number
  /**
   * Stock value in ₽ (current_stock × COGS) = backend `frozen_capital`. `null` when COGS is
   * unassigned (backend sends `frozen_capital: null`) — render "—", never a fabricated "0 ₽"
   * (anti-pattern #8).
   */
  stock_value: number | null

  /** Units sold in last 30 days */
  units_sold_30d: number
  /** Daily sales velocity */
  velocity_per_day: number

  /** Calculated turnover days */
  turnover_days: number
  /** Liquidity classification */
  liquidity_category: LiquidityCategory

  /** Current selling price */
  current_price: number
  /** Cost of goods sold per unit */
  cogs_per_unit: number

  /** AI-generated recommendation text */
  recommendation: string
  /** Recommended action type */
  action_type: ActionType

  /** Liquidation scenarios (only for illiquid SKUs) */
  liquidation_scenarios: LiquidationScenario[] | null
}
