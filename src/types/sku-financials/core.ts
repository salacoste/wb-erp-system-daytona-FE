/**
 * SKU Financials Core Types — query, profitability, response interfaces
 * Split from sku-financials.ts for file size compliance
 */

// ============================================================
// QUERY TYPES
// ============================================================

/**
 * Sort fields for SKU financials endpoint
 * Backend uses snake_case values
 */
export type SkuFinancialsSortBy =
  'revenue_net' | 'operating_profit' | 'operating_margin_pct' | 'storage_cost' | 'logistics_cost'

export interface SkuFinancialsQuery {
  week: string
  nm_ids?: string
  sortBy?: SkuFinancialsSortBy
  order?: 'asc' | 'desc'
  includeVisibility?: boolean
  /** FR-2..FR-5 (#219): request competitor-parity ad fields (advertising_cost, drr_pct, ...). Default true. */
  includeAds?: boolean
  /** FR-2..FR-5 (#219): request competitor-parity stock fields (stock_fbs, stock_value_rub, ...). Default true. */
  includeStock?: boolean
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
export type ProfitabilityStatus = 'excellent' | 'good' | 'warning' | 'critical' | 'loss' | 'unknown'

/**
 * Color mapping for profitability status (Tailwind classes)
 * Story 168.11: /15-chip idiom (168.8 alerts/ReorderTable precedent). Soft tinted
 * profitability chips keep their semantic background while using the readable foreground token.
 */
export const PROFITABILITY_COLORS: Record<ProfitabilityStatus, string> = {
  excellent: 'bg-financial-positive/15 text-foreground',
  good: 'bg-status-information/15 text-foreground',
  warning: 'bg-status-warning/15 text-foreground',
  critical: 'bg-status-error/15 text-foreground',
  loss: 'bg-financial-negative/15 text-foreground',
  unknown: 'bg-muted text-muted-foreground',
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
  /** Gross profit = revenue.net - costs.cogs. Null when COGS is not assigned. */
  gross: number | null
  /** Operating profit = gross - logistics - storage - penalties - paidAcceptance. Null when COGS missing. */
  operating: number | null
  /** Operating margin percentage. Null when COGS missing. */
  operatingMarginPct: number | null
}

export interface SkuFinancialParity {
  /** FR-2: attributed ad spend, ₽; null means N/A/unavailable. */
  advertisingCost: number | null
  /** FR-2: ДРР = advertisingCost / revenue.net × 100; null means N/A. */
  drrPct: number | null
  /** FR-2: ad spend per sold unit; null when units=0/unavailable. */
  adCostPerUnit: number | null
  /** FR-3: allocated cabinet tax, ₽; null when tax system is unavailable. */
  taxAllocated: number | null
  /** FR-3: operating profit minus allocated tax, ₽; null when unavailable. */
  netProfitAfterTax: number | null
  /** FR-3: netProfitAfterTax / revenue.net × 100; null when unavailable. */
  netMarginAfterTaxPct: number | null
  /** FR-5: СПП buyer saving, positive ₽ discount; null when unavailable. */
  sppRub: number | null
  /** FR-5: revenue-weighted average СПП %, null when unavailable. */
  sppPct: number | null
  /** FR-5: cancellations in period, pcs; null when unavailable. */
  cancellationsQty: number | null
  /** FR-4: FBS stock units at latest snapshot <= week end. */
  stockFbs: number | null
  /** FR-4: FBO stock units; null until FBO sync exists. */
  stockFbo: number | null
  /** FR-4: total stock units; null when unavailable. */
  stockTotal: number | null
  /** FR-4: stock at purchase price, ₽; null for historical weeks/without COGS. */
  stockValueRub: number | null
  /** FR-4: stockValueRub share of cabinet stock value, %. */
  stockValueSharePct: number | null
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
  /** Optional competitor-parity enrichment from /v1/analytics/weekly/by-sku (#219). */
  parity?: SkuFinancialParity
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
