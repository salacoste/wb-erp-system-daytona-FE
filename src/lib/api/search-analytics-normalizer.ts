/**
 * Search Analytics Boundary Normalizers — Story 119.1-FE
 * Closes Epic 117-FE retro § A-3 + Story 117.1-FE F-1 follow-up.
 * Absorbs backend shape drift for search-by-product, search-by-query, search-orders.
 *
 * Key-drift absorption (central reason this exists): SearchOrderItem.key may be
 * string | number | null | undefined at runtime. normalizeSearchOrderItem DROPS
 * items with key == null and COERCES numeric keys to string — unifying both
 * Story 117.1-FE `toChartRows` (coerce) and Story 117.4-FE `pickTopByOrders`
 * (filter) stances at the boundary. Boolean/object/array keys → drop.
 *
 * Type-narrowing decision (do NOT narrow SearchOrderItem.key string|number → string):
 * normalizer guarantees the runtime invariant; type stays declarative of source-of-
 * truth shape. Preserves consumer optionality + avoids breaking 117.1/117.4
 * signatures. Component-level defense-in-depth guards STAY in place — redundant
 * post-119.1 but survive if the boundary guard is ever bypassed.
 *
 * Defensive Frontend (CLAUDE-PATTERNS.md): searchOrderShare > 100 (observed
 * 394.23 per Story 117.2-FE, 176.38 live) is PRESERVED, not clamped. Request
 * #176 RESOLVED: the >100% share flag `searchOrderShareInflated` landed in
 * Story 111.6 AC8 (Problem B), the `key` string-shape contract in Story 111.7
 * (Problem A); both cross-link Request #175 which disclaims this scope (its
 * line 40). F-6 consumes the flag to render an Info indicator.
 *
 * AP#8 split (active rule, not forward-looking): Ratio/money fields preserve
 * null via `toNullableNumber`; counts use `?? 0` via `toCount` per the AP#8
 * counts exception. `searchOrderShare` is the first ratio field (widened to
 * `number | null` in Story 119.1-FE 1st-pass F-2); future schema additions
 * follow this split.
 *
 * Canonical structural twin: src/lib/api/cabinet-normalizer.ts (Story 89.1-FE).
 */

import type {
  SearchByProductResponse,
  SearchByQueryResponse,
  SearchOrderItem,
  SearchOrdersGroupBy,
  SearchOrdersResponse,
  SearchProductItem,
  SearchQueryItem,
} from '@/types/search-analytics'
import { toCount, toNullableNumber, toStringOrNull } from '@/lib/api/normalizer-helpers'

const VALID_GROUP_BY = new Set<SearchOrdersGroupBy>(['query', 'product', 'day'])

function toGroupBy(raw: unknown): SearchOrdersGroupBy {
  const s = String(raw ?? 'query') as SearchOrdersGroupBy
  return VALID_GROUP_BY.has(s) ? s : 'query'
}

// --- Per-item normalizers --------------------------------------------------

export function normalizeSearchQueryItem(raw: unknown): SearchQueryItem {
  const r = (raw ?? {}) as Record<string, unknown>
  return {
    searchQuery: String(r.searchQuery ?? ''),
    avgPosition: toCount(r.avgPosition),
    totalImpressions: toCount(r.totalImpressions),
    totalClicks: toCount(r.totalClicks),
    avgCtr: toNullableNumber(r.avgCtr), // rate → preserve null (NOT toCount's ?? 0), per the AP#8 split
    totalOrders: toCount(r.totalOrders),
  }
}

export function normalizeSearchProductItem(raw: unknown): SearchProductItem {
  const r = (raw ?? {}) as Record<string, unknown>
  // vendorCode canonicalized via toStringOrNull (Story 119.1-FE 1st-pass F-4):
  // undefined → null, null preserved (null-vs-zero rule), non-string → null
  // (Defensive Frontend — reject garbage rather than coerce to "[object Object]").
  return {
    nmId: toCount(r.nmId),
    vendorCode: toStringOrNull(r.vendorCode),
    avgPosition: toCount(r.avgPosition),
    totalImpressions: toCount(r.totalImpressions),
    totalClicks: toCount(r.totalClicks),
    avgCtr: toNullableNumber(r.avgCtr), // rate → preserve null (NOT toCount's ?? 0), per the AP#8 split
    totalOrders: toCount(r.totalOrders),
  }
}

