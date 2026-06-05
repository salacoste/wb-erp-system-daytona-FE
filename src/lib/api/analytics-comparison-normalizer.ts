/**
 * Analytics Comparison — Boundary Normalizer
 *
 * Normalizes raw backend responses from the weekly comparison endpoint into
 * frontend-canonical shapes (src/types/analytics-comparison.ts).
 *
 * AP#8 split: counts (orders) → toCount (0), money/ratios → toNullableNumber (null).
 *
 * @see src/types/analytics-comparison.ts
 * @see CLAUDE.md § Boundary Normalizer Pattern
 */

import type {
  ComparisonResponse,
  PeriodMetrics,
  DeltaValue,
  ComparisonDeltas,
  BreakdownItem,
} from '@/types/analytics-comparison'

import { asRecord, toCount, toNullableNumber, toStr } from '@/lib/api/normalizer-helpers'

// ---------------------------------------------------------------------------
// Sub-normalizers
// ---------------------------------------------------------------------------

function normalizeDeltaValue(raw: unknown): DeltaValue {
  const d = asRecord(raw)
  return {
    absolute: toNullableNumber(d.absolute) ?? 0,
    percent: toNullableNumber(d.percent) ?? 0,
  }
}

function normalizePeriodMetrics(raw: unknown): PeriodMetrics {
  const d = asRecord(raw)
  return {
    week: toStr(d.week),
    revenue: toNullableNumber(d.revenue) ?? 0,
    profit: toNullableNumber(d.profit) ?? 0,
    margin_pct: toNullableNumber(d.margin_pct) ?? 0,
    orders: toCount(d.orders),
    cogs: toNullableNumber(d.cogs) ?? 0,
    logistics: toNullableNumber(d.logistics) ?? 0,
    storage: toNullableNumber(d.storage) ?? 0,
    advertising: toNullableNumber(d.advertising) ?? 0,
  }
}

function normalizeComparisonDeltas(raw: unknown): ComparisonDeltas {
  const d = asRecord(raw)
  return {
    revenue: normalizeDeltaValue(d.revenue),
    profit: normalizeDeltaValue(d.profit),
    margin_pct: normalizeDeltaValue(d.margin_pct),
    orders: normalizeDeltaValue(d.orders),
    cogs: normalizeDeltaValue(d.cogs),
    logistics: normalizeDeltaValue(d.logistics),
    storage: normalizeDeltaValue(d.storage),
    advertising: normalizeDeltaValue(d.advertising),
  }
}

function normalizeBreakdownItem(raw: unknown): BreakdownItem {
  const d = asRecord(raw)
  return {
    id: toStr(d.id),
    name: toStr(d.name),
    period1_value: toNullableNumber(d.period1_value) ?? 0,
    period2_value: toNullableNumber(d.period2_value) ?? 0,
    delta_absolute: toNullableNumber(d.delta_absolute) ?? 0,
    delta_percent: toNullableNumber(d.delta_percent) ?? 0,
  }
}

// ---------------------------------------------------------------------------
// Exported normalizer
// ---------------------------------------------------------------------------

export function normalizeComparisonResponse(raw: unknown): ComparisonResponse {
  const r = asRecord(raw)
  return {
    period1: normalizePeriodMetrics(r.period1),
    period2: normalizePeriodMetrics(r.period2),
    delta: normalizeComparisonDeltas(r.delta),
    breakdown: Array.isArray(r.breakdown) ? r.breakdown.map(normalizeBreakdownItem) : undefined,
  }
}
