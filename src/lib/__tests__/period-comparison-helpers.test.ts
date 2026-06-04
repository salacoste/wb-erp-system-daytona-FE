/**
 * Unit tests for period-comparison-helpers (Story 63.11-FE) — coverage added iter-160.
 *
 * WoW/MoM comparison-period calc + label formatting (date-fns + iso-week backed). WoW is asserted
 * exactly (prev week node-verified); MoM by structure (range strings) to stay robust; labels
 * node-verified (W01 2026 Thursday → January 'Янв'). Imported explicitly — formatPeriodLabel collides
 * by name with DateRangePicker's own (different) function.
 */

import { describe, it, expect } from 'vitest'
import {
  getComparisonPeriods,
  formatPeriodLabel,
  COMPARISON_MODE_STORAGE_KEY,
} from '@/lib/period-comparison-helpers'

describe('getComparisonPeriods', () => {
  it('WoW: period1 = current week, period2 = previous week', () => {
    expect(getComparisonPeriods('2026-W10', 'wow')).toEqual({
      period1: '2026-W10',
      period2: '2026-W09',
    })
  })

  it('MoM: produces two distinct range strings', () => {
    const { period1, period2 } = getComparisonPeriods('2026-W10', 'mom')
    expect(period1).toContain(':')
    expect(period2).toContain(':')
    expect(period1).not.toBe(period2)
  })
})

describe('formatPeriodLabel', () => {
  it('formats a single week as "Www"', () => {
    expect(formatPeriodLabel('2026-W05')).toBe('W05')
  })
  it('formats a range as the Russian month of its first week (node-verified)', () => {
    // '2026-W01:W05' → first week W01, Thursday in January → 'Янв'
    expect(formatPeriodLabel('2026-W01:W05')).toBe('Янв')
  })
})

describe('COMPARISON_MODE_STORAGE_KEY', () => {
  it('is the documented localStorage key', () => {
    expect(COMPARISON_MODE_STORAGE_KEY).toBe('comparisonMode')
  })
})
