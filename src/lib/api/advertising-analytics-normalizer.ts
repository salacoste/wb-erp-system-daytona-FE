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
  AdvertisingGroupedItem,
  AdvertisingDailyItem,
  MultiCampaignSkuWarning,
  ViewByMode,
  MainProduct,
  AggregateMetrics,
  MergedGroupProduct,
} from '@/types/advertising-analytics'
import { toCount, toNullableNumber, toStr } from '@/lib/api/normalizer-helpers'
import { logger } from '@/lib/logger'

// ---------------------------------------------------------------------------
// Private scalar helpers
// ---------------------------------------------------------------------------

// F-50: the normalizer is the AUTHORITATIVE guard for efficiency_status (Boundary
// Normalizer Pattern) — sanitize any out-of-union backend value to 'unknown' here so the
// EfficiencyBadge guard (F-47) is defense-in-depth, and the typed helpers isAttentionRequired/
// isLossStatus can trust their input instead of silently classifying a drift value as false.
const VALID_EFFICIENCY_STATUSES = new Set([
  'excellent',
  'good',
  'moderate',
  'poor',
  'loss',
  'unknown',
])

function toEfficiencyStatus(raw: unknown): AdvertisingGroupedItem['efficiency_status'] {
  const s = toStr(raw)
  if (s !== '' && !VALID_EFFICIENCY_STATUSES.has(s)) {
    // F-50: indicate the anomaly rather than silently masking a backend contract drift
    // (Defensive Frontend Principle). Empty/missing is the legitimate "no data" case (no warn).
    logger.warn(
      `[AdvertisingNormalizer] unknown efficiency_status "${s}" from backend → 'unknown' (file a backend ticket if it persists)`
    )
  }
  return (
    VALID_EFFICIENCY_STATUSES.has(s) ? s : 'unknown'
  ) as AdvertisingGroupedItem['efficiency_status']
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
    total_spend: toCount(s.totalSpend),
    total_sales: toCount(s.totalSales),
    total_revenue: toCount(s.totalRevenue),
    total_profit: toCount(s.totalProfit),
    overall_roas: toNullableNumber(s.avgRoas),
    overall_roi: toNullableNumber(s.avgRoi),
    avg_ctr: toCount(s.avgCtr),
    avg_conversion_rate: toCount(s.avgConversionRate),
    total_organic_sales: toCount(s.totalOrganicSales),
    avg_organic_contribution: toCount(s.avgOrganicContribution),
  }
}

function normalizeMainProduct(raw: unknown): MainProduct | undefined {
  const d = (raw ?? {}) as Record<string, unknown>
  const nmId = Number(d.nmId ?? 0)
  if (!nmId) return undefined
  return { nmId, vendorCode: toStr(d.vendorCode), name: toStr(d.name) || undefined }
}

function normalizeAggregateMetrics(raw: unknown): AggregateMetrics | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const d = raw as Record<string, unknown>
  return {
    totalViews: toCount(d.totalViews),
    totalClicks: toCount(d.totalClicks),
    totalOrders: toCount(d.totalOrders),
    totalSpend: toCount(d.totalSpend),
    totalRevenue: toCount(d.totalRevenue),
    totalSales: toCount(d.totalSales),
    organicSales: toCount(d.organicSales),
    organicContribution: toCount(d.organicContribution),
    roas: toNullableNumber(d.roas),
    roi: toNullableNumber(d.roi),
    ctr: toCount(d.ctr),
    cpc: toNullableNumber(d.cpc),
    conversionRate: toCount(d.conversionRate),
    profitAfterAds: toCount(d.profitAfterAds),
  }
}

