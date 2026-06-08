/**
 * Unit Tests for Liquidity Utility Functions (own exports)
 * Covers: getIlliquidSkuCount, getAttentionNeededCount, isFrozenCapitalHealthy,
 *         isHighlyLiquidHealthy, calculatePotentialUnlock, getRecommendedScenario,
 *         formatDiscount, getScenarioUrgencyLabel, getScenarioUrgencyColor
 *
 * Note: Barrel re-exported functions have their own test files:
 * - liquidity-category-config.test.ts
 * - liquidity-action-benchmark.test.ts
 * - liquidity-sort.test.ts
 * - liquidity-formatDiscount.test.ts
 */

import { describe, it, expect } from 'vitest'
import {
  getIlliquidSkuCount,
  getAttentionNeededCount,
  isFrozenCapitalHealthy,
  isHighlyLiquidHealthy,
  calculatePotentialUnlock,
  getRecommendedScenario,
  formatDiscount,
  getScenarioUrgencyLabel,
  getScenarioUrgencyColor,
} from '../liquidity-utils'
import type { LiquiditySummary, LiquidityDistributionItem } from '@/types/liquidity'

/** Build a complete LiquidityDistributionItem for test use */
const distItem = (count: number, pct: number): LiquidityDistributionItem => ({
  count,
  value: count * 100,
  pct,
  avg_turnover_days: 30,
  no_sales_count: 0,
})

// Helper to build a LiquiditySummary
const makeSummary = (overrides: Partial<LiquiditySummary> = {}): LiquiditySummary =>
  ({
    frozen_capital: 10000,
    frozen_capital_pct: 3,
    distribution: {
      highly_liquid: distItem(50, 55),
      medium: distItem(30, 33),
      low: distItem(15, 8),
      illiquid: distItem(5, 4),
    },
    ...overrides,
  }) as LiquiditySummary

// =============================================================================
// getIlliquidSkuCount
// =============================================================================

describe('getIlliquidSkuCount', () => {
  it('returns illiquid count from distribution', () => {
    expect(getIlliquidSkuCount(makeSummary())).toBe(5)
  })

  it('returns 0 when no illiquid SKUs', () => {
    expect(
      getIlliquidSkuCount(
        makeSummary({
          distribution: {
            highly_liquid: distItem(50, 55),
            medium: distItem(30, 33),
            low: distItem(20, 12),
            illiquid: distItem(0, 0),
          },
        })
      )
    ).toBe(0)
  })
})

// =============================================================================
// getAttentionNeededCount
// =============================================================================

describe('getAttentionNeededCount', () => {
  it('sums low + illiquid counts', () => {
    // low=15, illiquid=5 => 20
    expect(getAttentionNeededCount(makeSummary())).toBe(20)
  })

  it('returns 0 when both are zero', () => {
    expect(
      getAttentionNeededCount(
        makeSummary({
          distribution: {
            highly_liquid: distItem(100, 100),
            medium: distItem(0, 0),
            low: distItem(0, 0),
            illiquid: distItem(0, 0),
          },
        })
      )
    ).toBe(0)
  })
})

// =============================================================================
// isFrozenCapitalHealthy
// =============================================================================

describe('isFrozenCapitalHealthy', () => {
  it('returns true when frozen capital < 5%', () => {
    expect(isFrozenCapitalHealthy(makeSummary({ frozen_capital_pct: 3 }))).toBe(true)
  })

  it('returns false when frozen capital >= 5%', () => {
    expect(isFrozenCapitalHealthy(makeSummary({ frozen_capital_pct: 5 }))).toBe(false)
  })

  it('returns false when frozen capital is high', () => {
    expect(isFrozenCapitalHealthy(makeSummary({ frozen_capital_pct: 20 }))).toBe(false)
  })

  it('returns true when frozen capital is 0%', () => {
    expect(isFrozenCapitalHealthy(makeSummary({ frozen_capital_pct: 0 }))).toBe(true)
  })
})

// =============================================================================
// isHighlyLiquidHealthy
// =============================================================================

describe('isHighlyLiquidHealthy', () => {
  it('returns true when highly liquid pct > 50', () => {
    expect(isHighlyLiquidHealthy(makeSummary())).toBe(true) // pct=55
  })

  it('returns false when highly liquid pct <= 50', () => {
    expect(
      isHighlyLiquidHealthy(
        makeSummary({
          distribution: {
            highly_liquid: distItem(50, 50),
            medium: distItem(30, 33),
            low: distItem(15, 8),
            illiquid: distItem(5, 4),
          },
        })
      )
    ).toBe(false)
  })

  it('returns false when highly liquid pct is low', () => {
    expect(
      isHighlyLiquidHealthy(
        makeSummary({
          distribution: {
            highly_liquid: distItem(10, 10),
            medium: distItem(30, 33),
            low: distItem(40, 40),
            illiquid: distItem(20, 17),
          },
        })
      )
    ).toBe(false)
  })
})

