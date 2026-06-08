/**
 * Unit Economics Analytics Types
 * Epic 5 - Unit Economics Analytics
 * Backend: Request #53 - Unit Economics API Endpoint
 * Reference: docs/stories/5.1.unit-economics-backend-api.md
 */

// ============================================================================
// Enums & Constants
// ============================================================================

/**
 * Profitability classification status
 * Based on net margin percentage
 */
export type ProfitabilityStatus =
  | 'excellent' // > 25% margin
  | 'good' // 15-25% margin
  | 'warning' // 5-15% margin
  | 'critical' // 0-5% margin
  | 'loss' // < 0% margin

/**
 * View aggregation level
 */
export type UnitEconomicsViewBy = 'sku' | 'category' | 'brand' | 'total'

/**
 * Sort field options
 */
export type UnitEconomicsSortBy = 'revenue' | 'net_margin_pct' | 'cogs_pct' | 'total_costs_pct'

// ============================================================================
// Query Parameters
// ============================================================================

/**
 * Query parameters for GET /v1/analytics/unit-economics
 */
export interface UnitEconomicsQueryParams {
  /** ISO week (e.g., "2025-W50") - required */
  week: string
  /**
   * Aggregation level. REQUIRED for full meta+summary response per backend
   * DTO UnitEconomicsQueryDto.view_by (request-backend/173 § F3).
   * Omitting yields partial response (no meta, no summary).
   * Hardened from optional to required in Story 96.2-FE.
   */
  view_by: UnitEconomicsViewBy
  /** Sort field */
  sort_by?: UnitEconomicsSortBy
  /** Sort order */
  sort_order?: 'asc' | 'desc'
  /** Max results (1-500, default: 100) */
  limit?: number
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Cost percentages breakdown (% of revenue)
 */
export interface CostsPct {
  /** Cost of Goods Sold % — `null` when COGS is unassigned (backend sends null; render "—"). */
  cogs: number | null
  /** WB Commission % */
  commission: number
  /** Logistics (delivery to customer) % */
  logistics_delivery: number
  /** Logistics (return shipping) % */
  logistics_return: number
  /** Storage costs % */
  storage: number
  /** Paid acceptance % */
  paid_acceptance: number
  /** Penalties % */
  penalties: number
  /** Other deductions % */
  other_deductions: number
  /** Advertising % (future) */
  advertising: number
  /**
   * Delivery to warehouse % (seller cost, from shipment cost allocation).
   * NULLABLE per backend request-backend/173 § F5
   * (`null` = no confirmed shipments for this SKU/week).
   * Hardened from optional `?: number` to nullable `: number | null`
   * in Story 96.4-FE — `null` and `undefined` are not interchangeable
   * (anti-pattern #8 + Defensive Frontend Principle).
   */
  delivery_to_warehouse: number | null
}

/**
 * Absolute costs in RUB
 */
export interface CostsRub {
  /** Cost of Goods Sold ₽ */
  cogs: number
  /** WB Commission ₽ */
  commission: number
  /** Logistics (delivery) ₽ */
  logistics_delivery: number
  /** Logistics (return) ₽ */
  logistics_return: number
  /** Storage costs ₽ */
  storage: number
  /** Paid acceptance ₽ */
  paid_acceptance: number
  /** Penalties ₽ */
  penalties: number
  /** Other deductions ₽ */
  other_deductions: number
  /** Advertising ₽ */
  advertising: number
  /**
   * Delivery to warehouse ₽ (seller cost, from shipment cost allocation).
   * NULLABLE per backend request-backend/173 § F5
   * (`null` = no confirmed shipments for this SKU/week).
   * Hardened from optional `?: number` to nullable `: number | null`
   * in Story 96.4-FE — `null` and `undefined` are not interchangeable
   * (anti-pattern #8 + Defensive Frontend Principle).
   */
  delivery_to_warehouse: number | null
}

/**
 * Single item (SKU/category/brand) unit economics data
 */
export interface UnitEconomicsItem {
  /** SKU ID (or category/brand name if aggregated) */
  sku_id: string
  /** Product name (or aggregation label) */
  product_name: string
  /** Category name */
  category?: string
  /** Brand name */
  brand?: string
  /** Total revenue ₽ */
  revenue: number
  /** Units sold */
  units_sold?: number

