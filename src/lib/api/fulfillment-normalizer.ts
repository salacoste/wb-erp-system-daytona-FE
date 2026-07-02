/**
 * Fulfillment Boundary Normalizer
 *
 * Normalizes responses from fulfillment endpoints:
 * - GET /v1/analytics/fulfillment/summary
 * - GET /v1/analytics/fulfillment/trends
 * - GET /v1/analytics/fulfillment/sync-status
 * - GET /v1/analytics/fulfillment/products
 */

import { asRecord, toCount, toNullableNumber, toStr, toOptionalString } from './normalizer-helpers'
import type {
  FulfillmentSummaryResponse,
  FulfillmentTrendsResponse,
  FulfillmentSyncStatusResponse,
  FulfillmentProductsResponse,
  FulfillmentMetrics,
  FulfillmentTotal,
  FulfillmentDayMetrics,
  FulfillmentTrendItem,
  SyncDataInfo,
  AggregationStatus,
  FulfillmentProductItem,
  FulfillmentProductMetrics,
} from '@/types/fulfillment'

// --- Scalar normalizers ---

function normalizeFulfillmentMetrics(raw: unknown): FulfillmentMetrics {
  const r = asRecord(raw)
  // AP#8: money/ratio fields preserve null (render '—'); counts use toCount.
  return {
    ordersCount: toCount(r.ordersCount),
    ordersRevenue: toNullableNumber(r.ordersRevenue),
    ordersRevenueDiscounted: toNullableNumber(r.ordersRevenueDiscounted),
    salesCount: toCount(r.salesCount),
    salesRevenue: toNullableNumber(r.salesRevenue),
    forPayTotal: toNullableNumber(r.forPayTotal),
    returnsCount: toCount(r.returnsCount),
    returnsRevenue: toNullableNumber(r.returnsRevenue),
    returnRate: toNullableNumber(r.returnRate),
    avgOrderValue: toNullableNumber(r.avgOrderValue),
  }
}

function normalizeFulfillmentTotal(raw: unknown): FulfillmentTotal {
  const r = asRecord(raw)
  // AP#8: money/share fields preserve null (render '—'); counts use toCount.
  return {
    ordersCount: toCount(r.ordersCount),
    ordersRevenue: toNullableNumber(r.ordersRevenue),
    ordersRevenueDiscounted: toNullableNumber(r.ordersRevenueDiscounted),
    fboShare: toNullableNumber(r.fboShare),
    fbsShare: toNullableNumber(r.fbsShare),
  }
}

function normalizeDayMetrics(raw: unknown): FulfillmentDayMetrics {
  const r = asRecord(raw)
  // AP#8: money fields preserve null (render '—'); counts use toCount.
  return {
    ordersCount: toCount(r.ordersCount),
    ordersRevenue: toNullableNumber(r.ordersRevenue),
    salesRevenue: toNullableNumber(r.salesRevenue),
    returnsCount: toCount(r.returnsCount),
  }
}

function normalizeTrendItem(raw: unknown): FulfillmentTrendItem {
  const r = asRecord(raw)
  return {
    date: toStr(r.date),
    fbo: normalizeDayMetrics(r.fbo),
    fbs: normalizeDayMetrics(r.fbs),
  }
}

function normalizeSyncDataInfo(raw: unknown): SyncDataInfo | null {
  if (raw == null) return null
  const r = asRecord(raw)
  const dr = asRecord(r.dateRange)
  return {
    lastSyncAt: toStr(r.lastSyncAt),
    recordsCount: toCount(r.recordsCount),
    dateRange: { from: toStr(dr.from), to: toStr(dr.to) },
  }
}

function normalizeProductMetrics(raw: unknown): FulfillmentProductMetrics {
  const r = asRecord(raw)
  return {
    ordersCount: toCount(r.ordersCount),
    salesRevenue: toNullableNumber(r.salesRevenue),
    returnsCount: toCount(r.returnsCount),
    returnRate: toNullableNumber(r.returnRate),
  }
}

function normalizeProductItem(raw: unknown): FulfillmentProductItem {
  const r = asRecord(raw)
  return {
    nmId: toCount(r.nmId),
    supplierArticle: toStr(r.supplierArticle),
    category: toStr(r.category),
    brand: toStr(r.brand),
    fbo: normalizeProductMetrics(r.fbo),
    fbs: normalizeProductMetrics(r.fbs),
    recommendation: toOptionalString(r.recommendation),
  }
}

// --- Response normalizers ---

export function normalizeFulfillmentSummaryResponse(raw: unknown): FulfillmentSummaryResponse {
  const r = asRecord(raw)
  const s = asRecord(r.summary)
  const p = asRecord(r.period)
  return {
    summary: {
      fbo: normalizeFulfillmentMetrics(s.fbo),
      fbs: normalizeFulfillmentMetrics(s.fbs),
      total: normalizeFulfillmentTotal(s.total),
    },
    period: { from: toStr(p.from), to: toStr(p.to) },
  }
}

export function normalizeFulfillmentTrendsResponse(raw: unknown): FulfillmentTrendsResponse {
  const r = asRecord(raw)
  const p = asRecord(r.period)
  const trends = Array.isArray(r.trends) ? r.trends : []
  return {
    trends: trends.map(normalizeTrendItem),
    period: {
      from: toStr(p.from),
      to: toStr(p.to),
      daysIncluded: toCount(p.daysIncluded),
    },
  }
}

export function normalizeFulfillmentSyncStatusResponse(
  raw: unknown
): FulfillmentSyncStatusResponse {
  const r = asRecord(raw)
  const agg = asRecord(r.aggregation)
  const aggStatus = toStr(agg.status) as AggregationStatus
  return {
    orders: normalizeSyncDataInfo(r.orders),
    sales: normalizeSyncDataInfo(r.sales),
    aggregation:
      r.aggregation == null ? null : { lastRunAt: toStr(agg.lastRunAt), status: aggStatus },
    isDataAvailable: Boolean(r.isDataAvailable),
  }
}

export function normalizeFulfillmentProductsResponse(raw: unknown): FulfillmentProductsResponse {
  const r = asRecord(raw)
  const p = asRecord(r.period)
  const products = Array.isArray(r.products) ? r.products : []
  return {
    products: products.map(normalizeProductItem),
    total: toCount(r.total),
    period: { from: toStr(p.from), to: toStr(p.to) },
  }
}
