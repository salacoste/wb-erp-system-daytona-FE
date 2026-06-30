/**
 * Margin Analytics By SKU — Raw item type & mapper
 * Extracted from useMarginAnalyticsBySku.ts for file-size compliance (Epic 134-FE)
 */

/** Raw backend item shape for margin analytics by SKU */
export interface RawSkuItem {
  nm_id: number
  sa_name: string
  revenue_net: number
  total_units: number
  cogs?: number | null
  profit?: number | null
  margin_pct?: number | null
  markup_percent?: number | null
  missing_cogs_flag?: boolean
  profit_per_unit?: number | null
  roi?: number | null
  weeks_with_sales?: number
  weeks_with_cogs?: number
  logistics_cost?: number | null
  storage_cost?: number | null
  penalties?: number | null
  paid_acceptance_cost?: number | null
  advertising_cost?: number | null
  total_expenses?: number | null
  operating_profit?: number | null
  operating_margin_pct?: number | null
  has_revenue?: boolean
  net_profit?: number | null
  net_margin_pct?: number | null
  storage_data_source?: 'paid_storage_api' | 'unavailable'
  // FR-2..FR-5 (#219) — number|null, passed through unchanged. advertising_cost
  // is already above (also feeds the Epic-26 advertising_cost_rub string).
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

/** Map a single SKU API item to the frontend response shape */
export function mapSkuItem(raw: unknown) {
  const item = raw as RawSkuItem
  return {
    nm_id: String(item.nm_id), // Anti-pattern #10: opaque numeric ID → string
    sa_name: item.sa_name,
    revenue_net: item.revenue_net,
    qty: item.total_units,
    cogs: item.cogs ?? undefined,
    profit: item.profit ?? undefined,
    margin_pct: item.margin_pct ?? undefined,
    markup_percent: item.markup_percent ?? undefined,
    missing_cogs_flag: item.missing_cogs_flag || false,
    // Story 6.3-FE: ROI & Profit per Unit
    profit_per_unit: item.profit_per_unit,
    roi: item.roi,
    // DEFER-001: Weeks coverage
    weeks_with_sales: item.weeks_with_sales,
    weeks_with_cogs: item.weeks_with_cogs,
    // Request #60 / Epic 26: Operational costs per SKU
    logistics_cost_rub: item.logistics_cost ? String(item.logistics_cost) : undefined,
    storage_cost_rub: item.storage_cost ? String(item.storage_cost) : undefined,
    penalties_rub: item.penalties ? String(item.penalties) : undefined,
    paid_acceptance_cost_rub: item.paid_acceptance_cost
      ? String(item.paid_acceptance_cost)
      : undefined,
    advertising_cost_rub: item.advertising_cost ? String(item.advertising_cost) : undefined,
    // Epic 30: Calculated totals from backend
    total_expenses_rub: item.total_expenses ? String(item.total_expenses) : undefined,
    total_expenses: item.total_expenses ?? undefined,
    operating_profit_rub: item.operating_profit ? String(item.operating_profit) : undefined,
    operating_profit: item.operating_profit ?? undefined,
    operating_margin_pct: item.operating_margin_pct,
    has_revenue: item.has_revenue,
    // Epic 30: Net profit fields
    net_profit: item.net_profit ?? undefined,
    net_margin_pct: item.net_margin_pct ?? undefined,
    storage_data_source: item.storage_data_source,
    // FR-2..FR-5 (#219) — pass through, preserve null (never ?? 0; anti-pattern #8).
    advertising_cost: item.advertising_cost ?? null,
    drr_pct: item.drr_pct ?? null,
    ad_cost_per_unit: item.ad_cost_per_unit ?? null,
    tax_allocated: item.tax_allocated ?? null,
    net_profit_after_tax: item.net_profit_after_tax ?? null,
    net_margin_after_tax_pct: item.net_margin_after_tax_pct ?? null,
    spp_rub: item.spp_rub ?? null,
    spp_pct: item.spp_pct ?? null,
    cancellations_qty: item.cancellations_qty ?? null,
    stock_fbs: item.stock_fbs ?? null,
    stock_fbo: item.stock_fbo ?? null,
    stock_total: item.stock_total ?? null,
    stock_value_rub: item.stock_value_rub ?? null,
    stock_value_share_pct: item.stock_value_share_pct ?? null,
  }
}
