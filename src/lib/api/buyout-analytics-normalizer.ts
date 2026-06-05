/**
 * Buyout Analytics — Boundary Normalizer
 *
 * Normalizes raw backend responses from buyout endpoints into the
 * frontend-canonical shapes defined in src/types/analytics-buyout.ts.
 *
 * AP#8 split: counts → toCount (0), rates/ratios → toNullableNumber (null).
 *
 * @see src/types/analytics-buyout.ts
 * @see CLAUDE.md § Boundary Normalizer Pattern
 */

import type {
  BySkuBuyoutItem,
  BySkuBuyoutResponse,
  BuyoutSummaryResponse,
  BuyoutSource,
  BuyoutConfidence,
  TrendDirection,
} from '@/types/analytics-buyout'

import {
  asRecord,
  toCount,
  toNullableNumber,
  toStr,
  toOptionalString,
} from '@/lib/api/normalizer-helpers'

// ---------------------------------------------------------------------------
// Enum coercion
// ---------------------------------------------------------------------------

const VALID_SOURCES: ReadonlySet<string> = new Set([
  'weekly',
  'realtime',
  'blended',
  'sdk_reconciliation',
  'unknown',
])
const VALID_CONFIDENCE: ReadonlySet<string> = new Set(['high', 'medium', 'low'])
const VALID_TRENDS: ReadonlySet<string> = new Set(['up', 'down', 'stable'])

function toBuyoutSource(raw: unknown): BuyoutSource {
  const s = String(raw ?? '')
  return VALID_SOURCES.has(s) ? (s as BuyoutSource) : 'unknown'
}

function toConfidence(raw: unknown): BuyoutConfidence {
  const s = String(raw ?? '')
  return VALID_CONFIDENCE.has(s) ? (s as BuyoutConfidence) : 'low'
}

function toTrend(raw: unknown): TrendDirection | undefined {
  const s = String(raw ?? '')
  return VALID_TRENDS.has(s) ? (s as TrendDirection) : undefined
}

// ---------------------------------------------------------------------------
// Item normalizers
// ---------------------------------------------------------------------------

function normalizeBySkuBuyoutItem(raw: unknown): BySkuBuyoutItem {
  const d = asRecord(raw)
  const rb = d.returnBreakdown ?? d.return_breakdown
  return {
    nmId: toCount(d.nmId ?? d.nm_id),
    supplierArticle: (typeof d.supplierArticle === 'string' ? d.supplierArticle : null) as
      | string
      | null,
    productName: (typeof d.productName === 'string' ? d.productName : null) as string | null,
    brand: (typeof d.brand === 'string' ? d.brand : null) as string | null,
    category: toOptionalString(d.category),
    salesCount: toCount(d.salesCount ?? d.sales_count),
    returnsCount: toCount(d.returnsCount ?? d.returns_count),
    buyoutRatePct: toNullableNumber(d.buyoutRatePct ?? d.buyout_rate_pct),
    returnRatePct: toNullableNumber(d.returnRatePct ?? d.return_rate_pct),
    source: toBuyoutSource(d.source),
    confidence: toConfidence(d.confidence),
    trend: toTrend(d.trend),
    trendDelta: toNullableNumber(d.trendDelta ?? d.trend_delta) ?? undefined,
    trendPeriod: toOptionalString(
      d.trendPeriod ?? d.trend_period
    ) as BySkuBuyoutItem['trendPeriod'],
    previousBuyoutRatePct: toNullableNumber(d.previousBuyoutRatePct ?? d.previous_buyout_rate_pct),
    returnBreakdown: rb ? normalizeReturnBreakdown(rb) : null,
  }
}

function normalizeReturnBreakdown(rb: unknown): BySkuBuyoutItem['returnBreakdown'] {
  const d = asRecord(rb)
  return {
    cancelBeforeShipment: toCount(d.cancelBeforeShipment ?? d.cancel_before_shipment),
    refusalAtPvz: toCount(d.refusalAtPvz ?? d.refusal_at_pvz),
    returnAfterReceipt: toCount(d.returnAfterReceipt ?? d.return_after_receipt),
    total: toCount(d.total),
    estimated: typeof d.estimated === 'boolean' ? d.estimated : undefined,
  }
}

interface TopDecliner {
  nmId: number
  buyoutRatePct: number | null
  trendDelta: number
}

function normalizeTopDecliner(raw: unknown): TopDecliner {
  const d = asRecord(raw)
  return {
    nmId: toCount(d.nmId ?? d.nm_id),
    buyoutRatePct: toNullableNumber(d.buyoutRatePct ?? d.buyout_rate_pct),
    trendDelta: toNullableNumber(d.trendDelta ?? d.trend_delta) ?? 0,
  }
}

// ---------------------------------------------------------------------------
// Exported normalizers
// ---------------------------------------------------------------------------

export function normalizeBySkuBuyoutResponse(raw: unknown): BySkuBuyoutResponse {
  const r = asRecord(raw)
  const dataRaw = Array.isArray(r.data) ? r.data : []
  const p = asRecord(r.pagination)
  return {
    data: dataRaw.map(normalizeBySkuBuyoutItem),
    pagination: {
      total: toCount(p.total),
      limit: toCount(p.limit),
      offset: toCount(p.offset),
      hasMore: typeof (p.hasMore ?? p.has_more) === 'boolean' ? !!(p.hasMore ?? p.has_more) : false,
    },
  }
}

export function normalizeBuyoutSummaryResponse(raw: unknown): BuyoutSummaryResponse {
  const r = asRecord(raw)
  const period = asRecord(r.period)
  const declinersRaw: unknown[] = Array.isArray(r.topDecliners ?? r.top_decliners)
    ? ((r.topDecliners ?? r.top_decliners) as unknown[])
    : []
  return {
    overallBuyoutRatePct: toNullableNumber(r.overallBuyoutRatePct ?? r.overall_buyout_rate_pct),
    overallReturnRatePct: toNullableNumber(r.overallReturnRatePct ?? r.overall_return_rate_pct),
    totalSalesCount: toCount(r.totalSalesCount ?? r.total_sales_count),
    totalReturnsCount: toCount(r.totalReturnsCount ?? r.total_returns_count),
    skuCount: toCount(r.skuCount ?? r.sku_count),
    topDecliners: declinersRaw.map(normalizeTopDecliner),
    period: {
      from: toStr(period.from),
      to: toStr(period.to),
    },
    source: toBuyoutSource(r.source),
    confidence: toConfidence(r.confidence),
  }
}
