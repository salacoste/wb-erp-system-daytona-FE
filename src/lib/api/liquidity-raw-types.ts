/**
 * Raw backend response shapes for liquidity analytics
 * Used by liquidity-summary-mapper.ts and liquidity-item-mapper.ts
 * as boundary normalizer types (Boundary Normalizer Pattern, CLAUDE-PATTERNS.md).
 */

/** Single entry in the backend's liquidity_breakdown map */
export interface RawLiquidityBreakdownEntry {
  count?: number
  sku_count?: number
  capital?: number
  value?: number
  pct?: number
  percentage?: number
  avg_turnover_days?: number
  avg_turnover?: number
}

/** Backend's liquidity_breakdown is keyed by LiquidityCategory */
export type RawLiquidityBreakdown = Partial<Record<string, RawLiquidityBreakdownEntry>>

/** Raw backend summary shape (field names vary across API versions) */
export interface RawLiquiditySummary {
  liquidity_breakdown?: RawLiquidityBreakdown
  distribution?: RawLiquidityBreakdown
  total_skus?: number
  total_sku_count?: number
  total_frozen_capital?: number
  frozen_capital?: number
  total_inventory_value?: number
  frozen_capital_pct?: number
  avg_turnover_days?: number
  benchmarks?: unknown
}

/** Raw backend meta shape */
export interface RawLiquidityMeta {
  cabinet_id?: string
  analysis_period_days?: number
  turnover_weeks?: number
  generated_at?: string
  stock_data_updated_at?: string
  stocks_updated_at?: string
}

/** Raw backend liquidation scenario object */
export interface RawLiquidationScenario {
  daysToClear?: number
  target_days?: number
  target_turnover_days?: number
  required_velocity?: number
  required_daily_sales?: number
  velocity_multiplier?: number
  discountPct?: number
  new_price?: number
  price_after_discount?: number
  recovery?: number
  expected_revenue?: number
  expected_profit?: number
  is_profitable?: boolean
}

/** Raw backend item shape */
export interface RawLiquidityItem {
  sku_id?: number
  nm_id?: number
  product_name?: string
  name?: string
  category?: string
  brand?: string
  current_stock?: number
  current_stock_qty?: number
  avg_stock_qty_30d?: number
  frozen_capital?: number | null
  stock_value?: number | null
  unit_cost?: number
  cogs_per_unit?: number
  units_sold_30d?: number
  avg_daily_sales?: number
  velocity_per_day?: number
  turnover_days?: number
  liquidity_status?: string
  liquidity_category?: string
  current_price?: number
  recommendation?: string
  action_type?: string
  liquidation_scenarios?: Record<string, RawLiquidationScenario> | RawLiquidationScenario[] | null
}

/** Top-level raw backend response */
export interface RawLiquidityResponse {
  meta?: RawLiquidityMeta
  summary?: RawLiquiditySummary
  data?: RawLiquidityItem[]
}
