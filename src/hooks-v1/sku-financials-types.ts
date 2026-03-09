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
