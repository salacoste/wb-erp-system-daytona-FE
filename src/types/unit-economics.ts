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
  | 'excellent'  // > 25% margin
  | 'good'       // 15-25% margin
  | 'warning'    // 5-15% margin
  | 'critical'   // 0-5% margin
  | 'loss';      // < 0% margin

/**
 * View aggregation level
 */
export type UnitEconomicsViewBy = 'sku' | 'category' | 'brand' | 'total';

/**
 * Sort field options
 */
export type UnitEconomicsSortBy = 'revenue' | 'net_margin_pct' | 'cogs_pct' | 'total_costs_pct';

// ============================================================================
// Query Parameters
// ============================================================================

/**
 * Query parameters for GET /v1/analytics/unit-economics
 */
export interface UnitEconomicsQueryParams {
  /** ISO week (e.g., "2025-W50") - required */
  week: string;
  /** Aggregation level */
  view_by?: UnitEconomicsViewBy;
  /** Sort field */
  sort_by?: UnitEconomicsSortBy;
  /** Sort order */
  sort_order?: 'asc' | 'desc';
  /** Max results (1-500, default: 100) */
  limit?: number;
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Cost percentages breakdown (% of revenue)
 */
export interface CostsPct {
  /** Cost of Goods Sold % */
  cogs: number;
  /** WB Commission % */
  commission: number;
  /** Logistics (delivery to customer) % */
  logistics_delivery: number;
  /** Logistics (return shipping) % */
  logistics_return: number;
  /** Storage costs % */
  storage: number;
  /** Paid acceptance % */
  paid_acceptance: number;
  /** Penalties % */
  penalties: number;
  /** Other deductions % */
  other_deductions: number;
  /** Advertising % (future) */
  advertising: number;
}

/**
 * Absolute costs in RUB
 */
export interface CostsRub {
  /** Cost of Goods Sold ₽ */
  cogs: number;
  /** WB Commission ₽ */
  commission: number;
  /** Logistics (delivery) ₽ */
  logistics_delivery: number;
  /** Logistics (return) ₽ */
  logistics_return: number;
  /** Storage costs ₽ */
  storage: number;
  /** Paid acceptance ₽ */
  paid_acceptance: number;
  /** Penalties ₽ */
  penalties: number;
  /** Other deductions ₽ */
  other_deductions: number;
  /** Advertising ₽ */
  advertising: number;
}

/**
 * Single item (SKU/category/brand) unit economics data
 */
export interface UnitEconomicsItem {
  /** SKU ID (or category/brand name if aggregated) */
  sku_id: string;
  /** Product name (or aggregation label) */
  product_name: string;
  /** Category name */
  category?: string;
  /** Brand name */
  brand?: string;
  /** Total revenue ₽ */
  revenue: number;
  /** Units sold */
  units_sold?: number;

  /** Cost breakdown as % of revenue */
  costs_pct: CostsPct;
  /** Cost breakdown in absolute ₽ */
  costs_rub: CostsRub;

  /** Total costs as % of revenue */
  total_costs_pct: number;
  /** Net margin as % of revenue */
  net_margin_pct: number;
  /** Net profit in ₽ */
  net_profit: number;

  /** Profitability classification */
  profitability_status: ProfitabilityStatus;
  /** AI-generated insights (optional) */
  insights?: string[];

  /** Whether COGS is assigned */
  has_cogs: boolean;
}

/**
 * Summary statistics
 */
export interface UnitEconomicsSummary {
  /** Total revenue across all items */
  total_revenue: number;
  /** Total net profit */
  total_net_profit: number;
  /** Request #58: Total YOUR price before WB discounts (optional - from weekly_payout_summary) */
  total_your_price?: number;
  /** Average COGS % */
  avg_cogs_pct: number;
  /** Average WB fees (commission + logistics + storage) % */
  avg_wb_fees_pct: number;
  /** Average net margin % */
  avg_net_margin_pct: number;
  /** Total SKUs analyzed */
  sku_count: number;
  /** SKUs with positive margin */
  profitable_sku_count: number;
  /** SKUs with negative margin */
  loss_making_sku_count: number;
  /** SKUs without COGS data */
  missing_cogs_count: number;
}

/**
 * Response metadata
 */
export interface UnitEconomicsMeta {
  /** ISO week */
  week: string;
  /** Cabinet UUID */
  cabinet_id: string;
  /** Aggregation level used */
  view_by: UnitEconomicsViewBy;
  /** When response was generated */
  generated_at: string;
}

/**
 * Full API response from GET /v1/analytics/unit-economics
 */
export interface UnitEconomicsResponse {
  meta: UnitEconomicsMeta;
  summary: UnitEconomicsSummary;
  data: UnitEconomicsItem[];
}

// ============================================================================
// UI Helper Types
// ============================================================================

/**
 * Profitability status display configuration
 */
export interface ProfitabilityStatusConfig {
  /** Full Russian label */
  label: string;
  /** Short label for badges */
  labelShort: string;
  /** Primary color hex */
  color: string;
  /** Background color for badges */
  bgColor: string;
  /** Tailwind bg class */
  bgClass: string;
  /** Tailwind text class */
  textClass: string;
  /** Emoji icon */
  icon: string;
  /** Min margin % for this status */
  minMargin: number;
  /** Max margin % for this status */
  maxMargin: number;
}

/**
 * Cost category configuration for waterfall chart
 */
export interface CostCategoryConfig {
  /** Unique key */
  key: keyof CostsPct;
  /** Russian label */
  label: string;
  /** Color for chart */
  color: string;
  /** Category grouping */
  group: 'cogs' | 'wb_fees' | 'other';
}

/**
 * Waterfall chart data point
 */
export interface WaterfallDataPoint {
  /** Category name */
  name: string;
  /** Value (positive for costs, can be negative for profit) */
  value: number;
  /** Running total for waterfall */
  runningTotal: number;
  /** Color */
  color: string;
  /** Is this the profit bar? */
  isProfit?: boolean;
}
