/**
 * Funnel Analytics Boundary Normalizer — Epic 119-FE retro A-3
 * (deferred from Story 119.2-FE 1st-pass F-10).
 *
 * Absorbs backend shape drift for GET /v1/analytics/funnel and
 * /v1/analytics/funnel/sync-status. Raw backend shapes never reach the hook or
 * components (Boundary Normalizer Pattern — CLAUDE-PATTERNS.md). Structural twin
 * of src/lib/api/search-analytics-normalizer.ts (Story 119.1-FE).
 *
 * AP#8 disposition (DIFFERS from 119.1 — read before "fixing"): funnel numerics
 * are SEMANTIC-ZERO, NOT nullable-unknown. Per src/test/fixtures/funnel-empty.ts
 * (Story 119.2-FE Pass-2 P2-6), an empty period has 0% conversion / 0 ₽ sums
 * "by construction" — 0 is the correct known value, distinct from the
 * unknown/null/em-dash class that 119.1's `searchOrderShare` belongs to. So all
 * funnel counts, sums, AND ratios coerce to 0 via `toNum`; there is no
 * `toNullableNumber` here on purpose. If the backend contract ever introduces a
 * genuinely-unknown ratio, split it out per the 119.1 toNullableNumber pattern.
 *
 * Discriminated union: items are FunnelProductItem OR FunnelDayItem. The
 * response does NOT carry groupBy, so `normalizeFunnelResponse` takes the
 * request's `groupBy` and routes the WHOLE (homogeneous) array by request
 * intent — NOT by per-item `date`-sniffing. Sniffing was rejected in 1st-pass
 * review: a degraded day row missing `date`, or a product row carrying a stray
 * `date`, would be mis-routed and silently lose its fields.
 *
 * Numeric coercion (`toNum`) is the 119.1 `toCount` twin: booleans/arrays are
 * coerced numerically (`Number(true)===1`), NOT rejected — deliberate template
 * parity, not a robustness guarantee against type-confusion drift.
 *
 * Contract-doc note: docs/request-backend/151-*.md documents stale summary/item
 * keys (e.g. `totalOpenCards`, `avgTotalConversion`). The FE-canonical keys read
 * here are authoritative — the pre-normalizer production code consumed them via
 * type-assertion successfully, proving the live backend matches the FE type.
 */

import type {
  FunnelDayItem,
  FunnelProductItem,
  FunnelResponse,
  FunnelResponseMeta,
  FunnelSummary,
  FunnelSyncStatus,
  TopSearchQuery,
} from '@/types/analytics-funnel'
import { asRecord, toCount, toOptionalString } from '@/lib/api/normalizer-helpers'

// The 10 metric fields shared by product and day items.
function normalizeSharedMetrics(r: Record<string, unknown>) {
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
  // Product-unique fields here; the 10 shared count/ratio fields come from the spread.
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

function normalizeFunnelSummary(raw: unknown): FunnelSummary {
  const r = asRecord(raw)
  return {
    ordersSumRub: toCount(r.ordersSumRub),
    buyoutSumRub: toCount(r.buyoutSumRub),
    cancelSumRub: toCount(r.cancelSumRub),
    ...normalizeSharedMetrics(r),
  }
}

/**
 * normalizeFunnelMeta — Epic 114.5. The `meta` field is optional on the backend
 * contract (absent on older/cached responses), so return undefined when raw.meta
 * is missing or not an object — callers then OMIT the key (preserve optional-property
 * semantics). When present, coerce defensively: booleans via strict `=== true`,
 * source labels + period strings via toOptionalString (fallback '' to keep the
 * required string shape), lastSyncAt as genuinely-nullable string.
 */
function normalizeFunnelMeta(raw: unknown): FunnelResponseMeta | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const m = asRecord(raw)
  const dataSource = asRecord(m.dataSource)
  const syncedPeriod = asRecord(m.syncedPeriod)
  return {
    totalConversionApproximate: m.totalConversionApproximate === true,
    dataSource: {
      funnel: toOptionalString(dataSource.funnel) ?? '',
      buyout: toOptionalString(dataSource.buyout) ?? '',
    },
    syncedPeriod: {
      from: toOptionalString(syncedPeriod.from) ?? '',
      to: toOptionalString(syncedPeriod.to) ?? '',
      // genuinely nullable: preserve null (never synced); non-string → null.
      lastSyncAt: typeof syncedPeriod.lastSyncAt === 'string' ? syncedPeriod.lastSyncAt : null,
    },
  }
}

/**
 * @param groupBy request intent — routes the whole homogeneous items array.
 *   'day' → FunnelDayItem; 'product' (default) → FunnelProductItem.
 */
export function normalizeFunnelResponse(
  raw: unknown,
  groupBy: 'product' | 'day' = 'product'
): FunnelResponse {
  const r = asRecord(raw)
  const rawItems = Array.isArray(r.items) ? r.items : []
  // Explicit union return type: a bare ternary yields a union-of-functions type
  // that Array.map rejects (TS2345). Widening to the item union fixes the map.
  const normalizeItem: (raw: unknown) => FunnelProductItem | FunnelDayItem =
    groupBy === 'day' ? normalizeFunnelDayItem : normalizeFunnelProductItem
  const pagination = asRecord(r.pagination)
  const response: FunnelResponse = {
    items: rawItems.map(normalizeItem),
    summary: normalizeFunnelSummary(r.summary),
    pagination: {
      total: toCount(pagination.total),
      limit: toCount(pagination.limit),
      offset: toCount(pagination.offset),
      hasMore: pagination.hasMore === true,
    },
  }
  // Epic 114.5: omit meta entirely when absent (optional contract field).
  const meta = normalizeFunnelMeta(r.meta)
  if (meta !== undefined) response.meta = meta
  return response
}

export function normalizeFunnelSyncStatus(raw: unknown): FunnelSyncStatus {
  const r = asRecord(raw)
  return {
    // lastSyncAt is genuinely nullable (never synced) — preserve null, do NOT
    // coerce to '' (would render as a bogus empty timestamp). Non-string → null.
    lastSyncAt: typeof r.lastSyncAt === 'string' ? r.lastSyncAt : null,
    recordsCount: toCount(r.recordsCount),
    productsCount: toCount(r.productsCount),
  }
}
