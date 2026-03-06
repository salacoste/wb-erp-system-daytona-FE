/**
 * Tests for Jam tier comparison utility
 * Story 71.3-FE: RequireJam Gating Component
 */

import { describe, it, expect } from 'vitest'
import { JAM_TIER_LEVEL, isJamTierSufficient } from '../cabinet'
import type { JamTier } from '../cabinet'

describe('JAM_TIER_LEVEL', () => {
  it('defines correct numeric levels', () => {
    expect(JAM_TIER_LEVEL.none).toBe(0)
    expect(JAM_TIER_LEVEL.standard).toBe(1)
    expect(JAM_TIER_LEVEL.advanced).toBe(2)
  })

  it('maintains ordering: none < standard < advanced', () => {
    expect(JAM_TIER_LEVEL.none).toBeLessThan(JAM_TIER_LEVEL.standard)
    expect(JAM_TIER_LEVEL.standard).toBeLessThan(JAM_TIER_LEVEL.advanced)
  })
})

describe('isJamTierSufficient', () => {
  // 3x3 matrix: all tier combinations
  const tiers: JamTier[] = ['none', 'standard', 'advanced']

  it.each([
    // userTier, requiredTier, expected
    ['none', 'none', true],
    ['none', 'standard', false],
    ['none', 'advanced', false],
    ['standard', 'none', true],
    ['standard', 'standard', true],
    ['standard', 'advanced', false],
    ['advanced', 'none', true],
    ['advanced', 'standard', true],
    ['advanced', 'advanced', true],
  ] as [JamTier, JamTier, boolean][])(
    'isJamTierSufficient(%s, %s) === %s',
    (userTier, requiredTier, expected) => {
      expect(isJamTierSufficient(userTier, requiredTier)).toBe(expected)
    }
  )

  it('same tier is always sufficient', () => {
    for (const tier of tiers) {
      expect(isJamTierSufficient(tier, tier)).toBe(true)
    }
  })
})
