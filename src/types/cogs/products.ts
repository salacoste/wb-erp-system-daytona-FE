/**
 * COGS — Product & Margin Analytics Types
 * Extracted from cogs.ts (Story 99.1-FE)
 */

import type { MissingDataReason, CogsRecord, ApplicableCogs } from './cogs'

// ============================================================================
// Product Types
// ============================================================================

export interface ProductWithCogs {
  nm_id: string
  sa_name: string
  brand?: string
  category?: string
  has_cogs: boolean
  cogs: CogsRecord | null
  barcode?: string
  current_margin_pct: number | null
  current_margin_period: string | null
  current_margin_sales_qty: number | null
  current_margin_revenue: number | null
  missing_data_reason: MissingDataReason
  last_sale_date: string | null
  total_sales_qty: number
  is_orphan?: boolean
}

export interface ProductListItem {
  nm_id: string
  sa_name: string
  brand?: string
  category?: string
  vendor_code?: string
  has_cogs: boolean
  cogs?: CogsRecord | null
  barcode?: string
  last_sale_date: string | null
  total_sales_qty: number
  current_margin_pct?: number | null
  current_margin_period?: string | null
  current_margin_sales_qty?: number | null
  current_margin_revenue?: number | null
  missing_data_reason?: MissingDataReason
  last_sales_week?: string | null
  last_sales_margin_pct?: number | null
  last_sales_qty?: number | null
  weeks_since_last_sale?: number | null
  applicable_cogs?: ApplicableCogs | null
  storage_cost_daily_avg?: number | null
  storage_cost_weekly?: number | null
  storage_period?: string | null
  is_orphan?: boolean
}

// ============================================================================
// Pagination
// ============================================================================

export interface Pagination {
  total: number
  next_cursor?: string
  limit?: number
  page?: number
  total_pages?: number
}

export interface ProductListResponse {
  products: ProductListItem[]
  pagination: Pagination
}

// ============================================================================
// Margin Analytics
// ============================================================================

export interface MarginAnalyticsSku {
  nm_id: string
  sa_name: string
  revenue_net: number
  qty: number
  cogs?: number
  profit?: number
  margin_pct?: number
  markup_percent?: number
  missing_cogs_flag: boolean
  profit_per_unit?: number | null
  roi?: number | null
  weeks_with_sales?: number
  weeks_with_cogs?: number
  logistics_cost_rub?: string
  storage_cost_rub?: string
  penalties_rub?: string
  paid_acceptance_cost_rub?: string
  acquiring_fee_rub?: string
  loyalty_fee_rub?: string
  loyalty_compensation_rub?: string
  commission_rub?: string
  other_adjustments_rub?: string
  advertising_cost_rub?: string
  total_expenses_rub?: string
  total_expenses?: number
  operating_profit_rub?: string
  operating_profit?: number | null
  operating_margin_pct?: number | null
  has_revenue?: boolean
  net_profit?: number
  net_margin_pct?: number | null
  storage_data_source?: 'paid_storage_api' | 'unavailable'
}

export interface MarginAnalyticsAggregated {
  brand?: string
  category?: string
  revenue_gross?: number
  revenue_net: number
  qty: number
  total_skus?: number
  cogs?: number
  profit?: number
  margin_pct?: number
  markup_percent?: number
  missing_cogs_count?: number
  profit_per_unit?: number | null
  roi?: number | null
  storage_cost?: number
  penalties?: number
  paid_acceptance_cost?: number
  acquiring_fee?: number
  loyalty_fee?: number
  loyalty_compensation?: number
  commission?: number
  other_adjustments?: number
  total_expenses?: number
  operating_profit?: number
  operating_margin_pct?: number | null
  skus_with_expenses_only?: number
}

export interface MarginAnalyticsSkuResponse {
  data: MarginAnalyticsSku[]
  meta?: {
    week: string
    cabinet_id: string
    generated_at: string
  }
}

export interface MarginAnalyticsAggregatedResponse {
  data: MarginAnalyticsAggregated[]
  meta?: {
    week: string
    cabinet_id: string
    generated_at: string
  }
}
