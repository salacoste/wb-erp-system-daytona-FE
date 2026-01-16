/**
 * Supply Planning Analytics Types
 * Epic 6 - Supply Planning & Stockout Prevention
 * Backend: Epic 28 - Supply Planning Analytics API
 * Reference: docs/epics/epic-28-supply-planning-analytics.md
 */

// ============================================================================
// Enums & Constants
// ============================================================================

/**
 * Stockout risk classification
 * Based on days until stockout
 */
export type StockoutRisk =
  | 'out_of_stock'  // current_stock = 0
  | 'critical'      // 0-7 days
  | 'warning'       // 7-14 days
  | 'low'           // 14-30 days
  | 'healthy';      // > 30 days

/**
 * Reorder status - recommended action
 */
export type ReorderStatus =
  | 'urgent'  // days_until_stockout < 7
  | 'soon'    // days_until_stockout < safety_stock_days
  | 'ok';     // days_until_stockout >= safety_stock_days

/**
 * Velocity trend - sales acceleration/deceleration
 */
export type VelocityTrend =
  | 'growing'    // > +10% vs previous period
  | 'stable'     // -10% to +10%
  | 'declining'; // < -10%

/**
 * View aggregation level
 */
export type SupplyPlanningViewBy = 'sku' | 'category' | 'brand';

/**
 * Filter options
 */
export type SupplyPlanningShowOnly = 'all' | 'stockout_risk' | 'reorder_needed';

// ============================================================================
// Query Parameters
// ============================================================================

/**
 * Query parameters for GET /v1/analytics/supply-planning
 */
export interface SupplyPlanningQueryParams {
  /** Reference week for velocity calculation (ISO week, e.g., "2025-W50") */
  week?: string;
  /** Weeks for average velocity calculation (1-13, default: 4) */
  velocity_weeks?: number;
  /** Target safety stock in days (7-60, default: 14) */
  safety_stock_days?: number;
  /** Aggregation level */
  view_by?: SupplyPlanningViewBy;
  /** Filter to specific risk levels */
  show_only?: SupplyPlanningShowOnly;
  /** Sort field */
  sort_by?: 'days_until_stockout' | 'reorder_quantity' | 'avg_daily_sales' | 'current_stock';
  /** Sort order */
  sort_order?: 'asc' | 'desc';
  /** Max results (1-500, default: 100) */
  limit?: number;
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Warehouse stock breakdown
 */
export interface WarehouseStock {
  /** Warehouse name (e.g., "Коледино", "Электросталь") */
  name: string;
  /** WB office ID */
  office_id?: number;
  /** Stock quantity at this warehouse */
  stock: number;
}

/**
 * Single SKU supply planning data
 */
export interface SupplyPlanningItem {
  /** WB article ID */
  sku_id: string;
  /** Product name */
  product_name: string;
  /** Category name */
  category?: string;
  /** Brand name */
  brand?: string;

  // Stock levels
  /** Current stock at WB warehouses */
  current_stock: number;
  /** Units in transit to WB */
  in_transit: number;
  /** Effective stock = current_stock + in_transit */
  effective_stock: number;

  // Velocity metrics
  /** Average daily sales (units/day) */
  avg_daily_sales: number;
  /** Sales trend vs previous period (null for new products without history) */
  velocity_trend: VelocityTrend | null;

  // Stockout prediction
  /** Days until stock runs out (null if no sales) */
  days_until_stockout: number | null;
  /** Predicted stockout date (ISO date) */
  stockout_date: string | null;
  /** Risk classification */
  stockout_risk: StockoutRisk;

  // Reorder recommendations
  /** Target safety stock in units */
  safety_stock_units: number;
  /** Recommended reorder quantity */
  reorder_quantity: number;
  /** Reorder urgency status */
  reorder_status: ReorderStatus;
  /** Reorder value in RUB (reorder_quantity * cogs) */
  reorder_value: number;

  // Cost data
  /** COGS per unit (null if not assigned) */
  cogs_per_unit: number | null;
  /** Whether COGS is assigned */
  has_cogs: boolean;

  // Warehouse breakdown
  /** Stock by warehouse */
  warehouses: WarehouseStock[];
}

/**
 * Summary statistics
 */
export interface SupplyPlanningSummary {
  /** Total SKUs analyzed */
  total_skus: number;
  /** SKUs with zero stock */
  out_of_stock_count: number;
  /** SKUs with critical risk (0-7 days) */
  stockout_critical: number;
  /** SKUs with warning risk (7-14 days) */
  stockout_warning: number;
  /** SKUs with low risk (14-30 days) */
  stockout_low: number;
  /** SKUs with healthy stock (>30 days) */
  healthy_stock: number;
  /** SKUs requiring urgent reorder */
  reorder_urgent: number;
  /** SKUs requiring reorder soon */
  reorder_soon: number;
  /** Total units in transit */
  total_in_transit_units: number;
  /** Total recommended reorder value in RUB */
  total_reorder_value: number;
}

/**
 * Response metadata
 */
export interface SupplyPlanningMeta {
  /** Cabinet UUID */
  cabinet_id: string;
  /** Velocity calculation period in weeks */
  velocity_weeks: number;
  /** Safety stock target in days */
  safety_stock_days: number;
  /** When stock data was last synced from WB */
  stocks_updated_at: string;
  /** When this response was generated */
  generated_at: string;
}

/**
 * Full API response from GET /v1/analytics/supply-planning
 */
export interface SupplyPlanningResponse {
  meta: SupplyPlanningMeta;
  summary: SupplyPlanningSummary;
  data: SupplyPlanningItem[];
}

// ============================================================================
// UI Helper Types
// ============================================================================

/**
 * Risk status display configuration
 * Updated per UX Expert specs (Sally, 2025-12-12)
 */
export interface RiskStatusConfig {
  /** Full label (e.g., "Нет в наличии") */
  label: string;
  /** Short label for compact views (e.g., "Нет") */
  labelShort: string;
  /** Primary color hex (e.g., "#1F2937") */
  color: string;
  /** Background color for light badges (e.g., "#F3F4F6") */
  bgColor: string;
  /** Emoji icon for quick visual (e.g., "⬛") */
  icon: string;
  /** Lucide icon component name (e.g., "PackageX") */
  lucideIcon: string;
  /** Tailwind bg class for solid badges (e.g., "bg-gray-800") */
  bgClass: string;
  /** Tailwind text class for solid badges (e.g., "text-white") */
  textClass: string;
  /** Sort priority (0 = most urgent) */
  priority: number;
}

/**
 * Reorder status display configuration
 */
export interface ReorderStatusConfig {
  label: string;
  color: string;
  bgColor: string;
}

/**
 * Distribution chart data point
 */
export interface RiskDistributionData {
  status: StockoutRisk;
  count: number;
  label: string;
  color: string;
}
