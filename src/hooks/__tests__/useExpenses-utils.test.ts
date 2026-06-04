/**
 * Unit tests for useExpenses-utils (Epic 74 / Request #56) — coverage added iter-166.
 *
 * Pure expense mapping/transform extracted from useExpenses: buildExpenseItems (13 categories with
 * _total→legacy→0 fallback, >0 filter, desc sort), addPercentages, buildExpenseBreakdown.
 */

import { describe, it, expect } from 'vitest'
import type { FinanceSummary } from '@/hooks/useDashboard'
import {
  buildExpenseItems,
  addPercentages,
  buildExpenseBreakdown,
  type ExpenseItem,
} from '@/hooks/useExpenses-utils'

const fs = (over: Record<string, unknown> = {}): FinanceSummary => over as unknown as FinanceSummary

describe('buildExpenseItems', () => {
  it('maps positive categories, filters zero/absent, sorts descending', () => {
    const items = buildExpenseItems(fs({ logistics_cost_total: 500, storage_cost_total: 800 }))
    expect(items).toEqual([
      { category: 'Хранение', amount: 800 },
      { category: 'Логистика', amount: 500 },
    ])
  })

  it('prefers the _total field over the legacy field', () => {
    const items = buildExpenseItems(
      fs({ total_commission_rub_total: 1000, total_commission_rub: 999 })
    )
    expect(items).toEqual([{ category: 'Комиссия WB', amount: 1000 }])
  })

  it('falls back to the legacy field when _total is absent', () => {
    const items = buildExpenseItems(fs({ total_commission_rub: 800 }))
    expect(items).toEqual([{ category: 'Комиссия WB', amount: 800 }])
  })

  it('computes "Прочие корректировки" as max(0, otherAdjustments - wbServices)', () => {
    const items = buildExpenseItems(
      fs({ other_adjustments_net_total: 300, wb_services_cost_total: 100 })
    )
    const other = items.find(i => i.category === 'Прочие корректировки')
    expect(other?.amount).toBe(200)
  })
})

describe('addPercentages', () => {
  it('adds percentage of the running total', () => {
    const result = addPercentages([
      { category: 'A', amount: 750 },
      { category: 'B', amount: 250 },
    ])
    expect(result[0].percentage).toBe(75)
    expect(result[1].percentage).toBe(25)
  })
  it('uses 0% when total is 0 (no divide-by-zero)', () => {
    const result = addPercentages([{ category: 'A', amount: 0 } as ExpenseItem])
    expect(result[0].percentage).toBe(0)
  })
})

describe('buildExpenseBreakdown', () => {
  it('returns expenses+percentages, total, and revenueShare', () => {
    const b = buildExpenseBreakdown(
      fs({ total_commission_rub_total: 1500, sale_gross_total: 10000 })
    )
    expect(b.total).toBe(1500)
    expect(b.expenses[0].percentage).toBe(100)
    expect(b.revenueShare).toBe(15) // 1500 / 10000 * 100
    expect(b.previousTotal).toBeUndefined()
  })

  it('revenueShare is undefined when sale_gross is 0', () => {
    expect(
      buildExpenseBreakdown(fs({ total_commission_rub_total: 100 })).revenueShare
    ).toBeUndefined()
  })

  it('includes previousTotal when a previous summary is given', () => {
    const b = buildExpenseBreakdown(
      fs({ total_commission_rub_total: 1500 }),
      fs({ total_commission_rub_total: 1000 })
    )
    expect(b.previousTotal).toBe(1000)
  })
})
