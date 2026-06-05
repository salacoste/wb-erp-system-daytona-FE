/**
 * Return Analytics — Boundary Normalizer
 *
 * Normalizes raw backend responses from return reasons endpoint into
 * frontend-canonical shapes (src/types/analytics-returns.ts).
 * Only normalizes getReturnReasons (by-sku uses client-side aggregation).
 *
 * AP#8 split: counts → toCount (0), rates → toNullableNumber (null).
 *
 * @see src/types/analytics-returns.ts
 * @see CLAUDE.md § Boundary Normalizer Pattern
 */

import type {
  ReturnReasonsResponse,
  ReturnCategoryItem,
  ReturnCategory,
} from '@/types/analytics-returns'

import type { TrendDirection } from '@/types/analytics-buyout'

import { asRecord, toCount, toNullableNumber, toStr } from '@/lib/api/normalizer-helpers'

// ---------------------------------------------------------------------------
// Enum coercion
// ---------------------------------------------------------------------------

const VALID_CATEGORIES: ReadonlySet<string> = new Set([
  'cancel_before_shipment',
  'refusal_at_pvz',
  'return_after_receipt',
])

const VALID_TRENDS: ReadonlySet<string> = new Set(['up', 'down', 'stable'])

function toReturnCategory(raw: unknown): ReturnCategory {
  const s = String(raw ?? '')
  return VALID_CATEGORIES.has(s) ? (s as ReturnCategory) : 'return_after_receipt'
}

function toTrendDirection(raw: unknown): TrendDirection {
  const s = String(raw ?? '')
  return VALID_TRENDS.has(s) ? (s as TrendDirection) : 'stable'
}

// ---------------------------------------------------------------------------
// Item normalizer
// ---------------------------------------------------------------------------

function normalizeReturnCategoryItem(raw: unknown): ReturnCategoryItem {
  const d = asRecord(raw)
  return {
    category: toReturnCategory(d.category),
    displayName: toStr(d.displayName ?? d.display_name),
    count: toCount(d.count),
    percentage: toNullableNumber(d.percentage) ?? 0,
    trend: toTrendDirection(d.trend),
    trendDelta: toNullableNumber(d.trendDelta ?? d.trend_delta) ?? 0,
  }
}

// ---------------------------------------------------------------------------
// Exported normalizer
// ---------------------------------------------------------------------------

export function normalizeReturnReasonsResponse(raw: unknown): ReturnReasonsResponse {
  const r = asRecord(raw)
  const summary = asRecord(r.summary)
  const period = asRecord(r.period)
  const byCatRaw = r.byCategory ?? r.by_category
  return {
    summary: {
      totalReturns: toCount(summary.totalReturns ?? summary.total_returns),
      cancelBeforeShipment: toCount(summary.cancelBeforeShipment ?? summary.cancel_before_shipment),
      refusalAtPvz: toCount(summary.refusalAtPvz ?? summary.refusal_at_pvz),
      returnAfterReceipt: toCount(summary.returnAfterReceipt ?? summary.return_after_receipt),
      overallReturnRate:
        toNullableNumber(summary.overallReturnRate ?? summary.overall_return_rate) ?? 0,
      classificationCoverage:
        toNullableNumber(summary.classificationCoverage ?? summary.classification_coverage) ?? 0,
    },
    byCategory: Array.isArray(byCatRaw)
      ? (byCatRaw as unknown[]).map(normalizeReturnCategoryItem)
      : [],
    period: {
      from: toStr(period.from),
      to: toStr(period.to),
    },
  }
}