// =============================================================================
// calculatePotentialUnlock
// =============================================================================

describe('calculatePotentialUnlock', () => {
  it('calculates potential unlock with default 30% discount', () => {
    // frozen=10000, discount=30% => recovery=70% => 7000
    expect(calculatePotentialUnlock(makeSummary({ frozen_capital: 10000 }))).toBe(7000)
  })

  it('calculates with custom discount', () => {
    // frozen=10000, discount=50% => recovery=50% => 5000
    expect(calculatePotentialUnlock(makeSummary({ frozen_capital: 10000 }), 50)).toBe(5000)
  })

  it('returns full value with 0% discount', () => {
    expect(calculatePotentialUnlock(makeSummary({ frozen_capital: 5000 }), 0)).toBe(5000)
  })

  it('returns 0 for zero frozen capital', () => {
    expect(calculatePotentialUnlock(makeSummary({ frozen_capital: 0 }))).toBe(0)
  })
})

// =============================================================================
// getRecommendedScenario
// =============================================================================

describe('getRecommendedScenario', () => {
  it('returns null for null scenarios', () => {
    expect(getRecommendedScenario(null)).toBeNull()
  })

  it('returns null for empty scenarios', () => {
    expect(getRecommendedScenario([])).toBeNull()
  })

  it('returns null when no profitable scenarios', () => {
    const scenarios = [
      { target_days: 30, suggested_discount_pct: 50, is_profitable: false },
      { target_days: 60, suggested_discount_pct: 30, is_profitable: false },
    ]
    expect(getRecommendedScenario(scenarios)).toBeNull()
  })

  it('prefers balanced scenario (target_days=60) among profitable', () => {
    const scenarios = [
      { target_days: 30, suggested_discount_pct: 40, is_profitable: true },
      { target_days: 60, suggested_discount_pct: 25, is_profitable: true },
      { target_days: 90, suggested_discount_pct: 15, is_profitable: true },
    ]
    const result = getRecommendedScenario(scenarios)
    expect(result).not.toBeNull()
    expect(result!.target_days).toBe(60)
  })

  it('returns lowest discount profitable scenario when no balanced exists', () => {
    const scenarios = [
      { target_days: 30, suggested_discount_pct: 40, is_profitable: true },
      { target_days: 90, suggested_discount_pct: 15, is_profitable: true },
    ]
    const result = getRecommendedScenario(scenarios)
    expect(result).not.toBeNull()
    expect(result!.suggested_discount_pct).toBe(15)
  })

  it('handles is_profitable: null as non-profitable', () => {
    const scenarios = [{ target_days: 60, suggested_discount_pct: 25, is_profitable: null }]
    expect(getRecommendedScenario(scenarios)).toBeNull()
  })
})

// =============================================================================
// formatDiscount
// =============================================================================

describe('formatDiscount', () => {
  it('formats discount with minus prefix', () => {
    const result = formatDiscount(30)
    expect(result).toContain('-')
    expect(result).toContain('30')
    expect(result).toContain('%')
  })

  it('formats zero discount', () => {
    const result = formatDiscount(0)
    expect(result).toContain('0')
  })
})

// =============================================================================
// getScenarioUrgencyLabel
// =============================================================================

describe('getScenarioUrgencyLabel', () => {
  it('returns "Агрессивный" for <= 30 days', () => {
    expect(getScenarioUrgencyLabel(14)).toBe('Агрессивный')
    expect(getScenarioUrgencyLabel(30)).toBe('Агрессивный')
  })

  it('returns "Сбалансированный" for 31-60 days', () => {
    expect(getScenarioUrgencyLabel(45)).toBe('Сбалансированный')
    expect(getScenarioUrgencyLabel(60)).toBe('Сбалансированный')
  })

  it('returns "Консервативный" for > 60 days', () => {
    expect(getScenarioUrgencyLabel(90)).toBe('Консервативный')
    expect(getScenarioUrgencyLabel(120)).toBe('Консервативный')
  })
})

// =============================================================================
// getScenarioUrgencyColor
// =============================================================================

describe('getScenarioUrgencyColor', () => {
  it('returns red for aggressive', () => {
    expect(getScenarioUrgencyColor(30)).toBe('#EF4444')
  })

  it('returns yellow for balanced', () => {
    expect(getScenarioUrgencyColor(60)).toBe('#EAB308')
  })

  it('returns green for conservative', () => {
    expect(getScenarioUrgencyColor(90)).toBe('#22C55E')
  })
})
