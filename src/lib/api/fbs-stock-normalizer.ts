/**
 * FBS Stock Breakdowns — Boundary Normalizer — Epic 96-FE Story 96.11-FE
 *
 * Normalizes raw backend responses from the 3 FBS stock endpoints into the
 * frontend-canonical shape defined in src/types/fbs-stock.ts.
 *
 * Responsibilities:
 *   - snake_case → camelCase via dual-lookup on every field (per Story 88.4 pattern).
 *   - Null-vs-zero: money/ratio fields preserved as null; count fields coerced to 0.
 *   - NaN guard on all numeric conversions via Number.isFinite.
 *   - String coercion to '' on missing values (prevents runtime crashes).
 *
 * Helpers are private (not exported) — inline re-implementation acceptable per
 * acquiring-normalizer.ts precedent ("3-helper set this small, skip cross-file extraction").
 *
 * @see src/types/fbs-stock.ts
 * @see CLAUDE.md § Boundary Normalizer Pattern
 * @see CLAUDE.md anti-pattern #8 (null-vs-zero)
 * @see docs/request-backend/169-BACKEND-UPDATE-EPICS-101-106.md § 1.2
 */

import type {
  FbsStockGroupItem,
  FbsStockSizeItem,
  FbsStockRegionItem,
  FbsStockGroupsResponse,
  FbsStockSizesResponse,
  FbsStockRegionsResponse,
  FbsStockPeriod,
} from '@/types/fbs-stock'

// ---------------------------------------------------------------------------
// Private scalar helpers
// ---------------------------------------------------------------------------

/** Converts to number | null. Rejects null, undefined, and NaN via Number.isFinite. */
function toNumberOrNull(raw: unknown): number | null {
  if (raw == null) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

/** Converts to number (count / ID). Returns 0 on missing or non-finite input. */
function toCount(raw: unknown): number {
  const n = Number(raw ?? 0)
  return Number.isFinite(n) ? n : 0
}

/** Returns '' for null/undefined. Named to avoid collision with other normalizer helpers. */
function toStr(raw: unknown): string {
  return raw == null ? '' : String(raw)
}

// ---------------------------------------------------------------------------
// Private period normalizer
// ---------------------------------------------------------------------------

function normalizePeriod(raw: unknown): FbsStockPeriod {
  const p = (raw ?? {}) as Record<string, unknown>
  return {
    from: toStr(p.from),
    to: toStr(p.to),
  }
}

// ---------------------------------------------------------------------------
// Private item normalizers
// ---------------------------------------------------------------------------

/**
 * Normalizes one FbsStockGroupItem row.
 * Dual-lookup on every field absorbs camelCase/snake_case backend drift.
 */
function normalizeGroupItem(raw: unknown): FbsStockGroupItem {
  const d = (raw ?? {}) as Record<string, unknown>
  return {
    groupName: toStr(d.groupName ?? d.group_name),
    skuCount: toCount(d.skuCount ?? d.sku_count),
    stockUnits: toCount(d.stockUnits ?? d.stock_units),
    stockValue: toNumberOrNull(d.stockValue ?? d.stock_value),
    averageDailyOutgoing: toCount(d.averageDailyOutgoing ?? d.average_daily_outgoing),
    daysOfCover: toNumberOrNull(d.daysOfCover ?? d.days_of_cover),
  }
}

/**
 * Normalizes one FbsStockSizeItem row.
 * Dual-lookup on every field absorbs camelCase/snake_case backend drift.
 */
function normalizeSizeItem(raw: unknown): FbsStockSizeItem {
  const d = (raw ?? {}) as Record<string, unknown>
  return {
    size: toStr(d.size),
    nmId: toCount(d.nmId ?? d.nm_id),
    skuCount: toCount(d.skuCount ?? d.sku_count),
    stockUnits: toCount(d.stockUnits ?? d.stock_units),
    averageDailyOutgoing: toCount(d.averageDailyOutgoing ?? d.average_daily_outgoing),
    daysOfCover: toNumberOrNull(d.daysOfCover ?? d.days_of_cover),
  }
}

/**
 * Normalizes one FbsStockRegionItem row.
 * Dual-lookup on every field absorbs camelCase/snake_case backend drift.
 */
function normalizeRegionItem(raw: unknown): FbsStockRegionItem {
  const d = (raw ?? {}) as Record<string, unknown>
  return {
    regionName: toStr(d.regionName ?? d.region_name),
    warehouseCount: toCount(d.warehouseCount ?? d.warehouse_count),
    stockUnits: toCount(d.stockUnits ?? d.stock_units),
    stockValue: toNumberOrNull(d.stockValue ?? d.stock_value),
    shareOfTotalPct: toNumberOrNull(d.shareOfTotalPct ?? d.share_of_total_pct),
  }
}

// ---------------------------------------------------------------------------
// Exported normalizers
// ---------------------------------------------------------------------------

/**
 * Normalizes the full groups-endpoint envelope.
 * Input: raw `{ data: { groups: [...] }, period, generatedAt }` from apiClient (skipDataUnwrap: true).
 */
export function normalizeFbsStockGroupsResponse(raw: unknown): FbsStockGroupsResponse {
  const r = (raw ?? {}) as Record<string, unknown>
  const data = (r.data ?? {}) as Record<string, unknown>
  const groupsRaw = Array.isArray(data.groups) ? data.groups : []
  return {
    data: { groups: groupsRaw.map(normalizeGroupItem) },
    period: normalizePeriod(r.period),
    generatedAt: toStr(r.generatedAt ?? r.generated_at),
  }
}

/**
 * Normalizes the full sizes-endpoint envelope.
 * Input: raw `{ data: { sizes: [...] }, period, generatedAt }` from apiClient (skipDataUnwrap: true).
 */
export function normalizeFbsStockSizesResponse(raw: unknown): FbsStockSizesResponse {
  const r = (raw ?? {}) as Record<string, unknown>
  const data = (r.data ?? {}) as Record<string, unknown>
  const sizesRaw = Array.isArray(data.sizes) ? data.sizes : []
  return {
    data: { sizes: sizesRaw.map(normalizeSizeItem) },
    period: normalizePeriod(r.period),
    generatedAt: toStr(r.generatedAt ?? r.generated_at),
  }
}

/**
 * Normalizes the full regions-endpoint envelope.
 * Input: raw `{ data: { regions: [...] }, generatedAt }` from apiClient (skipDataUnwrap: true).
 * Note: no `period` field — regions endpoint uses latest-snapshot semantics.
 */
export function normalizeFbsStockRegionsResponse(raw: unknown): FbsStockRegionsResponse {
  const r = (raw ?? {}) as Record<string, unknown>
  const data = (r.data ?? {}) as Record<string, unknown>
  const regionsRaw = Array.isArray(data.regions) ? data.regions : []
  return {
    data: { regions: regionsRaw.map(normalizeRegionItem) },
    generatedAt: toStr(r.generatedAt ?? r.generated_at),
  }
}
