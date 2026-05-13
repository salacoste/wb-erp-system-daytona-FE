/**
 * Advertising Analytics — Boundary Normalizer
 *
 * Normalizes raw backend responses from GET /v1/analytics/advertising into
 * the frontend-canonical shape defined in types/advertising-analytics/analytics.ts.
 *
 * Backend shape (all camelCase): { items, summary, query, pagination, cachedAt?, daily?, multiCampaignSkuWarnings? }
 * Frontend shape (snake_case):   { data, summary, meta, daily?, multiCampaignSkuWarnings? }
 *
 * @see src/lib/api/advertising-analytics-api.ts
 * @see src/types/advertising-analytics/analytics.ts
 */

import type {
  AdvertisingAnalyticsResponse,
  AdvertisingSummary,
  AdvertisingItem,
  AdvertisingDailyItem,
  MultiCampaignSkuWarning,
  ViewByMode,
} from '@/types/advertising-analytics'

// ---------------------------------------------------------------------------
// Private scalar helpers
// ---------------------------------------------------------------------------

function toNum(raw: unknown): number {
  const n = Number(raw ?? 0)
  return Number.isFinite(n) ? n : 0
}

function toStr(raw: unknown): string {
  return raw == null ? '' : String(raw)
}

function toNullableNum(raw: unknown): number | null {
  if (raw == null) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function toNumArr(raw: unknown): number[] {
  return Array.isArray(raw) ? raw.map(Number) : []
}

// ---------------------------------------------------------------------------
// Private normalizers
// ---------------------------------------------------------------------------

function normalizeSummary(raw: unknown): AdvertisingSummary {
  const s = (raw ?? {}) as Record<string, unknown>
  return {
    total_spend: toNum(s.totalSpend),
    total_sales: toNum(s.totalSales),
    total_revenue: toNum(s.totalRevenue),
    total_profit: toNum(s.totalProfit),
    overall_roas: toNullableNum(s.avgRoas),
    overall_roi: toNullableNum(s.avgRoi),
    avg_ctr: toNum(s.avgCtr),
    avg_conversion_rate: toNum(s.avgConversionRate),
    total_organic_sales: toNum(s.totalOrganicSales),
    avg_organic_contribution: toNum(s.avgOrganicContribution),
  }
}

function normalizeItem(item: unknown, index: number): AdvertisingItem {
  const d = (item ?? {}) as Record<string, unknown>
  const eff = (d.efficiency ?? {}) as Record<string, unknown>
  return {
    key: toStr(d.key) || `item-${index}`,
    type: (d.type as 'merged_group' | 'individual') ?? undefined,
    imtId: d.imtId != null ? Number(d.imtId) : null,
    mergedProducts: Array.isArray(d.mergedProducts)
      ? d.mergedProducts.map((p: unknown) => {
          const mp = (p ?? {}) as Record<string, unknown>
          return { nmId: Number(mp.nmId ?? 0), vendorCode: toStr(mp.vendorCode) }
        })
      : undefined,
    sku_id: d.nmId != null ? String(d.nmId) : undefined,
    campaign_id: d.campaignId != null ? Number(d.campaignId) : undefined,
    product_name: toStr(d.label) || undefined,
    brand: toStr(d.brand) || undefined,
    category: toStr(d.category) || undefined,
    views: toNum(d.views),
    clicks: toNum(d.clicks),
    orders: toNum(d.orders),
    spend: toNum(d.spend),
    total_sales: toNum(d.totalSales),
    revenue: toNullableNum(d.revenue),
    profit: toNullableNum(d.profit),
    organic_sales: toNum(d.organicSales),
    organic_contribution: toNum(d.organicContribution),
    roas: toNullableNum(d.roas),
    roi: toNullableNum(d.roi),
    ctr: toNum(d.ctr),
    cpc: toNum(d.cpc),
    conversion_rate: toNum(d.conversionRate),
    profit_after_ads: toNum(d.profitAfterAds),
    efficiency_status: (toStr(eff.status) || 'unknown') as AdvertisingItem['efficiency_status'],
  }
}

function normalizeDaily(day: unknown): AdvertisingDailyItem {
  const d = (day ?? {}) as Record<string, unknown>
  return {
    date: toStr(d.date),
    spend: toNum(d.spend),
    views: toNum(d.views),
    clicks: toNum(d.clicks),
    orders: toNum(d.orders),
    ctr: toNullableNum(d.ctr) ?? undefined,
    cpc: toNullableNum(d.cpc) ?? undefined,
    revenue_attributed: toNullableNum(d.revenueAttributed) ?? undefined,
  }
}

function normalizeWarning(w: unknown): MultiCampaignSkuWarning {
  const d = (w ?? {}) as Record<string, unknown>
  return {
    nmId: Number(d.nmId ?? 0),
    campaigns: toNumArr(d.campaigns),
    message: toStr(d.message),
  }
}

// ---------------------------------------------------------------------------
// Exported normalizer
// ---------------------------------------------------------------------------

export function normalizeAdvertisingResponse(
  raw: unknown,
  paramsFrom: string,
  paramsTo: string,
  paramsViewBy?: string
): AdvertisingAnalyticsResponse {
  const r = (raw ?? {}) as Record<string, unknown>
  const query = (r.query ?? {}) as Record<string, unknown>

  return {
    meta: {
      cabinet_id: toStr(query.cabinetId) || 'unknown',
      date_range: {
        from: toStr(query.from) || paramsFrom,
        to: toStr(query.to) || paramsTo,
      },
      view_by: (toStr(query.viewBy) || paramsViewBy || 'sku') as ViewByMode,
      last_sync: toStr(r.cachedAt) || new Date().toISOString(),
    },
    summary: normalizeSummary(r.summary),
    data: (Array.isArray(r.items) ? r.items : []).map(normalizeItem),
    daily: Array.isArray(r.daily) ? r.daily.map(normalizeDaily) : undefined,
    multiCampaignSkuWarnings: Array.isArray(r.multiCampaignSkuWarnings)
      ? r.multiCampaignSkuWarnings.map(normalizeWarning)
      : undefined,
  }
}
