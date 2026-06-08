/**
 * Table Totals Calculation
 * Story 62.8-FE: Daily Metrics Table View
 *
 * Extracted totals-row aggregator for daily P&L metrics.
 *
 * @see docs/stories/epic-62/story-62.8-fe-daily-metrics-table.md
 */

import { nullPreservingSum } from '@/lib/aggregation-helpers'
import type { DailyMetrics } from '@/types/daily-metrics'

/**
 * Calculate totals row from daily data.
 */
export function calculateTotals(data: DailyMetrics[]): DailyMetrics {
  const initial: DailyMetrics = {
    date: 'Итого',
    dayOfWeek: 0,
    orders: 0,
    ordersCount: 0,
    ordersCogs: 0,
    sales: 0,
    salesCogs: 0,
    advertising: 0,
    logistics: 0,
    storage: 0,
    penalties: 0,
    paidAcceptance: 0,
    commission: 0,
    // Story 106.1-FE: null initial — if ALL days are null the total stays null (renders "—").
    // Once any day has a real number the accumulator becomes numeric and stays that way.
    theoreticalProfit: null,
    // Story 92.4 H-3 fix: counts, 0 is legitimate (anti-pattern #8 — not nullable)
    salesCount: 0,
    returnsCount: 0,
  }

  return data.reduce(
    (acc, day) => ({
      ...acc,
      orders: acc.orders + day.orders,
      ordersCount: acc.ordersCount + day.ordersCount,
      // Story 88.2-FE: null days are skipped — totals row shows the "known" total only.
      // Display layer surfaces gap via footnote (AC-4).
      ordersCogs: (acc.ordersCogs ?? 0) + (day.ordersCogs ?? 0),
      sales: acc.sales + day.sales,
      salesCogs: (acc.salesCogs ?? 0) + (day.salesCogs ?? 0),
      advertising: acc.advertising + day.advertising,
      logistics: acc.logistics + day.logistics,
      storage: acc.storage + day.storage,
      penalties: acc.penalties + day.penalties,
      paidAcceptance: acc.paidAcceptance + day.paidAcceptance,
      commission: acc.commission + day.commission,
      // Story 106.1-FE: null-preserving sum — stays null only while BOTH sides are null.
      // Story 107.1-FE: extracted to nullPreservingSum helper.
      theoreticalProfit: nullPreservingSum(acc.theoreticalProfit, day.theoreticalProfit),
    }),
    initial
  )
}
