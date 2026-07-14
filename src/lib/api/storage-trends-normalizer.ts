/**
 * Storage Analytics Trends — Boundary Normalizer
 *
 * Normalizes raw backend responses from storage trends and summary endpoints.
 *
 * Endpoints:
 *   1. GET /v1/analytics/storage/trends
 *   2. GET /v1/analytics/storage/summary
 *
 * @see CLAUDE.md § Boundary Normalizer Pattern
 */

import { asRecord, toCount, toNullableNumber, toStr } from './normalizer-helpers'
import type {
  StorageTrendsResponse,
  StorageTrendPoint,
  StorageSummaryResponse,
  StoragePeriod,
  MetricSummary,
  MoneyMetricSummary,
} from '@/types/storage-analytics'

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function normalizePeriod(raw: unknown, fallbackFrom = '', fallbackTo = ''): StoragePeriod {
  const p = asRecord(raw)
  return {
    from: toStr(p.from ?? p.weekStart) || fallbackFrom,
    to: toStr(p.to ?? p.weekEnd) || fallbackTo,
    days_count: toCount(p.days_count ?? p.daysCount),
  }
}

function normalizeTrendPoint(raw: unknown): StorageTrendPoint {
  const d = asRecord(raw)
  return {
    week: toStr(d.week),
    storage_cost: toNullableNumber(d.storage_cost ?? d.storageCost),
    volume: toNullableNumber(d.volume),
  }
}

function normalizeMetricSummary(raw: unknown): MetricSummary {
  const d = asRecord(raw)
  return {
    min: toCount(d.min),
    max: toCount(d.max),
    avg: toCount(d.avg),
    trend: toNullableNumber(d.trend) ?? 0,
  }
}

/**
 * BD-44: money metric summary — min/max/avg MUST preserve null (AP#8: money, never 0).
 * `trend` is a SEMANTIC-ZERO ratio (0 = no change), so it falls back to 0.
 * Sibling of {@link normalizeMetricSummary} which is for counts (volume) where 0 is meaningful.
 */
function normalizeMoneyMetricSummary(raw: unknown): MoneyMetricSummary {
  const d = asRecord(raw)
  return {
    min: toNullableNumber(d.min),
    max: toNullableNumber(d.max),
    avg: toNullableNumber(d.avg),
    trend: toNullableNumber(d.trend) ?? 0,
  }
}

// ---------------------------------------------------------------------------
// Exported normalizers
// ---------------------------------------------------------------------------

/**
 * Normalizes the trends response envelope into StorageTrendsResponse.
 * Handles: `{ data: [...] }` envelope, bare array, or fallback empty.
 */
export function normalizeStorageTrendsResponse(
  raw: unknown,
  weekStart: string,
  weekEnd: string
): StorageTrendsResponse {
  const r = asRecord(raw)
  const points = Array.isArray(r.data) ? r.data : Array.isArray(raw) ? raw : []

  const rawSummary = r.summary
  const summary = rawSummary
    ? {
        storage_cost: normalizeMoneyMetricSummary(asRecord(rawSummary).storage_cost),
        volume: normalizeMetricSummary(asRecord(rawSummary).volume),
      }
    : undefined

  return {
    period: normalizePeriod(r.period, weekStart, weekEnd),
    nm_id: (typeof r.nm_id === 'string' ? r.nm_id : null) as string | null,
    data: points.map(normalizeTrendPoint),
    summary,
    has_data: points.length > 0,
  }
}

/**
 * Normalizes the summary response into StorageSummaryResponse.
 * Handles: `{ data: { ... }, period: { ... } }` or flat object.
 */
export function normalizeStorageSummaryResponse(raw: unknown): StorageSummaryResponse {
  const r = asRecord(raw)
  const d = asRecord(r.data)

  return {
    period: normalizePeriod(r.period),
    data: {
      totalCost: toNullableNumber(d.totalCost ?? d.total_cost),
      uniqueSkus: toCount(d.uniqueSkus ?? d.unique_skus),
      totalVolume: toCount(d.totalVolume ?? d.total_volume),
      daysCount: toCount(d.daysCount ?? d.days_count),
      avgCostPerSku: toNullableNumber(d.avgCostPerSku ?? d.avg_cost_per_sku),
      dateFrom: toStr(d.dateFrom ?? d.date_from),
      dateTo: toStr(d.dateTo ?? d.date_to),
    },
  }
}
