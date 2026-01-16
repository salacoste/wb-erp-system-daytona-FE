/**
 * Liquidity Analysis Types
 * Epic 7 - Liquidity Analysis (Ликвидность товаров)
 * Backend: Request #55 - Liquidity API Endpoint
 * Reference: docs/stories/7.1.liquidity-api-integration.md
 */

// ============================================================================
// Enums & Constants
// ============================================================================

/**
 * Liquidity classification based on turnover days
 * - highly_liquid: ≤30 days (fast movers)
 * - medium_liquid: 31-60 days (acceptable)
 * - low_liquid: 61-90 days (slow movers)
 * - illiquid: >90 days (dead stock)
 */
export type LiquidityCategory =
  | 'highly_liquid'
  | 'medium_liquid'
  | 'low_liquid'
  | 'illiquid';

/**
 * Action type recommendation
 */
export type ActionType =
  | 'MAXIMIZE'   // Scale up - invest more
  | 'MAINTAIN'   // Keep current level
  | 'REDUCE'     // Reduce stock
  | 'LIQUIDATE'; // Discount and sell

/**
 * Benchmark comparison status
 */
export type BenchmarkStatus =
  | 'excellent'  // Better than target
  | 'good'       // Meeting target
  | 'warning'    // Below target
  | 'critical';  // Far below target

/**
 * Trend insight type
 */
export type TrendInsightType =
  | 'improvement'
  | 'warning'
  | 'info';

// ============================================================================
// Query Parameters
// ============================================================================

/**
 * Query parameters for GET /v1/analytics/liquidity
 */
export interface LiquidityQueryParams {
  /** Filter by liquidity category */
  category_filter?: LiquidityCategory | 'all';
  /** Sort field */
  sort_by?: 'turnover_days' | 'stock_value' | 'velocity_per_day' | 'frozen_capital';
  /** Sort order */
  sort_order?: 'asc' | 'desc';
  /** Max results (1-500, default: 100) */
  limit?: number;
  /** Include liquidation scenarios for illiquid SKUs */
  include_liquidation_scenarios?: boolean;
}

/**
 * Query parameters for GET /v1/analytics/liquidity/trends
 */
export interface LiquidityTrendsQueryParams {
  /** Days of history (default: 90) */
  period?: number;
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Liquidation scenario for illiquid SKU
 * Calculates ROI for different discount levels
 */
export interface LiquidationScenario {
  /** Target turnover days */
  target_days: number;
  /** Required daily velocity to achieve target */
  required_velocity: number;
  /** Multiplier needed vs current velocity */
  velocity_multiplier: number;
  /** Suggested discount percentage */
  suggested_discount_pct: number;
  /** New price after discount */
  new_price: number;
  /** Expected revenue if all stock sells */
  expected_revenue: number;
  /** Expected profit after COGS */
  expected_profit: number;
  /** Is this scenario profitable? */
  is_profitable: boolean;
}

/**
 * Single SKU liquidity data
 */
export interface LiquidityItem {
  /** WB article ID */
  sku_id: string;
  /** Product name */
  product_name: string;
  /** Category name */
  category: string;
  /** Brand name */
  brand: string;

  /** Current stock quantity */
  current_stock_qty: number;
  /** Average stock quantity over 30 days */
  avg_stock_qty_30d: number;
  /** Stock value in ₽ (current_stock × COGS) */
  stock_value: number;

  /** Units sold in last 30 days */
  units_sold_30d: number;
  /** Daily sales velocity */
  velocity_per_day: number;

  /** Calculated turnover days */
  turnover_days: number;
  /** Liquidity classification */
  liquidity_category: LiquidityCategory;

  /** Current selling price */
  current_price: number;
  /** Cost of goods sold per unit */
  cogs_per_unit: number;

  /** AI-generated recommendation text */
  recommendation: string;
  /** Recommended action type */
  action_type: ActionType;

