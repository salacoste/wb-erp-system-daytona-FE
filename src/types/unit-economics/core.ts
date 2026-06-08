/**
 * Unit Economics Analytics Types — Core interfaces
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
