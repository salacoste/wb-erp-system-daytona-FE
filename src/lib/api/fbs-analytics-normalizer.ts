/**
 * FBS Analytics Boundary Normalizers — Story 89.1-FE
 * Absorbs backend shape drift for FBS trends/seasonal/compare endpoints.
 * Nullability: FBS TrendDataPoint.{revenue, avgOrderValue} are typed as `number` (not nullable).
 * If backend sends null, coerce to 0 here. A type-widening change (like Story 88.2) would be
 * needed to preserve null — out of scope for this normalizer story.
 */

import type { TrendsResponse, SeasonalResponse, CompareResponse } from '@/types/fbs-analytics'

export function normalizeTrendsResponse(raw: unknown): TrendsResponse {
  const r = (raw ?? {}) as Record<string, unknown>
  const trends = Array.isArray(r.trends) ? r.trends : []
  const period = (r.period ?? {}) as Record<string, unknown>

  return {
    ...r,
    trends: trends.map((t: unknown) => {
      const d = (t ?? {}) as Record<string, unknown>
      return {
        ...d,
        date: String(d.date ?? ''),
        ordersCount: Number(d.ordersCount ?? d.orders_count ?? 0),
        // Type says `number` (not nullable); coerce null→0. See comment at file top.
        revenue: Number(d.revenue ?? 0),
        cancellations: Number(d.cancellations ?? 0),
        returns: Number(d.returns ?? 0),
        avgOrderValue: Number(d.avgOrderValue ?? 0),
      }
    }),
    period: {
      from: String(period.from ?? ''),
      to: String(period.to ?? ''),
      daysIncluded: Number(period.daysIncluded ?? period.days_included ?? 0),
    },
  } as unknown as TrendsResponse
}

export function normalizeSeasonalResponse(raw: unknown): SeasonalResponse {
  // Seasonal response has deeply nested patterns — normalize top-level, pass nested through
  const r = (raw ?? {}) as Record<string, unknown>
  return {
    ...r,
    patterns: r.patterns ?? { monthly: null, weekday: null, quarterly: null },
    summary: r.summary ?? {},
  } as unknown as SeasonalResponse
}

export function normalizeCompareResponse(raw: unknown): CompareResponse {
  const r = (raw ?? {}) as Record<string, unknown>
  const comparison = (r.comparison ?? {}) as Record<string, unknown>

  return {
    ...r,
    comparison: {
      ...comparison,
      ordersChangePercent: Number(
        comparison.ordersChangePercent ?? comparison.orders_change_percent ?? 0
      ),
      revenueChangePercent: Number(
        comparison.revenueChangePercent ?? comparison.revenue_change_percent ?? 0
      ),
    },
  } as unknown as CompareResponse
}
