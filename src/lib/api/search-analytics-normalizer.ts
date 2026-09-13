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
  SearchAnalyticsCoverage,
  SearchAnalyticsCoverageStatus,
  SearchByProductResponse,
  SearchByQueryResponse,
  SearchOrderItem,
  SearchOrdersGroupBy,
  SearchOrdersResponse,
} from '@/types/search-analytics'
import { asRecord, toCount, toNullableNumber, toStr } from '@/lib/api/normalizer-helpers'
import { normalizeSearchCoverage } from './search-coverage-normalizer'
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
  const period = asRecord(r.period)
  const normalizedPeriod = { from: toStr(period.from), to: toStr(period.to) }
  const rawItems = Array.isArray(r.items) ? r.items : []
  // Filter out items that normalizeSearchOrderItem dropped (returned null).
  const items = rawItems
    .map(normalizeSearchOrderItem)
    .filter((it): it is SearchOrderItem => it !== null)
  const summary = (r.summary ?? {}) as Record<string, unknown>
  return {
    period: normalizedPeriod,
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
      // Task-139.6: the orders summary carries the raw coverage partition (dates + counts)
      // but NOT the coverageKnown/status flags those exist only on the dashboard endpoint.
      // FE re-derives them from the partition itself and lets normalizeSearchCoverage
      // re-verify against the requested period: any inconsistency (non-contiguous dates,
      // count mismatch, foreign dates) fails closed to coverageKnown:false/status:'unknown'
      // instead of presenting an unverified range as authoritative.
      // KNOWN CONFLATION (do not "fix"): BE's fail-conservative shape encodes
      // metadata-absent identically to genuinely-uncovered (covered=0, missing=all), and
      // this derivation marks BOTH as coverageKnown=true/'uncovered' — the dashboard
      // endpoint labels metadata-absent as unknown instead. The orders surface cannot
      // distinguish them; claiming 'uncovered' matches every field BE emits.
      ...normalizeOrdersSummaryCoverage(summary, normalizedPeriod),
    },
  }
}

/**
 * Task-139.6 coverage derivation for the search-orders summary. The BE summary shape
 * (search-orders-query.service.ts) omits coverageKnown/status — FE derives the status
 * from the partition itself, then normalizeSearchCoverage validates the partition
 * (contiguity, counts, status agreement, exact period partition) and fails closed.
 */
function normalizeOrdersSummaryCoverage(
  summary: Record<string, unknown>,
  period: { from: string; to: string }
): SearchAnalyticsCoverage {
  const coverageComplete = summary.coverageComplete === true
  const status: SearchAnalyticsCoverageStatus = coverageComplete
    ? 'complete'
    : toCount(summary.coveredDayCount) > 0
      ? 'partial'
      : 'uncovered'
  return normalizeSearchCoverage(
    {
      coverageKnown: true,
      requestedDayCount: summary.requestedDayCount,
      coveredDayCount: summary.coveredDayCount,
      missingDayCount: summary.missingDayCount,
      coverageComplete: summary.coverageComplete,
      coveredDates: summary.coveredDates,
      missingDates: summary.missingDates,
      status,
    },
    period
  )
}
