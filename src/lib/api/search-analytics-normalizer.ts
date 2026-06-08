/**
 * Search Analytics Boundary Normalizers — Story 119.1-FE
 * Per-endpoint normalizers for search-by-product, search-by-query, search-orders.
 * Per-item normalizers extracted to ./search-analytics-item-normalizer.ts
 *
 * Defensive Frontend (CLAUDE-PATTERNS.md): searchOrderShare > 100 is PRESERVED, not clamped.
 * AP#8 split: counts via toCount, ratios via toNullableNumber.
 *
 * Canonical structural twin: src/lib/api/cabinet-normalizer.ts (Story 89.1-FE).
 */

import type {
  SearchByProductResponse,
  SearchByQueryResponse,
  SearchOrderItem,
  SearchOrdersGroupBy,
  SearchOrdersResponse,
} from '@/types/search-analytics'
import { toCount, toNullableNumber } from '@/lib/api/normalizer-helpers'
import {
  normalizeSearchQueryItem,
  normalizeSearchProductItem,
  normalizeSearchOrderItem,
} from './search-analytics-item-normalizer'

// Re-export per-item normalizers for direct consumer access
export {
  normalizeSearchQueryItem,
  normalizeSearchProductItem,
  normalizeSearchOrderItem,
} from './search-analytics-item-normalizer'

const VALID_GROUP_BY = new Set<SearchOrdersGroupBy>(['query', 'product', 'day'])

function toGroupBy(raw: unknown): SearchOrdersGroupBy {
  const s = String(raw ?? 'query') as SearchOrdersGroupBy
  return VALID_GROUP_BY.has(s) ? s : 'query'
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
      // Request #176 RESOLVED: >100% share is real. Preserve raw per Defensive Frontend.
      searchOrderShare: toNullableNumber(summary.searchOrderShare),
      searchOrderShareInflated: summary.searchOrderShareInflated === true,
      // Story 111.8: backend de-duplicates WB multi-attribution → sane ≤100% share.
      totalSearchOrdersDeduplicated: toCount(summary.totalSearchOrdersDeduplicated),
      searchOrderShareDeduplicated: toNullableNumber(summary.searchOrderShareDeduplicated),
      searchOrderShareDeduplicatedInflated: summary.searchOrderShareDeduplicatedInflated === true,
    },
  }
}
