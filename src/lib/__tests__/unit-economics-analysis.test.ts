/**
 * Unit Tests for Unit Economics Analysis Functions
 * Covers: getTopMarginKillers, calculateHealthScore, getHealthScoreInfo,
 *         sortByProfitability, filterLossMaking, filterMissingCogs, filterByProfitabilityStatus
 */

import { describe, it, expect } from 'vitest'
import {
  getTopMarginKillers,
  calculateHealthScore,
  getHealthScoreInfo,
  sortByProfitability,
  filterLossMaking,
  filterMissingCogs,
  filterByProfitabilityStatus,
} from '../unit-economics-analysis'
import type {
  CostsPct,
  UnitEconomicsItem,
  UnitEconomicsSummary,
  ProfitabilityStatus,
} from '@/types/unit-economics'

// =============================================================================
// getTopMarginKillers
// =============================================================================

describe('getTopMarginKillers', () => {
  it('returns empty array when all costs are zero', () => {
    const costs: CostsPct = {
      cogs: 0,
      commission: 0,
      logistics_delivery: 0,
      logistics_return: 0,
      storage: 0,
      paid_acceptance: 0,
      penalties: 0,
      other_deductions: 0,
      advertising: 0,
      delivery_to_warehouse: 0,
    }
    expect(getTopMarginKillers(costs)).toEqual([])
  })

  it('returns top 3 costs sorted by percentage descending', () => {
    const costs: CostsPct = {
      cogs: 40,
      commission: 10,
      logistics_delivery: 15,
      logistics_return: 3,
      storage: 5,
      paid_acceptance: 7,
      penalties: 0,
      other_deductions: 0,
      advertising: 20,
      delivery_to_warehouse: 0,
    }
    const result = getTopMarginKillers(costs)
    expect(result).toHaveLength(3)
    expect(result[0].pct).toBe(40)
    expect(result[1].pct).toBe(20)
    expect(result[2].pct).toBe(15)
  })

  it('respects custom limit', () => {
    const costs: CostsPct = {
      cogs: 40,
      commission: 10,
      logistics_delivery: 15,
      logistics_return: 3,
      storage: 5,
      paid_acceptance: 7,
      penalties: 0,
      other_deductions: 0,
      advertising: 20,
      delivery_to_warehouse: 0,
    }
    const result = getTopMarginKillers(costs, 2)
    expect(result).toHaveLength(2)
  })

  it('returns fewer than limit if fewer non-zero costs exist', () => {
    const costs: CostsPct = {
      cogs: 30,
      commission: 0,
      logistics_delivery: 0,
      logistics_return: 0,
      storage: 0,
      paid_acceptance: 0,
      penalties: 0,
      other_deductions: 0,
      advertising: 0,
      delivery_to_warehouse: 0,
    }
    const result = getTopMarginKillers(costs, 3)
    expect(result).toHaveLength(1)
    expect(result[0].key).toBe('cogs')
  })

  it('includes label and color from COST_CATEGORIES', () => {
    const costs: CostsPct = {
      cogs: 30,
      commission: 0,
      logistics_delivery: 0,
      logistics_return: 0,
      storage: 0,
      paid_acceptance: 0,
      penalties: 0,
      other_deductions: 0,
      advertising: 0,
      delivery_to_warehouse: 0,
    }
    const result = getTopMarginKillers(costs)
    expect(result[0]).toHaveProperty('label')
    expect(result[0]).toHaveProperty('color')
  })
})

// =============================================================================
// calculateHealthScore
// =============================================================================

