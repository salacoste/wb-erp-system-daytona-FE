/**
 * Returns Daily — Boundary Normalizer
 *
 * Normalizes raw backend response from GET /v1/analytics/returns/daily
 * into frontend-canonical shape (ReturnsDailyResponse).
 *
 * AP#8 split: counts → toCount (0), rate → toNullableNumber (null).
 *
 * @see src/types/returns-daily.ts
 * @see CLAUDE.md § Boundary Normalizer Pattern
 */

import { asRecord, toCount, toNullableNumber, toStr } from '@/lib/api/normalizer-helpers'
import type {
  DailyReturnItem,
  ReturnsDailyResponse,
  ReturnsDailySummary,
} from '@/types/returns-daily'

// ---------------------------------------------------------------------------
// Item normalizer
// ---------------------------------------------------------------------------

function normalizeDailyReturnItem(raw: unknown): DailyReturnItem {
  const d = asRecord(raw)
  return {
    date: toStr(d.date),
    // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: totalReturns is a count; 0 = no returns that day
    totalReturns: toCount(d.totalReturns ?? d.total_returns),
    // Rate: nullable — null when backend has no sales data to compute rate
    returnRate: toNullableNumber(d.returnRate ?? d.return_rate) ?? 0,
    // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: cancellations is a count
    cancellations: toCount(d.cancellations),
    // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: refusals is a count
    refusals: toCount(d.refusals),
    // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: defects is a count
    defects: toCount(d.defects),
  }
}

// ---------------------------------------------------------------------------
// Summary normalizer
// ---------------------------------------------------------------------------

function normalizeSummary(raw: unknown): ReturnsDailySummary {
  const s = asRecord(raw)
  return {
    // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: totalReturns is a count
    totalReturns: toCount(s.totalReturns ?? s.total_returns),
    // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: avgReturnRate is 0 when no returns occurred
    avgReturnRate: toNullableNumber(s.avgReturnRate ?? s.avg_return_rate) ?? 0,
    // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: counts
    totalCancellations: toCount(s.totalCancellations ?? s.total_cancellations),
    // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: counts
    totalRefusals: toCount(s.totalRefusals ?? s.total_refusals),
    // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: counts
    totalDefects: toCount(s.totalDefects ?? s.total_defects),
  }
}

// ---------------------------------------------------------------------------
// Exported normalizer
// ---------------------------------------------------------------------------

/**
 * Normalizes the raw returns/daily response into ReturnsDailyResponse.
 * Handles null values, missing fields, and camelCase/snake_case variants.
 */
export function normalizeReturnsDailyResponse(raw: unknown): ReturnsDailyResponse {
  const r = asRecord(raw)
  const period = asRecord(r.period)
  const dailyRaw = r.daily

  return {
    daily: Array.isArray(dailyRaw) ? (dailyRaw as unknown[]).map(normalizeDailyReturnItem) : [],
    period: {
      from: toStr(period.from),
      to: toStr(period.to),
    },
    summary: normalizeSummary(r.summary),
  }
}
