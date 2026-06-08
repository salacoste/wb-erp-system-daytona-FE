/**
 * Funnel Analytics Per-Item Normalizers — extracted from funnel-normalizer.ts
 *
 * Individual item normalizers for funnel product items, day items, and top search queries.
 * Shared metrics helper for the 10 metric fields common to product and day items.
 *
 * AP#8: funnel numerics are SEMANTIC-ZERO (toCount), NOT nullable-unknown.
 * See funnel-normalizer.ts header for the full rationale.
 */

import type { FunnelDayItem, FunnelProductItem, TopSearchQuery } from '@/types/analytics-funnel'
import { asRecord, toCount, toOptionalString } from '@/lib/api/normalizer-helpers'

// The 10 metric fields shared by product and day items.
export function normalizeSharedMetrics(r: Record<string, unknown>) {
  return {
    openCardCount: toCount(r.openCardCount),
    addToCartCount: toCount(r.addToCartCount),
    ordersCount: toCount(r.ordersCount),
    buyoutCount: toCount(r.buyoutCount),
    cancelCount: toCount(r.cancelCount),
    cartConversion: toCount(r.cartConversion),
    orderConversion: toCount(r.orderConversion),
    buyoutConversion: toCount(r.buyoutConversion),
    cancelRate: toCount(r.cancelRate),
    totalConversion: toCount(r.totalConversion),
  }
}

/**
 * normalizeTopSearchQuery — returns null when the entry is un-renderable.
 * A valid entry requires a non-empty `query` string (matches the
 * filterValidQueries guard in funnel-table-columns.tsx, Story 119.2-FE).
 */
export function normalizeTopSearchQuery(raw: unknown): TopSearchQuery | null {
  const r = asRecord(raw)
  if (typeof r.query !== 'string' || r.query.trim() === '') return null
  return {
    query: r.query,
    impressions: toCount(r.impressions),
    clicks: toCount(r.clicks),
    orders: toCount(r.orders),
  }
}

export function normalizeFunnelProductItem(raw: unknown): FunnelProductItem {
  const r = asRecord(raw)
  const item: FunnelProductItem = {
    nmId: toCount(r.nmId),
    ordersSumRub: toCount(r.ordersSumRub),
    buyoutSumRub: toCount(r.buyoutSumRub),
    cancelSumRub: toCount(r.cancelSumRub),
    ...normalizeSharedMetrics(r),
  }
  const vendorCode = toOptionalString(r.vendorCode)
  if (vendorCode !== undefined) item.vendorCode = vendorCode
  const brandName = toOptionalString(r.brandName)
  if (brandName !== undefined) item.brandName = brandName
  // topSearchQueries (Story 119.2-FE): drop invalid entries; omit field when absent.
  if (Array.isArray(r.topSearchQueries)) {
    item.topSearchQueries = r.topSearchQueries
      .map(normalizeTopSearchQuery)
      .filter((q): q is TopSearchQuery => q !== null)
  }
  return item
}

export function normalizeFunnelDayItem(raw: unknown): FunnelDayItem {
  const r = asRecord(raw)
  return {
    // Defensive Frontend: reject non-string date (never String()-coerce a number
    // into a fake date); empty string signals "no date" to the consumer.
    date: typeof r.date === 'string' ? r.date : '',
    ...normalizeSharedMetrics(r),
  }
}
