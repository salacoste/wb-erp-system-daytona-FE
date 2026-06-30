/**
 * Backend Response Types for SKU Financials Analytics
 * Epic 31: Complete Per-SKU Financial Analytics
 *
 * snake_case types matching the backend API response structure.
 * Extracted from useSkuFinancials.ts for file size compliance (Epic 74).
 */

import type { ProfitabilityStatus } from '@/types/sku-financials'

export interface BackendSales {
  quantity: number
  revenue_gross: number
  revenue_net: number
}

export interface BackendReturns {
  quantity: number
  revenue_gross: number
  revenue_net: number
}

export interface BackendCogs {
  unit_cost: number
  total: number
  source: string
  valid_from: string
}

export interface BackendExpenses {
  logistics_delivery: number
  logistics_return: number
  logistics_total: number
  storage: number
  storage_source: 'paid_storage_api' | 'unavailable'
  penalties: number
  paid_acceptance: number
  other_adjustments: number // Request #68
  total_operating: number
}

export interface BackendVisibility {
  commission_sales: number
  commission_other: number
  commission_total: number
  acquiring_fee: number
  comment: string
}

export interface BackendSkuItem {
  nm_id: string
  sa_name: string
  brand?: string
  category?: string
  sales: BackendSales
  returns: BackendReturns
  cogs: BackendCogs | null
  gross_profit: number | null
  gross_margin_pct: number | null
  expenses: BackendExpenses
  visibility_breakdown?: BackendVisibility
  operating_profit: number | null
  operating_margin_pct: number | null
  profitability_status: ProfitabilityStatus
  // — FR-2..FR-5 competitor-parity fields (backend contract #219, verified W26).
  //   All gated by include_ads/include_stock query flags; null (never 0) when N/A
  //   → transform preserves null → UI renders "—" (anti-pattern #8). All optional
  //   because they are absent unless the corresponding flag is sent. —
  advertising_cost?: number | null
  drr_pct?: number | null
  ad_cost_per_unit?: number | null
  tax_allocated?: number | null
  net_profit_after_tax?: number | null
  net_margin_after_tax_pct?: number | null
  spp_rub?: number | null
  spp_pct?: number | null
  cancellations_qty?: number | null
  stock_fbs?: number | null
  stock_fbo?: number | null
  stock_total?: number | null
  stock_value_rub?: number | null
  stock_value_share_pct?: number | null
}

export interface BackendMeta {
  week: string
  week_start: string
  week_end: string
  cabinet_id: string
  total_skus: number
  returned_skus: number
  generated_at: string
  data_sources: {
    transactions: string
    storage: string
    cogs: string
  }
  warnings?: Array<{
    code: string
    message: string
    affected_skus?: string
  }>
}

export interface BackendTotals {
  revenue_gross: number
  revenue_net: number
  cogs: number | null
  gross_profit: number | null
  logistics_cost: number
  storage_cost: number
  penalties: number
  paid_acceptance: number
  other_adjustments: number // Request #68
  total_operating_expenses: number
  operating_profit: number | null
  operating_margin_pct: number | null
  visibility_metrics: {
    commission_total: number
    acquiring_fee: number
    comment: string
  }
}

export interface BackendResponse {
  meta: BackendMeta
  totals: BackendTotals
  data: BackendSkuItem[]
}
