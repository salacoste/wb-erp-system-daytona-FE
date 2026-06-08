/**
 * Unit Economics Analytics Types — Item & Summary interfaces
 * Split from core.ts for 200-line ESLint cap compliance.
 */

import type { ProfitabilityStatus } from './core'
import type { CostsPct, CostsRub } from './core'

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