  /** Liquidation scenarios (only for illiquid SKUs) */
  liquidation_scenarios: LiquidationScenario[] | null;
}

/**
 * Distribution item for one liquidity category
 */
export interface LiquidityDistributionItem {
  /** Number of SKUs in this category */
  count: number;
  /** Total stock value in this category */
  value: number;
  /** Percentage of total inventory value */
  pct: number;
  /** Average turnover days in this category */
  avg_turnover_days: number;
}

/**
 * Distribution breakdown by liquidity category
 */
export interface LiquidityDistribution {
  highly_liquid: LiquidityDistributionItem;
  medium_liquid: LiquidityDistributionItem;
  low_liquid: LiquidityDistributionItem;
  illiquid: LiquidityDistributionItem;
}

/**
 * Benchmark comparison data
 */
export interface LiquidityBenchmarks {
  /** Your average turnover days */
  your_avg_turnover: number;
  /** Target average turnover days */
  target_avg_turnover: number;
  /** Industry average turnover days */
  industry_avg_turnover: number;
  /** Your highly liquid percentage */
  highly_liquid_pct: number;
  /** Target highly liquid percentage (>50%) */
  target_highly_liquid_pct: number;
  /** Your illiquid percentage */
  illiquid_pct: number;
  /** Target illiquid percentage (<5%) */
  target_illiquid_pct: number;
  /** Overall benchmark status */
  overall_status: BenchmarkStatus;
}

/**
 * Summary statistics
 */
export interface LiquiditySummary {
  /** Total inventory value in ₽ */
  total_inventory_value: number;
  /** Total number of SKUs */
  total_sku_count: number;
  /** Frozen capital (value of illiquid stock) in ₽ */
  frozen_capital: number;
  /** Frozen capital as percentage of total */
  frozen_capital_pct: number;
  /** Average turnover days across all SKUs */
  avg_turnover_days: number;
  /** Distribution by liquidity category */
  distribution: LiquidityDistribution;
  /** Benchmark comparison */
  benchmarks: LiquidityBenchmarks;
}

/**
 * Response metadata
 */
export interface LiquidityMeta {
  /** Cabinet UUID */
  cabinet_id: string;
  /** Analysis period in days (default: 30) */
  analysis_period_days: number;
  /** When response was generated */
  generated_at: string;
  /** Last stock data update timestamp */
  stock_data_updated_at: string;
}

/**
 * Full API response from GET /v1/analytics/liquidity
 */
export interface LiquidityResponse {
  meta: LiquidityMeta;
  summary: LiquiditySummary;
  data: LiquidityItem[];
}

// ============================================================================
// Trends Response Types
// ============================================================================

/**
 * Distribution percentages for a trend point
 */
export interface TrendDistribution {
  highly_liquid_pct: number;
  medium_liquid_pct: number;
  low_liquid_pct: number;
  illiquid_pct: number;
}

/**
 * Single trend data point
 */
export interface TrendDataPoint {
  /** Date string (YYYY-MM-DD) */
  date: string;
  /** Distribution percentages */
  distribution: TrendDistribution;
  /** Frozen capital in ₽ */
  frozen_capital: number;
  /** Average turnover days */
  avg_turnover_days: number;
}

/**
 * Trend insight message
 */
export interface TrendInsight {
  /** Insight type */
  type: TrendInsightType;
  /** Human-readable message */
  message: string;
}

/**
 * Trends response metadata
 */
export interface LiquidityTrendsMeta {
  /** Cabinet UUID */
  cabinet_id: string;
  /** Period in days */
  period_days: number;
  /** When response was generated */
  generated_at: string;
}

/**
 * Full API response from GET /v1/analytics/liquidity/trends
 */
export interface LiquidityTrendsResponse {
  meta: LiquidityTrendsMeta;
  trends: TrendDataPoint[];
  insights: TrendInsight[];
}

// ============================================================================
// UI Helper Types
// ============================================================================

/**
 * Liquidity category display configuration
 */
export interface LiquidityCategoryConfig {
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
  /** Min turnover days for this category */
  minDays: number;
  /** Max turnover days for this category */
  maxDays: number;
  /** Target share percentage */
  targetShare: string;
}

/**
 * Action type display configuration
 */
export interface ActionTypeConfig {
  /** Full Russian label */
  label: string;
  /** Button label */
  buttonLabel: string;
  /** Primary color hex */
  color: string;
  /** Tailwind variant */
  variant: 'default' | 'destructive' | 'outline' | 'secondary';
}

/**
 * Benchmark status display configuration
 */
export interface BenchmarkStatusConfig {
  /** Russian label */
  label: string;
  /** Primary color hex */
  color: string;
  /** Tailwind text class */
  textClass: string;
  /** Emoji icon */
  icon: string;
}

/**
 * Distribution chart data point
 */
export interface DistributionChartData {
  /** Category key */
  category: LiquidityCategory;
  /** Russian label */
  name: string;
  /** Value (percentage) */
  value: number;
  /** SKU count */
  count: number;
  /** Stock value in ₽ */
  stockValue: number;
  /** Color */
  color: string;
}

/**
 * Trend chart data point
 */
export interface TrendChartData {
  /** Date string */
  date: string;
  /** Formatted date for display */
  dateLabel: string;
  /** Category percentages */
  highly_liquid: number;
  medium_liquid: number;
  low_liquid: number;
  illiquid: number;
  /** Frozen capital */
  frozen_capital: number;
  /** Average turnover */
  avg_turnover: number;
}
