/**
 * Unit Tests for liquidity-item-mapper
 * Epic 7 - Liquidity Analysis
 *
 * Pins the REAL backend liquidation_scenarios object shape
 * {discountPct (fraction), recovery (RUB), daysToClear} and verifies the
 * mapper surfaces recovery → expected_revenue while NOT fabricating
 * zeros/false-loss for backend-omitted fields (Defensive Frontend Principle).
 */

import { describe, it, expect } from 'vitest'
import { mapLiquidationScenarios } from '../liquidity-item-mapper'

describe('mapLiquidationScenarios', () => {
  it('maps the real backend object shape {discountPct, recovery, daysToClear}', () => {
    const backend = {
      full_price: { discountPct: 0, recovery: 312000, daysToClear: 999 },
      discount_20pct: { discountPct: 0.2, recovery: 249600, daysToClear: 999 },
      discount_50pct: { discountPct: 0.5, recovery: 156000, daysToClear: 999 },
    }

    const result = mapLiquidationScenarios(backend)

    expect(result).not.toBeNull()
    expect(result).toHaveLength(3)

    const [full, d20, d50] = result!

    // discountPct fraction → integer percent
    expect(full.suggested_discount_pct).toBe(0)
    expect(d20.suggested_discount_pct).toBe(20)
    expect(d50.suggested_discount_pct).toBe(50)

    // recovery → expected_revenue (THE fix; old mapper gave 0)
    expect(full.expected_revenue).toBe(312000)
    expect(d20.expected_revenue).toBe(249600)
    expect(d50.expected_revenue).toBe(156000)

    // daysToClear → target_days (∞ sentinel 999, not the old default 30)
    expect(full.target_days).toBe(999)
    expect(d20.target_days).toBe(999)
    expect(d50.target_days).toBe(999)

    // Backend-omitted fields → null (UNKNOWN, not fabricated 0/false)
    for (const s of result!) {
      expect(s.new_price).toBeNull()
      expect(s.expected_profit).toBeNull()
      expect(s.is_profitable).toBeNull()
      expect(s.required_velocity).toBeNull()
      expect(s.velocity_multiplier).toBeNull()
    }
  })

  it('returns null for null/undefined input', () => {
    expect(mapLiquidationScenarios(null)).toBeNull()
    expect(mapLiquidationScenarios(undefined)).toBeNull()
  })

  it('passes through an already-array shape unchanged', () => {
    const arr = [
      {
        target_days: 30,
        required_velocity: 2,
        velocity_multiplier: 1.5,
        suggested_discount_pct: 15,
        new_price: 850,
        expected_revenue: 100000,
        expected_profit: 20000,
        is_profitable: true,
      },
    ]
    expect(mapLiquidationScenarios(arr)).toBe(arr)
  })
})
