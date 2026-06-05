/**
 * Daily Analytics — Boundary Normalizer
 *
 * Normalizes raw backend responses from 4 daily-analytics endpoints into
 * frontend-canonical shapes. Uses normalizer-helpers for safe coercion.
 *
 * Endpoints:
 *   1. GET /v1/analytics/orders/trends (orders daily)
 *   2. GET /v1/analytics/daily/finance  (finance daily)
 *   3. GET /v1/analytics/daily/advertising (advertising daily)
 *   4. GET /v1/analytics/orders/volume?include_cogs=true (orders COGS daily)
 *
 * @see CLAUDE.md § Boundary Normalizer Pattern
 */

import { asRecord, toCount, toNullableNumber, toStr } from '../normalizer-helpers'
import type {
  OrdersDailyData,
  FinanceDailyData,
  AdvertisingDailyData,
  OrdersCogsDailyData,
} from '@/types/daily-metrics'

// ---------------------------------------------------------------------------
// Orders Trends (GET /v1/analytics/orders/trends?aggregation=day)
// ---------------------------------------------------------------------------

function normalizeOrdersTrendItem(raw: unknown): OrdersDailyData {
  const d = asRecord(raw)
  return {
    date: toStr(d.date),
    total_amount: toNullableNumber(d.revenue) ?? 0,
    total_orders: toCount(d.ordersCount),
  }
}

/**
 * Normalizes the orders/trends response into OrdersDailyData[].
 * Input: raw `{ trends: [...] }` envelope or bare array.
 */
export function normalizeOrdersTrendsResponse(raw: unknown): OrdersDailyData[] {
  const r = asRecord(raw)
  const trends = Array.isArray(r.trends) ? r.trends : Array.isArray(raw) ? raw : []
  return trends.map(normalizeOrdersTrendItem)
}

// ---------------------------------------------------------------------------
// Finance Daily (GET /v1/analytics/daily/finance)
// ---------------------------------------------------------------------------

function normalizeFinanceDailyItem(raw: unknown): FinanceDailyData {
  const d = asRecord(raw)
  return {
    date: toStr(d.date),
    // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: wb_sales_gross 0 = partial day
    wb_sales_gross: toNullableNumber(d.revenueGross ?? d.revenue_gross) ?? 0,
    // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: revenue_net 0 = partial day
    revenue_net: toNullableNumber(d.revenueNet ?? d.revenue_net) ?? 0,
    cogs_total: toNullableNumber(d.cogsTotal ?? d.cogs_total),
    // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: logistics 0 = no logistics
    logistics_cost: toNullableNumber(d.logistics ?? d.logistics_cost) ?? 0,
    // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: storage 0 = no storage
    storage_cost: toNullableNumber(d.storage ?? d.storage_cost) ?? 0,
    // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: penalties 0 = no penalties
    penalties: toNullableNumber(d.penalties) ?? 0,
    // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: paid_acceptance 0 = none
    paid_acceptance: toNullableNumber(d.paidAcceptance ?? d.paid_acceptance) ?? 0,
    // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: commission 0 = no commission
    commission: toNullableNumber(d.commission) ?? 0,
    // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: returns amount 0 = no returns
    returns: toNullableNumber(d.returns) ?? 0,
    returns_count: toCount(d.returnsCount ?? d.returns_count),
    sales_count: toCount(d.salesCount ?? d.sales_count),
    // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: ad spend 0 = no ads
    advertising_spend: toNullableNumber(d.advertisingSpend ?? d.advertising_spend) ?? 0,
    net_profit: toNullableNumber(d.netProfit ?? d.net_profit),
  }
}

/**
 * Normalizes finance-daily response (bare array) into FinanceDailyData[].
 */
export function normalizeFinanceDailyResponse(raw: unknown): FinanceDailyData[] {
  if (!Array.isArray(raw)) return []
  return raw.map(normalizeFinanceDailyItem)
}

// ---------------------------------------------------------------------------
// Advertising Daily (GET /v1/analytics/daily/advertising)
// ---------------------------------------------------------------------------

function normalizeAdvertisingDailyItem(raw: unknown): AdvertisingDailyData {
  const d = asRecord(raw)
  return {
    date: toStr(d.date),
    // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: spend 0 = no ads
    total_spend: toNullableNumber(d.spend ?? d.total_spend) ?? 0,
    views: toCount(d.views),
    clicks: toCount(d.clicks),
    ctr: toNullableNumber(d.ctr),
    cpc: toNullableNumber(d.cpc),
    orders: toCount(d.orders),
    revenue: toNullableNumber(d.revenue),
    roas: toNullableNumber(d.roas),
  }
}

/**
 * Normalizes advertising-daily response (bare array) into AdvertisingDailyData[].
 */
export function normalizeAdvertisingDailyResponse(raw: unknown): AdvertisingDailyData[] {
  if (!Array.isArray(raw)) return []
  return raw.map(normalizeAdvertisingDailyItem)
}

// ---------------------------------------------------------------------------
// Orders Volume COGS (GET /v1/analytics/orders/volume?include_cogs=true)
// ---------------------------------------------------------------------------

function normalizeOrdersCogsDayItem(raw: unknown): OrdersCogsDailyData {
  const d = asRecord(raw)
  return {
    date: toStr(d.date),
    cogs: toNullableNumber(d.cogs),
  }
}

/**
 * Normalizes orders/volume COGS response into OrdersCogsDailyData[].
 * Input: raw `{ by_day_with_cogs: [...] }` envelope.
 */
export function normalizeOrdersCogsResponse(raw: unknown): OrdersCogsDailyData[] {
  const r = asRecord(raw)
  const items = Array.isArray(r.by_day_with_cogs) ? r.by_day_with_cogs : []
  return items.map(normalizeOrdersCogsDayItem)
}
