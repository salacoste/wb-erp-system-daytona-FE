/**
 * Unit tests for daily breakdown table columns
 * Story 87.2-FE: Daily Breakdown Table Enhancement
 *
 * Regression tests covering:
 * - New finance columns (sales, logistics, storage, commission, theoreticalProfit)
 * - Advertising sign fix (no '-' prefix)
 * - calculateTotals sums all fields
 * - getColumnComparator works for new keys
 */

import { describe, it, expect } from 'vitest'
import type { DailyMetrics } from '@/types/daily-metrics'
import {
  COLUMNS,
  formatCellValue,
  calculateTotals,
  getColumnComparator,
  formatDayWithDate,
} from '../table-columns'

function makeDay(overrides: Partial<DailyMetrics> = {}): DailyMetrics {
  return {
    date: '2026-04-13',
    dayOfWeek: 1,
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
    theoreticalProfit: 0,
    ...overrides,
  }
}

describe('COLUMNS config', () => {
  it('has exactly 9 entries in the correct order', () => {
    expect(COLUMNS).toHaveLength(9)
    expect(COLUMNS.map(c => c.key)).toEqual([
      'date',
      'ordersCount',
      'orders',
      'sales',
      'advertising',
      'logistics',
      'storage',
      'commission',
      'theoreticalProfit',
    ])
  })

  it('marks advertising, logistics, storage, commission as expense columns', () => {
    const expense = COLUMNS.filter(c => c.isExpense).map(c => c.key)
    expect(expense).toEqual(['advertising', 'logistics', 'storage', 'commission'])
  })

  it('marks only theoreticalProfit as colorized', () => {
    const colorized = COLUMNS.filter(c => c.colorize).map(c => c.key)
    expect(colorized).toEqual(['theoreticalProfit'])
  })

  it('ordersCount has a tooltip explaining FBS-only scope', () => {
    const ordersCountCol = COLUMNS.find(c => c.key === 'ordersCount')
    expect(ordersCountCol?.tooltip).toContain('FBS')
  })

  it('has no columns using deprecated negativePrefix flag', () => {
    // Regression test: negativePrefix was removed in Story 87.2-FE
    const hasDeprecated = COLUMNS.some(
      c => (c as unknown as { negativePrefix?: boolean }).negativePrefix
    )
    expect(hasDeprecated).toBe(false)
  })
})

describe('formatCellValue', () => {
  it('formats date column as "Пн 13.04"', () => {
    const row = makeDay({ date: '2026-04-13', dayOfWeek: 1 })
    const dateCol = COLUMNS.find(c => c.key === 'date')!
    expect(formatCellValue(row, dateCol)).toBe('Пн 13.04')
  })

  it('formats ordersCount as integer without currency', () => {
    const row = makeDay({ ordersCount: 42 })
    const col = COLUMNS.find(c => c.key === 'ordersCount')!
    expect(formatCellValue(row, col)).toBe('42')
  })

  it('formats orders (revenue) as currency', () => {
    const row = makeDay({ orders: 12345 })
    const col = COLUMNS.find(c => c.key === 'orders')!
    expect(formatCellValue(row, col)).toMatch(/12\s345/)
    expect(formatCellValue(row, col)).toContain('₽')
  })

  it('formats sales (Выкупы) as currency', () => {
    const row = makeDay({ sales: 80000 })
    const col = COLUMNS.find(c => c.key === 'sales')!
    expect(formatCellValue(row, col)).toMatch(/80\s000/)
  })

  // REGRESSION: Story 87.2-FE AC-2 — advertising must NOT have '-' prefix
  it('advertising does NOT get negative prefix', () => {
    const row = makeDay({ advertising: 1009 })
    const col = COLUMNS.find(c => c.key === 'advertising')!
    const result = formatCellValue(row, col)
    expect(result.startsWith('-')).toBe(false)
    expect(result).toMatch(/1\s009/)
  })

  it('all expense columns return positive values (no sign prefix)', () => {
    const row = makeDay({ advertising: 100, logistics: 200, storage: 300, commission: 400 })
    ;['advertising', 'logistics', 'storage', 'commission'].forEach(key => {
      const col = COLUMNS.find(c => c.key === key)!
      const result = formatCellValue(row, col)
      expect(result.startsWith('-'), `${key} should not start with '-'`).toBe(false)
    })
  })

  it('expense columns display positive value even if backend sends negative', () => {
    // Math.abs safety net — costs are always positive
    const row = makeDay({ advertising: -500 })
    const col = COLUMNS.find(c => c.key === 'advertising')!
    const result = formatCellValue(row, col)
    expect(result).toMatch(/500/)
    expect(result.startsWith('-')).toBe(false)
  })

  it('handles totals row (date="Итого", dayOfWeek=0) without "NaN"', () => {
    const row = makeDay({ date: 'Итого', dayOfWeek: 0 })
    const dateCol = COLUMNS.find(c => c.key === 'date')!
    const result = formatCellValue(row, dateCol)
    // Should not contain "NaN" from invalid Date
    expect(result).not.toContain('NaN')
  })
})