  /** Cost breakdown as % of revenue */
  costs_pct: CostsPct
  /** Cost breakdown in absolute ₽ */
  costs_rub: CostsRub

  /** Total costs as % of revenue */
  total_costs_pct: number
  /** Net margin as % of revenue — `null` when revenue = 0 (backend sends null; render "—"). */
  net_margin_pct: number | null
  /** Net profit in ₽ */
  net_profit: number

  /** Profitability classification */
  profitability_status: ProfitabilityStatus
  /** AI-generated insights (optional) */
  insights?: string[]

  /** Whether COGS is assigned */
  has_cogs: boolean

  /**
   * Final Cost per Unit (₽/ед) from latest confirmed shipment.
   * Sourced via FCU aggregation pipeline (Story 77.5). Spread into UnitEconomicsItem
   * during merge at useUnitEconomicsPageState.ts (Story 96.10-FE AC-2).
   * `null` = backend has no FCU data for this SKU yet (e.g., no confirmed shipment).
   * `undefined` = SKU not present in FCU response (race condition or pagination cutoff).
   * Both render as `—` in UI per CLAUDE.md anti-pattern #8.
   */
  latestFcu?: number | null
  /**
   * Delivery Cost per Unit (₽/ед) — the warehouse-delivery portion of latestFcu.
   * Story 96.10-FE — surfaced per-SKU for tooltip on delivery_to_warehouse % column.
   * Same nullability semantics as latestFcu.
   */
  latestDcu?: number | null
}

/**
 * Summary statistics
 */
export interface UnitEconomicsSummary {
  /** Total revenue across all items */
  total_revenue: number
  /** Total net profit */
  total_net_profit: number
  /** Request #58: Total YOUR price before WB discounts (optional - from weekly_payout_summary) */
  total_your_price?: number
  /** Average COGS % — `null` when no item has COGS (backend sends null; render "—"). */
  avg_cogs_pct: number | null
  /** Average WB fees (commission + logistics + storage) % */
  avg_wb_fees_pct: number
  /** Average net margin % — `null` when total revenue = 0 (backend sends null; render "—"). */
  avg_net_margin_pct: number | null
  /** Total SKUs analyzed */
  sku_count: number
  /** SKUs with positive margin */
  profitable_sku_count: number
  /** SKUs with negative margin */
  loss_making_sku_count: number
  /** SKUs without COGS data */
  missing_cogs_count: number
}

/**
 * Response metadata
 */
export interface UnitEconomicsMeta {
  /** ISO week */
  week: string
  /** Cabinet UUID */
  cabinet_id: string
  /** Aggregation level used */
  view_by: UnitEconomicsViewBy
  /** When response was generated */
  generated_at: string
  /**
   * Ordered list of cost-category keys driving waterfall chart ordering.
   * Per request-backend/173 § F4. Frontend uses this array as authoritative;
   * falls back to hardcoded order with `console.warn` if response omits the field.
   * Added in Story 96.3-FE.
   */
  cost_category_order?: string[]
}

/**
 * Full API response from GET /v1/analytics/unit-economics
 */
export interface UnitEconomicsResponse {
  meta: UnitEconomicsMeta
  summary: UnitEconomicsSummary
  data: UnitEconomicsItem[]
}

// ============================================================================
// Re-exports from unit-economics-cost-categories.ts (backward compatibility)
// ============================================================================

export type {
  ProfitabilityStatusConfig,
  CostCategoryConfig,
  WaterfallDataPoint,
} from './unit-economics-cost-categories'
