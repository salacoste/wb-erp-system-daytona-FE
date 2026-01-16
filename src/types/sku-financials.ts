/**
 * SKU Financials Types
 * Epic 31: Complete Per-SKU Financial Analytics
 * Reference: frontend/docs/request-backend/64-per-sku-margin-missing-expenses-backend-response.md
 *
 * Key design decisions:
 * - Storage from paid_storage_daily (Epic 24), NOT wb_finance_raw
 * - Commission/acquiring are visibility fields only (already in net_for_pay)
 * - Request #68: other_adjustments distributed proportionally to SKUs by revenue
 * - Operating profit = grossProfit - logistics - storage - penalties - paidAcceptance - otherAdjustments
 */

// ============================================================
// QUERY TYPES
// ============================================================

/**
 * Sort fields for SKU financials endpoint
 * Backend uses snake_case values
 */
export type SkuFinancialsSortBy =
  | 'revenue_net'
  | 'operating_profit'
  | 'operating_margin_pct'
  | 'storage_cost'
  | 'logistics_cost'

export interface SkuFinancialsQuery {
  week: string
  nm_ids?: string
  sortBy?: SkuFinancialsSortBy
  order?: 'asc' | 'desc'
  includeVisibility?: boolean
  limit?: number
  offset?: number
}

// ============================================================
// PROFITABILITY STATUS
// ============================================================

/**
 * Profitability classification based on operating margin percentage
 * - excellent: > 25%
 * - good: 15-25%
 * - warning: 5-15%
 * - critical: 0-5%
 * - loss: < 0%
 * - unknown: No COGS assigned
 */
export type ProfitabilityStatus =
  | 'excellent'
  | 'good'
  | 'warning'
  | 'critical'
  | 'loss'
  | 'unknown'

/**
 * Color mapping for profitability status (Tailwind classes)
 */
export const PROFITABILITY_COLORS: Record<ProfitabilityStatus, string> = {
  excellent: 'bg-green-500 text-white',
  good: 'bg-lime-500 text-white',
  warning: 'bg-yellow-500 text-black',
  critical: 'bg-orange-500 text-white',
  loss: 'bg-red-500 text-white',
  unknown: 'bg-gray-400 text-white',
}

/**
 * Hex colors for charts/badges
 */
export const PROFITABILITY_HEX: Record<ProfitabilityStatus, string> = {
  excellent: '#22C55E',
  good: '#84CC16',
  warning: '#EAB308',
  critical: '#F97316',
  loss: '#EF4444',
  unknown: '#9CA3AF',
}

/**
 * Labels for profitability status (Russian)
 */
export const PROFITABILITY_LABELS: Record<ProfitabilityStatus, string> = {
  excellent: 'Отлично',
  good: 'Хорошо',
  warning: 'Внимание',
  critical: 'Критично',
  loss: 'Убыток',
  unknown: 'Нет COGS',
}

// ============================================================
// RESPONSE TYPES
// ============================================================

export interface SkuFinancialRevenue {
  /** Gross revenue (retail_price_with_discount) */
  gross: number
  /** Net revenue (net_for_pay - after WB commission) */
  net: number
}

/**
 * Quantity information for SKU
 * Note: salesQty is raw sales count, NOT adjusted for returns
 */
export interface SkuFinancialQuantity {
  /** Number of units sold (raw count, returns NOT subtracted) */
  salesQty: number
  /** Number of units returned */
  returnsQty: number
}

export interface SkuFinancialCosts {
  /** Cost of goods sold (null if not assigned) */
  cogs: number | null
  /** Logistics cost (delivery + return) */
  logistics: number
  /** Storage cost from paid_storage_daily (Epic 24) */
  storage: number
  /** Penalties */
  penalties: number
  /** Paid acceptance cost */
  paidAcceptance: number
  /** Request #68: Distributed share of cabinet-level other_adjustments */
  otherAdjustments: number
}

/**
 * Visibility metrics - for information only!
 * These are NOT operating expenses - they are already deducted from gross to get net_for_pay
 */
export interface SkuFinancialVisibility {
  /** Total commission (already in net_for_pay) */
  commission: number
  /** Acquiring fee (already in net_for_pay) */
  acquiring: number
}

export interface SkuFinancialProfit {
  /** Gross profit = revenue.net - costs.cogs */
  gross: number
  /** Operating profit = gross - logistics - storage - penalties - paidAcceptance */
  operating: number
  /** Operating margin percentage */
  operatingMarginPct: number
}

export interface SkuFinancialItem {
  nmId: number
  productName: string
  category: string | null
  brand: string | null
  /** Quantity data (sales without return deduction) */
  quantity: SkuFinancialQuantity
  revenue: SkuFinancialRevenue
  costs: SkuFinancialCosts
  /** Visibility metrics (only when includeVisibility=true) */
  visibility?: SkuFinancialVisibility
  profit: SkuFinancialProfit
  profitabilityStatus: ProfitabilityStatus
  /** True if COGS is not assigned for this SKU */
  missingCogs: boolean
}

export interface SkuFinancialsMeta {
  week: string
  cabinetId: number
  generatedAt: string
}

export interface SkuFinancialsPagination {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export interface SkuFinancialsResponse {
  meta: SkuFinancialsMeta
  data: SkuFinancialItem[]
  pagination: SkuFinancialsPagination
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get CSS classes for profitability status badge
 */
export function getProfitabilityBadgeClass(status: ProfitabilityStatus): string {
  return PROFITABILITY_COLORS[status]
}

/**
 * Get hex color for profitability status
 */
export function getProfitabilityHex(status: ProfitabilityStatus): string {
  return PROFITABILITY_HEX[status]
}

/**
 * Get Russian label for profitability status
 */
export function getProfitabilityLabel(status: ProfitabilityStatus): string {
  return PROFITABILITY_LABELS[status]
}

/**
 * Calculate total operating expenses
 * Request #68: Now includes otherAdjustments
 */
export function getTotalOperatingExpenses(costs: SkuFinancialCosts): number {
  return costs.logistics + costs.storage + costs.penalties + costs.paidAcceptance + costs.otherAdjustments
}
