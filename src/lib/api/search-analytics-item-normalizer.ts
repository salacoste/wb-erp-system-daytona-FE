/**
 * Search Analytics Per-Item Normalizers — extracted from search-analytics-normalizer.ts
 *
 * Individual item normalizers for search-by-query, search-by-product, and search-order items.
 * Key-drift absorption: SearchOrderItem.key may be string | number | null | undefined at runtime.
 * normalizeSearchOrderItem DROPS items with key == null and COERCES numeric keys to string.
 *
 * AP#8 split: Ratio/money fields preserve null via `toNullableNumber`; counts use `?? 0` via `toCount`.
 */

import type { SearchOrderItem, SearchProductItem, SearchQueryItem } from '@/types/search-analytics'
import { toCount, toNullableNumber, toStringOrNull } from '@/lib/api/normalizer-helpers'

export function normalizeSearchQueryItem(raw: unknown): SearchQueryItem {
  const r = (raw ?? {}) as Record<string, unknown>
  return {
    searchQuery: String(r.searchQuery ?? ''),
    avgPosition: toCount(r.avgPosition),
    totalImpressions: toCount(r.totalImpressions),
    totalClicks: toCount(r.totalClicks),
    avgCtr: toNullableNumber(r.avgCtr), // rate → preserve null (NOT toCount's ?? 0), per the AP#8 split
    totalOrders: toCount(r.totalOrders),
    // Request #178 (option-1): alias totalClicks under semantic name
    searchCartAdds: toCount(r.searchCartAdds),
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
    // Request #178 (option-1): alias totalClicks under semantic name
    searchCartAdds: toCount(r.searchCartAdds),
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
