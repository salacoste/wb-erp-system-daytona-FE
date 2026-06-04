/**
 * Unit tests for seasonal-labels (Story 51.6-FE) — regression coverage added iter-132.
 *
 * Pure label maps + lookups (no imports/IO). Tests pin the translations, the distinct fallback
 * semantics (translateMonth/Day → passthrough unknown; getQuarterRange → empty), the seasonality
 * color thresholds (0.7 / 0.4 boundaries), and map completeness.
 */

import { describe, it, expect } from 'vitest'
import {
  MONTH_FULL_LABELS,
  DAY_FULL_LABELS,
  QUARTER_RANGES,
  translateMonth,
  translateDay,
  getQuarterRange,
  getSeasonalityColor,
} from '@/lib/seasonal-labels'

describe('translateMonth', () => {
  it('translates known English months to Russian', () => {
    expect(translateMonth('January')).toBe('Январь')
    expect(translateMonth('December')).toBe('Декабрь')
  })
  it('passes through an unknown month unchanged (?? key)', () => {
    expect(translateMonth('Foo')).toBe('Foo')
  })
})

describe('translateDay', () => {
  it('translates known English days to Russian', () => {
    expect(translateDay('Monday')).toBe('Понедельник')
    expect(translateDay('Sunday')).toBe('Воскресенье')
  })
  it('passes through an unknown day unchanged (?? key)', () => {
    expect(translateDay('Funday')).toBe('Funday')
  })
})

describe('getQuarterRange', () => {
  it('returns the month range for known quarters', () => {
    expect(getQuarterRange('Q1')).toBe('Янв - Мар')
    expect(getQuarterRange('Q4')).toBe('Окт - Дек')
  })
  it('returns an empty string for an unknown quarter (?? "")', () => {
    expect(getQuarterRange('Q5')).toBe('')
  })
})

describe('getSeasonalityColor', () => {
  it('is red at/above the 0.7 high threshold', () => {
    expect(getSeasonalityColor(0.7)).toBe('text-red-600')
    expect(getSeasonalityColor(0.95)).toBe('text-red-600')
  })
  it('is yellow in [0.4, 0.7)', () => {
    expect(getSeasonalityColor(0.69)).toBe('text-yellow-600')
    expect(getSeasonalityColor(0.4)).toBe('text-yellow-600')
  })
  it('is green below 0.4', () => {
    expect(getSeasonalityColor(0.39)).toBe('text-green-600')
    expect(getSeasonalityColor(0)).toBe('text-green-600')
  })
})

describe('label map completeness', () => {
  it('has 12 months, 7 days, 4 quarters', () => {
    expect(Object.keys(MONTH_FULL_LABELS)).toHaveLength(12)
    expect(Object.keys(DAY_FULL_LABELS)).toHaveLength(7)
    expect(Object.keys(QUARTER_RANGES)).toEqual(['Q1', 'Q2', 'Q3', 'Q4'])
  })
})
