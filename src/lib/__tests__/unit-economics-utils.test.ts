/**
 * Unit tests for unit-economics-utils (barrel re-exports + local functions)
 * Epic 5 / Epic 74
 */

import { describe, it, expect } from 'vitest'
import {
  transformToWaterfallData,
  calculateWbFeesPct,
  calculateWbFeesRub,
  getStatusFromMargin,
  COST_CATEGORIES,
} from '../unit-economics-utils'
import type { CostsPct, CostsRub } from '@/types/unit-economics'

// ============================================================================
// Test fixtures
// ============================================================================

const makeCostsPct = (overrides: Partial<CostsPct> = {}): CostsPct => ({
  cogs: 30,
  commission: 10,
  logistics_delivery: 5,
  logistics_return: 2,
  storage: 3,
  paid_acceptance: 1,
  penalties: 0,
  other_deductions: 0,
  advertising: 0,
  delivery_to_warehouse: null,
  ...overrides,
})

const makeCostsRub = (overrides: Partial<CostsRub> = {}): CostsRub => ({
  cogs: 300,
  commission: 100,
  logistics_delivery: 50,
  logistics_return: 20,
  storage: 30,
  paid_acceptance: 10,
  penalties: 0,
  other_deductions: 0,
  advertising: 0,
  delivery_to_warehouse: null,
  ...overrides,
})

// ============================================================================
// transformToWaterfallData
// ============================================================================

describe('transformToWaterfallData', () => {
  it('starts with revenue data point', () => {
    const result = transformToWaterfallData(1000, makeCostsPct(), makeCostsRub())
    expect(result[0]).toBeDefined()
    expect(result[0]!.name).toBe('Выручка')
    expect(result[0]!.value).toBe(1000)
    expect(result[0]!.color).toBe('#22C55E')
  })

  it('ends with profit data point', () => {
    const result = transformToWaterfallData(1000, makeCostsPct(), makeCostsRub())
    const last = result[result.length - 1]
    expect(last!.isProfit).toBe(true)
    expect(last!.name).toBe('Прибыль')
  })

  it('shows green profit when positive', () => {
    const result = transformToWaterfallData(1000, makeCostsPct(), makeCostsRub())
    const profit = result[result.length - 1]!
    expect(profit.color).toBe('#22C55E')
  })

  it('shows red profit when negative', () => {
    const hugeCosts = makeCostsRub({ cogs: 900, commission: 200 })
    const result = transformToWaterfallData(1000, makeCostsPct(), hugeCosts)
    const profit = result[result.length - 1]!
    expect(profit.color).toBe('#EF4444')
  })

  it('costs are negative values in waterfall', () => {
    const result = transformToWaterfallData(1000, makeCostsPct(), makeCostsRub())
    const costPoints = result.filter(p => !p.isProfit && p.name !== 'Выручка')
    for (const point of costPoints) {
      expect(point.value).toBeLessThan(0)
    }
  })

  it('omits cost categories with zero value', () => {
    const result = transformToWaterfallData(1000, makeCostsPct(), makeCostsRub())
    const costNames = result.filter(p => !p.isProfit && p.name !== 'Выручка').map(p => p.name)
    // penalties, other_deductions, advertising are 0 → should not appear
    expect(costNames).not.toContain('Штрафы')
  })

  it('running total decreases with each cost', () => {
    const result = transformToWaterfallData(1000, makeCostsPct(), makeCostsRub())
    for (let i = 1; i < result.length - 1; i++) {
      expect(result[i]!.runningTotal).toBeLessThan(result[i - 1]!.runningTotal)
    }
  })

  it('handles zero revenue', () => {
    const result = transformToWaterfallData(0, makeCostsPct(), makeCostsRub())
    expect(result[0]!.value).toBe(0)
    expect(result[result.length - 1]!.isProfit).toBe(true)
  })
})

// ============================================================================
// calculateWbFeesPct
// ============================================================================

describe('calculateWbFeesPct', () => {
  it('sums all WB fee percentages', () => {
    const costs = makeCostsPct()
    const result = calculateWbFeesPct(costs)
    // 10 + 5 + 2 + 3 + 1 = 21
    expect(result).toBe(21)
  })

  it('handles zero fees', () => {
    const costs = makeCostsPct({
      commission: 0,
      logistics_delivery: 0,
      logistics_return: 0,
      storage: 0,
      paid_acceptance: 0,
    })
    expect(calculateWbFeesPct(costs)).toBe(0)
  })
})

// ============================================================================
// calculateWbFeesRub
// ============================================================================

describe('calculateWbFeesRub', () => {
  it('sums all WB fee RUB amounts', () => {
    const costs = makeCostsRub()
    const result = calculateWbFeesRub(costs)
    // 100 + 50 + 20 + 30 + 10 = 210
    expect(result).toBe(210)
  })

  it('handles zero fees', () => {
    const costs = makeCostsRub({
      commission: 0,
      logistics_delivery: 0,
      logistics_return: 0,
      storage: 0,
      paid_acceptance: 0,
    })
    expect(calculateWbFeesRub(costs)).toBe(0)
  })
})

// ============================================================================
// Barrel re-export smoke tests
// ============================================================================

describe('barrel re-exports', () => {
  it('exports COST_CATEGORIES', () => {
    expect(Array.isArray(COST_CATEGORIES)).toBe(true)
    expect(COST_CATEGORIES.length).toBeGreaterThan(0)
  })

  it('exports getStatusFromMargin', () => {
    expect(typeof getStatusFromMargin).toBe('function')
    const status = getStatusFromMargin(30)
    expect(typeof status).toBe('string')
  })
})
