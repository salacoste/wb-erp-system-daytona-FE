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
    total_amount: toCount(d.revenue),
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
    wb_sales_gross: toCount(d.revenueGross ?? d.revenue_gross),
    revenue_net: toCount(d.revenueNet ?? d.revenue_net),
    cogs_total: toNullableNumber(d.cogsTotal ?? d.cogs_total),
    logistics_cost: toCount(d.logistics ?? d.logistics_cost),
    storage_cost: toCount(d.storage ?? d.storage_cost),
    penalties: toCount(d.penalties),
    paid_acceptance: toCount(d.paidAcceptance ?? d.paid_acceptance),
    commission: toCount(d.commission),
    returns: toCount(d.returns),
    returns_count: toCount(d.returnsCount ?? d.returns_count),
    sales_count: toCount(d.salesCount ?? d.sales_count),
    advertising_spend: toCount(d.advertisingSpend ?? d.advertising_spend),
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
    total_spend: toCount(d.spend ?? d.total_spend),
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
