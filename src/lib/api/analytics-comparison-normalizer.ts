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

function firstNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    const normalized = toNullableNumber(value)
    if (normalized != null) return normalized
  }
  return undefined
}

function getMetricSource(raw: Record<string, unknown>): Record<string, unknown> {
  const data = asRecord(raw.data)
  return Object.keys(data).length > 0 ? data : raw
}

function normalizeDeltaValue(raw: unknown): DeltaValue {
  const d = asRecord(raw)
  return {
    absolute: toNullableNumber(d.absolute) ?? 0,
    percent: toNullableNumber(d.percent) ?? 0,
  }
}

function normalizePeriodMetrics(raw: unknown): PeriodMetrics {
  const d = asRecord(raw)
  const source = getMetricSource(d)

  return {
    week: toStr(d.week || d.label),
    revenue:
      firstNumber(
        source.revenue,
        source.revenue_net,
        source.wb_sales_gross,
        source.wb_sales_gross_total,
        source.sale_gross,
        source.sale_gross_total
      ) ?? 0,
    profit:
      firstNumber(
        source.profit,
        source.gross_profit,
        source.gross_profit_analytical,
        source.operating_profit_analytical
      ) ?? 0,
    margin_pct: firstNumber(source.margin_pct, source.gross_margin_pct) ?? 0,
    orders: toCount(source.orders ?? source.qty ?? source.product_transactions),
    cogs: firstNumber(source.cogs, source.cogs_total) ?? 0,
    logistics:
      firstNumber(source.logistics, source.logistics_cost, source.logistics_cost_total) ?? 0,
    storage: firstNumber(source.storage, source.storage_cost, source.storage_cost_total) ?? 0,
    advertising:
      firstNumber(
        source.advertising,
        source.advertising_spend,
        source.advertising_spend_total,
        source.wb_promotion_cost,
        source.wb_promotion_cost_total
      ) ?? 0,
  }
}

function normalizeComparisonDeltas(raw: unknown): ComparisonDeltas {
  const d = asRecord(raw)
  return {
    revenue: normalizeDeltaValue(d.revenue ?? d.revenue_net ?? d.wb_sales_gross),
    profit: normalizeDeltaValue(d.profit),
    margin_pct: normalizeDeltaValue(d.margin_pct),
    orders: normalizeDeltaValue(d.orders ?? d.qty ?? d.product_transactions),
    cogs: normalizeDeltaValue(d.cogs ?? d.cogs_total),
    logistics: normalizeDeltaValue(d.logistics ?? d.logistics_cost ?? d.logistics_cost_total),
    storage: normalizeDeltaValue(d.storage ?? d.storage_cost ?? d.storage_cost_total),
    advertising: normalizeDeltaValue(
      d.advertising ?? d.advertising_spend ?? d.advertising_spend_total ?? d.wb_promotion_cost
    ),
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
  const root = asRecord(raw)
  const wrapped = asRecord(root.comparison)
  const r = Object.keys(wrapped).length > 0 ? wrapped : root

  return {
    period1: normalizePeriodMetrics(r.period1),
    period2: normalizePeriodMetrics(r.period2),
    delta: normalizeComparisonDeltas(r.delta),
    breakdown: Array.isArray(root.breakdown)
      ? root.breakdown.map(normalizeBreakdownItem)
      : Array.isArray(r.breakdown)
        ? r.breakdown.map(normalizeBreakdownItem)
        : undefined,
  }
}
