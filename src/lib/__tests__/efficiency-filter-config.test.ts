/**
 * Unit tests for efficiency-filter-config (Story 63.4-FE) — regression coverage added iter-146.
 *
 * Pure config + FILTER_ORDER + the calculateEfficiencyCounts grouping logic (which counts 'unknown'
 * toward total but NOT toward any category) + getEfficiencyFilterConfig null-on-unknown.
 */

import { describe, it, expect } from 'vitest'
import type { EfficiencyStatus } from '@/types/advertising-analytics'
import {
  efficiencyFilterConfig,
  FILTER_ORDER,
  calculateEfficiencyCounts,
  getEfficiencyFilterConfig,
} from '@/lib/efficiency-filter-config'

describe('efficiencyFilterConfig + FILTER_ORDER', () => {
  it('defines the 5 statuses with concrete labels', () => {
    expect(Object.keys(efficiencyFilterConfig).sort()).toEqual(FILTER_ORDER.slice().sort())
    expect(efficiencyFilterConfig.excellent.label).toBe('Отлично')
    expect(efficiencyFilterConfig.excellent.color).toBe('text-green-700')
    expect(efficiencyFilterConfig.loss.label).toBe('Убыток')
  })
  it('FILTER_ORDER is best→worst', () => {
    expect(FILTER_ORDER).toEqual(['excellent', 'good', 'moderate', 'poor', 'loss'])
  })
})

describe('calculateEfficiencyCounts', () => {
  it('returns all-zero counts with total 0 for an empty list', () => {
    expect(calculateEfficiencyCounts([])).toEqual({
      excellent: 0,
      good: 0,
      moderate: 0,
      poor: 0,
      loss: 0,
      total: 0,
    })
  })

  it('groups by status; "unknown" counts toward total but no category', () => {
    const items: { efficiency_status: EfficiencyStatus }[] = [
      { efficiency_status: 'excellent' },
      { efficiency_status: 'excellent' },
      { efficiency_status: 'moderate' },
      { efficiency_status: 'loss' },
      { efficiency_status: 'unknown' },
    ]
    expect(calculateEfficiencyCounts(items)).toEqual({
      excellent: 2,
      good: 0,
      moderate: 1,
      poor: 0,
      loss: 1,
      total: 5, // includes the 'unknown' item
    })
  })
})

describe('getEfficiencyFilterConfig', () => {
  it('returns the config for a known status', () => {
    expect(getEfficiencyFilterConfig('excellent')).toBe(efficiencyFilterConfig.excellent)
  })
  it('returns null for "unknown"', () => {
    expect(getEfficiencyFilterConfig('unknown')).toBeNull()
  })
})
