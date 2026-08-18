/**
 * Unit Economics Cost Category & UI Helper Types
 * Extracted from unit-economics.ts for 200-line cap compliance.
 * Epic 5 - Unit Economics Analytics
 */

import type { CostsPct } from './core'
import type { UnitEconomicsViewBy } from './core'
import type { UnitEconomicsSummary } from './responses'

// ============================================================================
// UI Helper Types
// ============================================================================

/**
 * Profitability status display configuration
 */
export interface ProfitabilityStatusConfig {
  /** Full Russian label */
  label: string
  /** Short label for badges */
  labelShort: string
  /** Primary color (CSS var since 168.11 token migration) */
  color: string
  /** Tailwind bg class */
  bgClass: string
  /** Tailwind text class */
  textClass: string
  /** Emoji icon */
  icon: string
  /** Min margin % for this status */
  minMargin: number
  /** Max margin % for this status */
  maxMargin: number
}

/**
 * Cost category configuration for waterfall chart
 */
export interface CostCategoryConfig {
  /** Unique key */
  key: keyof CostsPct
  /** Russian label */
  label: string
  /** Color for chart */
  color: string
  /** Category grouping */
  group: 'cogs' | 'wb_fees' | 'seller_costs' | 'other'
}

/**
 * Waterfall chart data point
 */
export interface WaterfallDataPoint {
  /** Category name */
  name: string
  /** Value (positive for costs, can be negative for profit) */
  value: number
  /** Running total for waterfall */
  runningTotal: number
  /** Color */
  color: string
  /** Is this the profit bar? */
  isProfit?: boolean
}

// ============================================================================
// Response Metadata & Wrapper Types
// ============================================================================

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
  data: import('./responses').UnitEconomicsItem[]
}
