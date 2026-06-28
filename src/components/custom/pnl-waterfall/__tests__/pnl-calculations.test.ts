import { describe, expect, it } from 'vitest'
import { calculatePnL } from '../usePnLCalculations'
import type { CabinetProductStats, CabinetSummaryTotals } from '@/types/analytics'

const products: CabinetProductStats = {
  total: 35,
  with_cogs: 35,
  without_cogs: 0,
  coverage_pct: 100,
}

function createTotals(overrides: Partial<CabinetSummaryTotals> = {}): CabinetSummaryTotals {
  return {
    sales_gross: 2744532.5,
    returns_gross: 18737,
    sale_gross: 2725795.5,
    total_commission_rub: 794311.9,
    logistics_cost: 286190.12,
    storage_cost: 18819.98,
    paid_acceptance_cost: 2070,
    penalties: 5254.76,
    payout_total: 1360190.43,
    revenue_net: 1896024.1,
    cogs_total: 675482,
    profit: 1220542.1,
    margin_pct: 64.37,
    qty: 3568,
    profit_per_unit: 342.08,
    roi: 180.69,
    acquiring_fee: 75912.48,
    loyalty_fee: null,
    loyalty_compensation: 3371.98,
    other_adjustments: 222595,
    skus_with_expenses_only: 15,
    ...overrides,
  }
}

describe('calculatePnL key metrics', () => {
  it('derives ROI and profit/unit from the displayed payout-minus-COGS gross profit', () => {
    const calc = calculatePnL(createTotals(), products)

    expect(calc.grossProfit).toBeCloseTo(684708.43, 2)
    expect(calc.keyMetricRoi).toBeCloseTo(101.3659, 4)
    expect(calc.keyMetricProfitPerUnit).toBeCloseTo(191.9026, 4)
  })

  it('hides ROI/profit-unit when COGS coverage is incomplete', () => {
    const calc = calculatePnL(createTotals(), { ...products, coverage_pct: 80 })

    expect(calc.grossProfit).toBeNull()
    expect(calc.keyMetricRoi).toBeNull()
    expect(calc.keyMetricProfitPerUnit).toBeNull()
  })

  it('hides ROI when COGS is zero but still calculates profit per unit', () => {
    const calc = calculatePnL(
      createTotals({ payout_total: 1000, cogs_total: 0, qty: 10 }),
      products
    )

    expect(calc.keyMetricRoi).toBeNull()
    expect(calc.keyMetricProfitPerUnit).toBe(100)
  })
})
