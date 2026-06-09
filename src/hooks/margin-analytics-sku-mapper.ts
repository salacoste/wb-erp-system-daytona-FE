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
  }
}
