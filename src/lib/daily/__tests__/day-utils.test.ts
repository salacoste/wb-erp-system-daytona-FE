/**
 * Unit tests for daily/day-utils (Story 61.9-FE) — coverage added iter-159.
 *
 * getDayOfWeek (ISO 1=Mon..7=Sun) + createEmptyDailyMetrics. Day-of-week uses NOON local inputs so
 * getDay() never crosses a TZ day boundary. createEmptyDailyMetrics pins the anti-pattern #8 invariant:
 * theoreticalProfit is null (unknown for gap-filled days), NOT 0 (Story 106.1-FE).
 */

import { describe, it, expect } from 'vitest'
import { getDayOfWeek, createEmptyDailyMetrics } from '@/lib/daily/day-utils'

describe('getDayOfWeek (ISO: Mon=1 … Sun=7)', () => {
  it('maps known dates to ISO day numbers (noon input → TZ-robust)', () => {
    expect(getDayOfWeek('2026-01-12T12:00:00')).toBe(1) // Monday
    expect(getDayOfWeek('2026-01-15T12:00:00')).toBe(4) // Thursday
    expect(getDayOfWeek('2026-01-18T12:00:00')).toBe(7) // Sunday (JS 0 → ISO 7)
  })
  it('throws on an invalid date', () => {
    expect(() => getDayOfWeek('not-a-date')).toThrow(/Invalid date/)
  })
})

describe('createEmptyDailyMetrics', () => {
  it('zeros all numeric fields but leaves theoreticalProfit null (anti-pattern #8 / Story 106.1)', () => {
    expect(createEmptyDailyMetrics('2026-01-15T12:00:00')).toEqual({
      date: '2026-01-15T12:00:00',
      dayOfWeek: 4,
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
      theoreticalProfit: null,
      salesCount: 0,
      returnsCount: 0,
    })
  })
  it('theoreticalProfit is null (unknown), never 0', () => {
    expect(createEmptyDailyMetrics('2026-01-12T12:00:00').theoreticalProfit).toBeNull()
  })
})
