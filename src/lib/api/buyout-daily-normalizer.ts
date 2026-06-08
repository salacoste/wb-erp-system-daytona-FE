/**
 * Buyout Daily Trend — Boundary Normalizer
 *
 * Normalizes raw backend response from GET /v1/analytics/buyout/daily
 * into frontend-canonical BuyoutDailyResponse.
 *
 * AP#8 split: counts → toCount (0), rates → toNullableNumber (null).
 *
 * @see src/types/buyout-daily.ts
 * @see CLAUDE.md § Boundary Normalizer Pattern
 */

import { asRecord, toCount, toNullableNumber, toStr } from './normalizer-helpers'
import type {
  BuyoutDailyResponse,
  DailyBuyoutPoint,
  DailyBuyoutSummary,
} from '@/types/buyout-daily'

// ---------------------------------------------------------------------------
// Item normalizer
// ---------------------------------------------------------------------------

function normalizeDailyBuyoutPoint(raw: unknown): DailyBuyoutPoint {
  const d = asRecord(raw)
  return {
    date: toStr(d.date),
    buyoutRate: toNullableNumber(d.buyoutRate ?? d.buyout_rate),
    returnRate: toNullableNumber(d.returnRate ?? d.return_rate),
    ordersCount: toCount(d.ordersCount ?? d.orders_count),
    returnsCount: toCount(d.returnsCount ?? d.returns_count),
  }
}

// ---------------------------------------------------------------------------
// Summary normalizer
// ---------------------------------------------------------------------------

function normalizeSummary(raw: unknown): DailyBuyoutSummary {
  const s = asRecord(raw)
  return {
    avgBuyoutRate: toNullableNumber(s.avgBuyoutRate ?? s.avg_buyout_rate),
    avgReturnRate: toNullableNumber(s.avgReturnRate ?? s.avg_return_rate),
    totalOrders: toCount(s.totalOrders ?? s.total_orders),
    totalReturns: toCount(s.totalReturns ?? s.total_returns),
  }
}

// ---------------------------------------------------------------------------
// Exported normalizer
// ---------------------------------------------------------------------------

/**
 * Normalizes the buyout/daily response into BuyoutDailyResponse.
 * Handles null/undefined/empty gracefully.
 */
export function normalizeBuyoutDailyResponse(raw: unknown): BuyoutDailyResponse {
  const r = asRecord(raw)
  const period = asRecord(r.period)
  const dailyRaw = Array.isArray(r.daily) ? r.daily : []

  return {
    daily: dailyRaw.map(normalizeDailyBuyoutPoint),
    period: {
      from: toStr(period.from),
      to: toStr(period.to),
    },
    summary: normalizeSummary(r.summary),
  }
}
