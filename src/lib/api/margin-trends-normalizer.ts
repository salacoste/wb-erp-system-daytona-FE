/**
 * Margin Trends Boundary Normalizer — Validation F-30.
 *
 * GET /v1/analytics/weekly/margin-trends returns `{ data: MarginTrendPoint[] }`, but
 * `apiClient.get` auto-unwraps the `{ data }` envelope (api-client.ts: `rawData.data ??
 * rawData`), so at runtime the hook receives a bare `MarginTrendPoint[]`. The previous
 * inline `response.data || []` read `.data` on that already-unwrapped array → undefined
 * → empty chart in prod. Per the Boundary Normalizer Pattern (CLAUDE.md), the raw shape
 * is converted to the frontend-canonical type here, at the API layer — not inline in the
 * hook (which was the "conditional normalization" anti-pattern).
 *
 * Defensive to BOTH the unwrapped array (prod) and the `{ data: [...] }` wrapper.
 */

import type { MarginTrendPoint } from '@/types/api'

/** Coerce to a finite number; counts/guaranteed-denominator fields → 0 fallback. */
function toCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

/** Coerce to a finite number OR null — for money/ratio fields (anti-pattern #8: never `?? 0`). */
function toNullableMoney(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

/**
 * Normalize one raw point into the frontend-canonical MarginTrendPoint.
 * A fully-anomalous point (e.g. missing revenue_net) yields revenue_net:0; that is
 * tolerated because every chart consumer gates on `margin_pct !== null` before rendering
 * a value, so a 0 here never surfaces a false margin (it just shows 0 ₽ in the tooltip).
 */
export function normalizeMarginTrendPoint(raw: Record<string, unknown>): MarginTrendPoint {
  return {
    week: String(raw.week ?? ''),
    week_start_date: String(raw.week_start_date ?? ''),
    week_end_date: String(raw.week_end_date ?? ''),
    // Null-aware: null when all SKUs in the week are missing COGS (real backend semantic).
    margin_pct: toNullableMoney(raw.margin_pct),
    // revenue_net is the margin denominator (margin_pct = (revenue_net - cogs)/revenue_net),
    // so the backend always emits it even when cogs/margin are null — BACKEND-CONTRACT-NON-NULL.
    // The 0 fallback is therefore unreachable for valid responses, not a silent money-coerce.
    revenue_net: toCount(raw.revenue_net),
    cogs: toNullableMoney(raw.cogs),
    profit: toNullableMoney(raw.profit),
    // Counts — `?? 0` is legitimate here (anti-pattern #8 allows counts).
    qty: toCount(raw.qty),
    sku_count: toCount(raw.sku_count),
    missing_cogs_count: toCount(raw.missing_cogs_count),
  }
}

/**
 * Normalize the margin-trends endpoint response into MarginTrendPoint[].
 * Accepts the apiClient-unwrapped bare array (prod) or the raw `{ data: [...] }` wrapper.
 */
export function normalizeMarginTrendsResponse(raw: unknown): MarginTrendPoint[] {
  const arr = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { data?: unknown })?.data)
      ? (raw as { data: unknown[] }).data
      : []

  return (
    arr
      .filter((p): p is Record<string, unknown> => typeof p === 'object' && p !== null)
      .map(normalizeMarginTrendPoint)
      // Drop points with no week identifier — they cannot render on the week x-axis and
      // would sort to the front as a blank tick. A missing week is a backend anomaly, not
      // a chartable point (Defensive Frontend Principle: don't silently render bad data).
      .filter(point => point.week !== '')
  )
}