/**
 * normalizeSearchOrderItem — returns null when the item is un-renderable.
 * The consumer (normalizeSearchOrdersResponse) filters nulls out of the array.
 *
 * Type returned uses `key: string | number` (declarative source-of-truth shape per
 * AC-7) but the runtime value is always a string post-normalize.
 */
export function normalizeSearchOrderItem(raw: unknown): SearchOrderItem | null {
  if (raw == null || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const k = r.key

  // Null/undefined → drop (Story 117.4-FE filter stance).
  if (k == null) return null

  // Coerce number → string (Story 117.1-FE coerce stance); pass string through.
  // Defensive: drop any other type (boolean, object, array, symbol, ...).
  let key: string
  if (typeof k === 'number') key = String(k)
  else if (typeof k === 'string') key = k
  else return null

  const item: SearchOrderItem = {
    key,
    totalOrders: toCount(r.totalOrders),
  }

  // Optional fields — preserve presence; canonicalize undefined → omit (NOT null)
  // so the optional-property semantics in the type stay intact for consumers.
  // Story 119.1-FE F-4: vendorCode rejects non-string via toStringOrNull.
  if (r.vendorCode !== undefined) {
    item.vendorCode = toStringOrNull(r.vendorCode)
  }
  if (r.uniqueProducts !== undefined) {
    item.uniqueProducts = toCount(r.uniqueProducts)
  }
  if (r.uniqueQueries !== undefined) {
    item.uniqueQueries = toCount(r.uniqueQueries)
  }
  return item
}

// --- Per-endpoint normalizers ---------------------------------------------

export function normalizeSearchByProductResponse(raw: unknown): SearchByProductResponse {
  const r = (raw ?? {}) as Record<string, unknown>
  const period = (r.period ?? {}) as Record<string, unknown>
  const queries = Array.isArray(r.queries) ? r.queries : []
  return {
    nmId: toCount(r.nmId),
    period: {
      from: String(period.from ?? ''),
      to: String(period.to ?? ''),
    },
    queries: queries.map(normalizeSearchQueryItem),
    totalQueries: toCount(r.totalQueries),
  }
}

export function normalizeSearchByQueryResponse(raw: unknown): SearchByQueryResponse {
  const r = (raw ?? {}) as Record<string, unknown>
  const period = (r.period ?? {}) as Record<string, unknown>
  const products = Array.isArray(r.products) ? r.products : []
  return {
    query: String(r.query ?? ''),
    period: {
      from: String(period.from ?? ''),
      to: String(period.to ?? ''),
    },
    products: products.map(normalizeSearchProductItem),
    totalProducts: toCount(r.totalProducts),
  }
}

export function normalizeSearchOrdersResponse(raw: unknown): SearchOrdersResponse {
  const r = (raw ?? {}) as Record<string, unknown>
  const period = (r.period ?? {}) as Record<string, unknown>
  const rawItems = Array.isArray(r.items) ? r.items : []
  // Filter out items that normalizeSearchOrderItem dropped (returned null).
  const items = rawItems
    .map(normalizeSearchOrderItem)
    .filter((it): it is SearchOrderItem => it !== null)
  const summary = (r.summary ?? {}) as Record<string, unknown>
  return {
    period: {
      from: String(period.from ?? ''),
      to: String(period.to ?? ''),
    },
    groupBy: toGroupBy(r.groupBy),
    items,
    summary: {
      totalSearchOrders: toCount(summary.totalSearchOrders),
      // Request #176 RESOLVED: >100% share is real (WB multi-attributes one order
      // across queries; observed 176.38/394.23). Preserve raw per Defensive
      // Frontend; AP#8 toNullableNumber (null→'—', 0=known zero).
      searchOrderShare: toNullableNumber(summary.searchOrderShare),
      // searchOrderShareInflated flag = Story 111.6 AC8 (Problem B). `=== true`
      // matches the funnel-normalizer hasMore boolean coercion (absent → false).
      // Preserved so the UI shows an Info indicator instead of silently misleading.
      searchOrderShareInflated: summary.searchOrderShareInflated === true,
      // Story 111.8: backend de-duplicates WB multi-attribution → a sane ≤100%
      // share. toNullableNumber leaves it null on older builds that omit the
      // field — the component uses null to fall back to the raw inflated value.
      totalSearchOrdersDeduplicated: toCount(summary.totalSearchOrdersDeduplicated),
      searchOrderShareDeduplicated: toNullableNumber(summary.searchOrderShareDeduplicated),
      searchOrderShareDeduplicatedInflated: summary.searchOrderShareDeduplicatedInflated === true,
    },
  }
}
