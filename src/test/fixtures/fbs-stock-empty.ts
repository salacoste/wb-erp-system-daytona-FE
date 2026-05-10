/**
 * Shared empty-fixture factories for FBS Stock breakdown tests.
 * Story 96.11-FE — Pattern 3 hygiene (CLAUDE.md § Multi-Source Orchestration).
 *
 * Mirrors the `monitor-empty.ts` precedent (Story 92.6-FE — first canonical
 * Pattern 3 module). Consumed by both unit tests and E2E helpers if needed.
 *
 * Convention: money/ratio fields use null per CLAUDE.md anti-pattern #8
 *   (null = "unknown / not yet calculated"; 0 ₽ would mislead).
 *   Count fields use 0 (legitimate zero — zero stock is meaningful).
 *   Dates/strings use empty string (matches normalizer fallback at
 *   `src/lib/api/fbs-stock-normalizer.ts` `toStr`).
 *
 * @see src/types/fbs-stock.ts
 * @see src/lib/api/fbs-stock-normalizer.ts
 * @see src/test/fixtures/monitor-empty.ts (Pattern 3 canonical — Story 92.6-FE)
 */

import type {
  FbsStockGroupsResponse,
  FbsStockSizesResponse,
  FbsStockRegionsResponse,
  FbsStockGroupItem,
  FbsStockSizeItem,
  FbsStockRegionItem,
} from '@/types/fbs-stock'

// ---------------------------------------------------------------------------
// Response-level factories (empty envelopes)
// ---------------------------------------------------------------------------

/**
 * Empty groups response — `data.groups: []`.
 * Triggers the "Нет данных по товарным группам" empty-state in FbsStockGroupsSection.
 */
export function emptyFbsStockGroupsResponse(): FbsStockGroupsResponse {
  return {
    data: { groups: [] },
    period: { from: '', to: '' },
    generatedAt: '',
  }
}

/**
 * Empty sizes response — `data.sizes: []`.
 * Triggers the "Нет данных по размерам" empty-state in FbsStockSizesSection.
 */
export function emptyFbsStockSizesResponse(): FbsStockSizesResponse {
  return {
    data: { sizes: [] },
    period: { from: '', to: '' },
    generatedAt: '',
  }
}

/**
 * Empty regions response — `data.regions: []`.
 * Triggers the "Нет данных по регионам" empty-state in FbsStockRegionsSection.
 * Note: no `period` field — regions endpoint is latest-snapshot only.
 */
export function emptyFbsStockRegionsResponse(): FbsStockRegionsResponse {
  return {
    data: { regions: [] },
    generatedAt: '',
  }
}

// ---------------------------------------------------------------------------
// Per-row item factories (edge-case testing)
// ---------------------------------------------------------------------------

/**
 * Single empty group item — money/ratio = null, counts = 0, string = ''.
 * Useful for testing null-rendering (stockValue → '—', daysOfCover → '—').
 */
export function emptyFbsStockGroupItem(): FbsStockGroupItem {
  return {
    groupName: '',
    skuCount: 0,
    stockUnits: 0,
    stockValue: null,
    averageDailyOutgoing: 0,
    daysOfCover: null,
  }
}

/**
 * Single empty size item — ratio = null, counts = 0, strings = ''.
 * Useful for testing null-rendering (daysOfCover → '—').
 */
export function emptyFbsStockSizeItem(): FbsStockSizeItem {
  return {
    size: '',
    nmId: 0,
    skuCount: 0,
    stockUnits: 0,
    averageDailyOutgoing: 0,
    daysOfCover: null,
  }
}

/**
 * Single empty region item — money/ratio = null, counts = 0, string = ''.
 * Useful for testing null-rendering (stockValue → '—', shareOfTotalPct → '—').
 */
export function emptyFbsStockRegionItem(): FbsStockRegionItem {
  return {
    regionName: '',
    warehouseCount: 0,
    stockUnits: 0,
    stockValue: null,
    shareOfTotalPct: null, // ratio — null per CLAUDE.md anti-pattern #8
  }
}
