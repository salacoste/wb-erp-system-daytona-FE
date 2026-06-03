/**
 * generateMockSummary — revenue-weighted portfolio averages (iter-131).
 * A simple per-SKU mean misrepresents the portfolio: a tiny -100%-margin SKU dragged the headline
 * margin far below the true total_net_profit/total_revenue (and could contradict the totals). The
 * MSW mock backs local dev + E2E, so the summary cards showed mathematically-wrong portfolio data.
 */
import { describe, it, expect } from 'vitest'
import { generateMockSummary } from '../unit-economics'
import type { UnitEconomicsItem } from '@/types/unit-economics'

// bridge: generateMockSummary reads revenue, net_profit, net_margin_pct, has_cogs, costs_pct.*
interface SummaryInput {
  revenue: number
  net_profit: number
  net_margin_pct: number
  has_cogs: boolean
  costs_pct: {
    cogs: number
    commission: number
    logistics_delivery: number
    logistics_return: number
    storage: number
  }
}
const item = (o: SummaryInput): UnitEconomicsItem => o as unknown as UnitEconomicsItem
const zeroFees = { commission: 0, logistics_delivery: 0, logistics_return: 0, storage: 0 }

describe('generateMockSummary — revenue-weighted portfolio averages (iter-131)', () => {
  const portfolio = [
    item({ revenue: 10000, net_profit: 3000, net_margin_pct: 30, has_cogs: true, costs_pct: { cogs: 40, ...zeroFees } }),
    item({ revenue: 1000, net_profit: -1000, net_margin_pct: -100, has_cogs: true, costs_pct: { cogs: 120, ...zeroFees } }),
  ]

  it('derives avg_net_margin_pct from totals (NOT a simple per-SKU mean)', () => {
    const s = generateMockSummary(portfolio)
    // total_net_profit 2000 / total_revenue 11000 = 18.18 → 18.2; simple mean would be (30-100)/2 = -35
    expect(s.avg_net_margin_pct).toBe(18.2)
    expect(s.avg_net_margin_pct).not.toBe(-35)
  })

  it('revenue-weights avg_cogs_pct (the big-revenue SKU dominates)', () => {
    const s = generateMockSummary(portfolio)
    // weighted = (40*10000 + 120*1000)/11000 = 47.27 → 47.3; simple mean would be 80
    expect(s.avg_cogs_pct).toBe(47.3)
    expect(s.avg_cogs_pct).not.toBe(80)
  })

  it('returns 0 (no NaN) for an empty portfolio', () => {
    const s = generateMockSummary([])
    expect(s.avg_net_margin_pct).toBe(0)
    expect(s.avg_cogs_pct).toBe(0)
    expect(s.avg_wb_fees_pct).toBe(0)
  })
})
