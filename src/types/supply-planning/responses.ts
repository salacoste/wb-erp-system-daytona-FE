/**
 * Supply Planning Response Types
 * Split from supply-planning.ts for file size compliance
 */

import type { StockoutRisk, ReorderStatus, VelocityTrend } from './core'

// ============================================================================
// Response Types
// ============================================================================

/** Warehouse stock breakdown */
export interface WarehouseStock {
  /** Warehouse name (e.g., "Коледино", "Электросталь") */
  name: string
  /** WB office ID */
  office_id?: number
  /** Stock quantity at this warehouse */
  stock: number
}

/** Single SKU supply planning data */
export interface SupplyPlanningItem {
  /** WB article ID */
  sku_id: string
  /** Product name */
  product_name: string
  category?: string
  brand?: string
  current_stock: number
  in_transit: number
  effective_stock: number
  avg_daily_sales: number
  /** Sales trend (null for new products without history) */
  velocity_trend: VelocityTrend | null
  days_until_stockout: number | null
  stockout_date: string | null
  stockout_risk: StockoutRisk
  safety_stock_units: number
  reorder_quantity: number
  reorder_status: ReorderStatus
  /**
   * OPTIONAL — backend omits when COGS unassigned.
   * Render "—"; never sort/sum without undefined guard (anti-pattern #8).
   */
  reorder_value?: number
  cogs_per_unit: number | null
  has_cogs: boolean
  /** Request #203: Average retail selling price (last 8 weeks). Null when no sales. */
  selling_price: number | null
  warehouses: WarehouseStock[]
}

/** Summary statistics */
export interface SupplyPlanningSummary {
  total_skus: number
  out_of_stock_count: number
  stockout_critical: number
  stockout_warning: number
  stockout_low: number
  healthy_stock: number
  reorder_urgent: number
  reorder_soon: number
  total_in_transit_units: number
  total_reorder_value: number
}

/** Response metadata */
export interface SupplyPlanningMeta {
  cabinet_id: string
  velocity_weeks: number
  safety_stock_days: number
  stocks_updated_at: string
  generated_at: string
}

/** Full API response from GET /v1/analytics/supply-planning */
export interface SupplyPlanningResponse {
  meta: SupplyPlanningMeta
  summary: SupplyPlanningSummary
  data: SupplyPlanningItem[]
}