describe('calculateHealthScore', () => {
  const makeSummary = (overrides: Partial<UnitEconomicsSummary> = {}): UnitEconomicsSummary => ({
    total_revenue: 100000,
    total_net_profit: 20000,
    avg_cogs_pct: 40,
    avg_wb_fees_pct: 15,
    sku_count: 100,
    profitable_sku_count: 80,
    loss_making_sku_count: 10,
    missing_cogs_count: 10,
    avg_net_margin_pct: 20,
    ...overrides,
  })

  it('returns high score for healthy summary', () => {
    const score = calculateHealthScore(makeSummary({ avg_net_margin_pct: 30 }))
    expect(score).toBeGreaterThanOrEqual(60)
  })

  it('returns low score for unhealthy summary', () => {
    const score = calculateHealthScore(
      makeSummary({
        avg_net_margin_pct: -10,
        profitable_sku_count: 5,
        sku_count: 100,
        missing_cogs_count: 90,
      })
    )
    expect(score).toBeLessThan(30)
  })

  it('rewards delivery coverage ratio > 0.8', () => {
    const base = calculateHealthScore(makeSummary())
    const withDelivery = calculateHealthScore(makeSummary(), 0.9)
    expect(withDelivery).toBeGreaterThan(base)
  })

  it('rewards partial delivery coverage ratio > 0.5', () => {
    const base = calculateHealthScore(makeSummary())
    const withDelivery = calculateHealthScore(makeSummary(), 0.6)
    expect(withDelivery).toBeGreaterThan(base)
  })

  it('does not add delivery bonus for ratio <= 0.5', () => {
    const base = calculateHealthScore(makeSummary())
    const withLowDelivery = calculateHealthScore(makeSummary(), 0.3)
    expect(withLowDelivery).toBe(base)
  })

  it('handles zero sku_count without division by zero', () => {
    const score = calculateHealthScore(
      makeSummary({ sku_count: 0, profitable_sku_count: 0, missing_cogs_count: 0 })
    )
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('clamps score to maximum 100', () => {
    const score = calculateHealthScore(
      makeSummary({
        avg_net_margin_pct: 50,
        profitable_sku_count: 100,
        sku_count: 100,
        missing_cogs_count: 0,
      }),
      1.0
    )
    expect(score).toBeLessThanOrEqual(100)
  })

  it('handles null avg_net_margin_pct', () => {
    const score = calculateHealthScore(
      makeSummary({ avg_net_margin_pct: null as unknown as number })
    )
    expect(score).toBeGreaterThanOrEqual(0)
  })

  it('margin >= 25 gives 35 points', () => {
    const score = calculateHealthScore(
      makeSummary({
        avg_net_margin_pct: 25,
        profitable_sku_count: 0,
        missing_cogs_count: 100,
      })
    )
    // 35 (margin) + 0 (profitable) + 0 (cogs) = 35
    expect(score).toBe(35)
  })
})

// =============================================================================
// getHealthScoreInfo
// =============================================================================

describe('getHealthScoreInfo', () => {
  it('returns "Отлично" for score >= 80', () => {
    expect(getHealthScoreInfo(80).label).toBe('Отлично')
    expect(getHealthScoreInfo(100).label).toBe('Отлично')
  })

  it('returns "Хорошо" for score 60-79', () => {
    expect(getHealthScoreInfo(60).label).toBe('Хорошо')
    expect(getHealthScoreInfo(79).label).toBe('Хорошо')
  })

  it('returns "Нормально" for score 40-59', () => {
    expect(getHealthScoreInfo(40).label).toBe('Нормально')
    expect(getHealthScoreInfo(59).label).toBe('Нормально')
  })

  it('returns "Слабо" for score 20-39', () => {
    expect(getHealthScoreInfo(20).label).toBe('Слабо')
    expect(getHealthScoreInfo(39).label).toBe('Слабо')
  })

  it('returns "Критично" for score < 20', () => {
    expect(getHealthScoreInfo(0).label).toBe('Критично')
    expect(getHealthScoreInfo(19).label).toBe('Критично')
  })

  it('returns color and bgColor for each level', () => {
    const info = getHealthScoreInfo(50)
    expect(info).toHaveProperty('color')
    expect(info).toHaveProperty('bgColor')
  })
})

// =============================================================================
// sortByProfitability
// =============================================================================

describe('sortByProfitability', () => {
  const items: UnitEconomicsItem[] = [
    { net_margin_pct: 10 } as unknown as UnitEconomicsItem,
    { net_margin_pct: -5 } as unknown as UnitEconomicsItem,
    { net_margin_pct: 30 } as unknown as UnitEconomicsItem,
    { net_margin_pct: null } as unknown as UnitEconomicsItem,
  ]

  it('sorts worst_first by default (ascending margin, null = -Infinity)', () => {
    const result = sortByProfitability(items)
    // null becomes -Infinity, so it sorts first (worst)
    expect(result[0].net_margin_pct).toBeNull()
    expect(result[1].net_margin_pct).toBe(-5)
    expect(result[2].net_margin_pct).toBe(10)
    expect(result[3].net_margin_pct).toBe(30)
  })

  it('sorts best_first (descending margin)', () => {
    const result = sortByProfitability(items, 'best_first')
    expect(result[0].net_margin_pct).toBe(30)
    expect(result[1].net_margin_pct).toBe(10)
    expect(result[2].net_margin_pct).toBe(-5)
    expect(result[3].net_margin_pct).toBeNull()
  })

  it('null margins sort first in worst_first (treated as -Infinity)', () => {
    const result = sortByProfitability(items, 'worst_first')
    expect(result[0].net_margin_pct).toBeNull()
  })

  it('does not mutate original array', () => {
    const original = [...items]
    sortByProfitability(items)
    expect(items.map(i => i.net_margin_pct)).toEqual(original.map(i => i.net_margin_pct))
  })
})

// =============================================================================
// filterLossMaking
// =============================================================================

describe('filterLossMaking', () => {
  it('filters items with negative margin', () => {
    const items: UnitEconomicsItem[] = [
      { net_margin_pct: -5 } as unknown as UnitEconomicsItem,
      { net_margin_pct: 10 } as unknown as UnitEconomicsItem,
      { net_margin_pct: -20 } as unknown as UnitEconomicsItem,
    ]
    const result = filterLossMaking(items)
    expect(result).toHaveLength(2)
    expect(result.every(i => i.net_margin_pct !== null && i.net_margin_pct < 0)).toBe(true)
  })

  it('excludes null margins', () => {
    const items: UnitEconomicsItem[] = [
      { net_margin_pct: null } as unknown as UnitEconomicsItem,
      { net_margin_pct: -5 } as unknown as UnitEconomicsItem,
    ]
    const result = filterLossMaking(items)
    expect(result).toHaveLength(1)
  })

  it('excludes zero margins', () => {
    const items: UnitEconomicsItem[] = [
      { net_margin_pct: 0 } as unknown as UnitEconomicsItem,
      { net_margin_pct: -1 } as unknown as UnitEconomicsItem,
    ]
    const result = filterLossMaking(items)
    expect(result).toHaveLength(1)
  })

  it('returns empty for all profitable', () => {
    const items: UnitEconomicsItem[] = [
      { net_margin_pct: 10 } as unknown as UnitEconomicsItem,
      { net_margin_pct: 20 } as unknown as UnitEconomicsItem,
    ]
    expect(filterLossMaking(items)).toHaveLength(0)
  })
})

// =============================================================================
// filterMissingCogs
// =============================================================================

describe('filterMissingCogs', () => {
  it('filters items without COGS', () => {
    const items: UnitEconomicsItem[] = [
      { has_cogs: false } as unknown as UnitEconomicsItem,
      { has_cogs: true } as unknown as UnitEconomicsItem,
      { has_cogs: false } as unknown as UnitEconomicsItem,
    ]
    expect(filterMissingCogs(items)).toHaveLength(2)
  })

  it('returns empty when all have COGS', () => {
    const items: UnitEconomicsItem[] = [
      { has_cogs: true } as unknown as UnitEconomicsItem,
      { has_cogs: true } as unknown as UnitEconomicsItem,
    ]
    expect(filterMissingCogs(items)).toHaveLength(0)
  })
})

// =============================================================================
// filterByProfitabilityStatus
// =============================================================================

describe('filterByProfitabilityStatus', () => {
  it('filters by profitability status', () => {
    const items: UnitEconomicsItem[] = [
      { profitability_status: 'profitable' } as unknown as UnitEconomicsItem,
      { profitability_status: 'loss' } as unknown as UnitEconomicsItem,
      { profitability_status: 'profitable' } as unknown as UnitEconomicsItem,
    ]
    const result = filterByProfitabilityStatus(items, 'profitable' as ProfitabilityStatus)
    expect(result).toHaveLength(2)
  })

  it('returns empty when no items match', () => {
    const items: UnitEconomicsItem[] = [
      { profitability_status: 'profitable' } as unknown as UnitEconomicsItem,
    ]
    const result = filterByProfitabilityStatus(items, 'loss' as ProfitabilityStatus)
    expect(result).toHaveLength(0)
  })
})
