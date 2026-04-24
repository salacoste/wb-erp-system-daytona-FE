/**
 * Unit tests for monitor-weekly-chart-utils pure helpers
 * Epic 92-FE Story 92.4: transformDailyToChartRows + label formatting.
 * Pure-functions-over-hook-mocking pattern (CLAUDE.md).
 *
 * H-3 fix: ChartRow now has sales/orders/returns (all integer counts).
 * L-1 fix: weekday labels are capitalized ("Пн" not "пн").
 */

import { describe, it, expect } from 'vitest'
import { transformDailyToChartRows } from '../monitor-weekly-chart-utils'
import type { DailyMetrics } from '@/types/daily-metrics'

// Minimal fixture matching actual DailyMetrics shape (Story 61.9-FE + Story 92.4 new fields).
function makeDay(overrides: Partial<DailyMetrics> = {}): DailyMetrics {
  return {
    date: '2026-04-18',
    dayOfWeek: 6,
    orders: 0,
    ordersCount: 0,
    ordersCogs: null,
    sales: 0,
    salesCogs: null,
    advertising: 0,
    logistics: 0,
    storage: 0,
    penalties: 0,
    paidAcceptance: 0,
    commission: 0,
    theoreticalProfit: 0,
    salesCount: 0,
    returnsCount: 0,
    ...overrides,
  }
}

describe('transformDailyToChartRows', () => {
  it('maps salesCount, derived orders (sales+returns), and returnsCount correctly', () => {
    const input: DailyMetrics[] = [
      makeDay({ date: '2026-04-18', salesCount: 15, returnsCount: 3 }),
      makeDay({ date: '2026-04-19', salesCount: 8, returnsCount: 1 }),
    ]

    const rows = transformDailyToChartRows(input)

    expect(rows).toHaveLength(2)

    expect(rows[0].date).toBe('2026-04-18')
    expect(rows[0].sales).toBe(15)
    expect(rows[0].orders).toBe(18) // 15 + 3
    expect(rows[0].returns).toBe(3)

    expect(rows[1].date).toBe('2026-04-19')
    expect(rows[1].sales).toBe(8)
    expect(rows[1].orders).toBe(9) // 8 + 1
    expect(rows[1].returns).toBe(1)
  })

  it('returns capitalized Russian weekday abbreviation + date for 2026-04-20 (Monday = Пн)', () => {
    // L-1 fix: 2026-04-20 is a Monday.
    // date-fns EEEEEE with ru locale produces lowercase "пн" — capitalize() makes it "Пн".
    const rows = transformDailyToChartRows([makeDay({ date: '2026-04-20' })])

    // Label must start with uppercase "П" (not lowercase "п")
    expect(rows[0].label).toMatch(/^Пн/)
    expect(rows[0].label).toMatch(/20\.04/)
  })

  it('returns empty array when input is empty', () => {
    expect(transformDailyToChartRows([])).toEqual([])
  })

  it('handles all-zero counts gracefully (no NaN or crashes)', () => {
    const rows = transformDailyToChartRows([makeDay({ salesCount: 0, returnsCount: 0 })])
    expect(rows[0].sales).toBe(0)
    expect(rows[0].orders).toBe(0)
    expect(rows[0].returns).toBe(0)
  })
})