function normalizeMergedGroupProduct(raw: unknown): MergedGroupProduct {
  const d = (raw ?? {}) as Record<string, unknown>
  return {
    nmId: Number(d.nmId ?? 0),
    vendorCode: toStr(d.vendorCode),
    imtId: d.imtId != null ? Number(d.imtId) : null,
    isMainProduct: Boolean(d.isMainProduct),
    totalViews: toCount(d.totalViews),
    totalClicks: toCount(d.totalClicks),
    totalOrders: toCount(d.totalOrders),
    totalSpend: toCount(d.totalSpend),
    totalRevenue: toCount(d.totalRevenue),
    totalSales: toCount(d.totalSales),
    organicSales: toCount(d.organicSales),
    organicContribution: toCount(d.organicContribution),
    roas: toNullableNumber(d.roas),
    roi: toNullableNumber(d.roi),
    ctr: toCount(d.ctr),
    cpc: toNullableNumber(d.cpc),
    conversionRate: toCount(d.conversionRate),
    profitAfterAds: toCount(d.profitAfterAds),
  }
}

function normalizeItem(item: unknown, index: number): AdvertisingGroupedItem {
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
    sku_id: d.sku_id != null ? String(d.sku_id) : d.nmId != null ? String(d.nmId) : undefined,
    // FE-16: campaign-GROUPED items expose the id as `advertId`; sku-grouped items may
    // reference a campaign via `campaignId`. Read advertId first (the campaign-listing case
    // that powers drill-through), fall back to campaignId. Reading only campaignId left
    // campaign_id undefined for campaign view → the drill-through Link never rendered.
    campaign_id:
      d.advertId != null
        ? Number(d.advertId)
        : d.campaignId != null
          ? Number(d.campaignId)
          : undefined,
    product_name: toStr(d.label) || toStr(d.product_name) || undefined,
    brand: toStr(d.brand) || undefined,
    category: toStr(d.category) || undefined,
    views: toCount(d.views),
    clicks: toCount(d.clicks),
    orders: toCount(d.orders),
    spend: toCount(d.spend),
    total_sales: toCount(d.totalSales),
    revenue: toNullableNumber(d.revenue),
    profit: toNullableNumber(d.profit),
    organic_sales: toCount(d.organicSales),
    organic_contribution: toCount(d.organicContribution),
    roas: toNullableNumber(d.roas),
    roi: toNullableNumber(d.roi),
    // iter-130: rates/derived-money preserve null (NOT toNum's 0) — renderValue already renders
    // these as "—" for null (perf-table-columns lines 23/29), but toNum was defeating that guard
    // by coercing to 0 at the boundary (false "0 %"/"0 ₽"). Matches sibling revenue/profit/roas/roi.
    ctr: toNullableNumber(d.ctr),
    cpc: toNullableNumber(d.cpc),
    conversion_rate: toNullableNumber(d.conversionRate),
    profit_after_ads: toNullableNumber(d.profitAfterAds),
    efficiency_status: toEfficiencyStatus(eff.status),
    mainProduct: normalizeMainProduct(d.mainProduct),
    productCount: d.productCount != null ? Number(d.productCount) : undefined,
    aggregateMetrics: normalizeAggregateMetrics(d.aggregateMetrics),
    products: Array.isArray(d.products) ? d.products.map(normalizeMergedGroupProduct) : undefined,
  }
}

function normalizeDaily(day: unknown): AdvertisingDailyItem {
  const d = (day ?? {}) as Record<string, unknown>
  const spend = toCount(d.spend)
  const revenueAttributed = toNullableNumber(d.revenueAttributed)
  // Compute ROAS: revenue_attributed / spend; null when spend is 0 or revenue missing
  const roas = spend > 0 && revenueAttributed != null ? revenueAttributed / spend : null
  return {
    date: toStr(d.date),
    spend,
    views: toCount(d.views),
    clicks: toCount(d.clicks),
    orders: toCount(d.orders),
    ctr: toNullableNumber(d.ctr) ?? undefined,
    cpc: toNullableNumber(d.cpc) ?? undefined,
    revenue_attributed: revenueAttributed ?? undefined,
    roas,
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