describe('calculateTotals', () => {
  it('sums all 12 numeric fields including new ones', () => {
    const data: DailyMetrics[] = [
      makeDay({
        orders: 100,
        ordersCount: 1,
        ordersCogs: 50,
        sales: 80,
        salesCogs: 40,
        advertising: 10,
        logistics: 5,
        storage: 3,
        penalties: 2,
        paidAcceptance: 1,
        commission: 8,
        theoreticalProfit: 20,
      }),
      makeDay({
        orders: 200,
        ordersCount: 2,
        ordersCogs: 100,
        sales: 160,
        salesCogs: 80,
        advertising: 20,
        logistics: 10,
        storage: 6,
        penalties: 4,
        paidAcceptance: 2,
        commission: 16,
        theoreticalProfit: 40,
      }),
    ]
    const totals = calculateTotals(data)

    expect(totals.date).toBe('Итого')
    expect(totals.dayOfWeek).toBe(0)
    expect(totals.orders).toBe(300)
    expect(totals.ordersCount).toBe(3)
    expect(totals.ordersCogs).toBe(150)
    expect(totals.sales).toBe(240)
    expect(totals.salesCogs).toBe(120)
    expect(totals.advertising).toBe(30)
    expect(totals.logistics).toBe(15)
    expect(totals.storage).toBe(9)
    expect(totals.penalties).toBe(6)
    expect(totals.paidAcceptance).toBe(3)
    expect(totals.commission).toBe(24)
    expect(totals.theoreticalProfit).toBe(60)
  })

  it('returns zero totals for empty data', () => {
    const totals = calculateTotals([])
    expect(totals.orders).toBe(0)
    expect(totals.sales).toBe(0)
    expect(totals.commission).toBe(0)
    expect(totals.theoreticalProfit).toBe(0)
  })
})

describe('getColumnComparator', () => {
  it('sorts by date string', () => {
    const cmp = getColumnComparator('date')
    const a = makeDay({ date: '2026-04-13' })
    const b = makeDay({ date: '2026-04-14' })
    expect(cmp(a, b)).toBeLessThan(0)
  })

  it('sorts by sales (new column)', () => {
    const cmp = getColumnComparator('sales')
    const a = makeDay({ sales: 100 })
    const b = makeDay({ sales: 200 })
    expect(cmp(a, b)).toBeLessThan(0)
  })

  it('sorts by theoreticalProfit (new column)', () => {
    const cmp = getColumnComparator('theoreticalProfit')
    const a = makeDay({ theoreticalProfit: -100 })
    const b = makeDay({ theoreticalProfit: 100 })
    expect(cmp(a, b)).toBeLessThan(0)
  })
})

describe('formatDayWithDate', () => {
  it('formats Monday correctly', () => {
    expect(formatDayWithDate('2026-04-13', 1)).toBe('Пн 13.04')
  })

  it('returns "?" for invalid dayOfWeek', () => {
    expect(formatDayWithDate('2026-04-13', 0)).toMatch(/^\?/)
  })
})
