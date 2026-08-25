/**
 * brand-share-chart-config tests — Story 170.4 token pins.
 * Categorical chart-1/2/3 mapping (price/qty/rating), labels, date formatters.
 */
import { describe, it, expect } from 'vitest'
import {
  BRAND_SHARE_COLORS,
  BRAND_SHARE_LABELS,
  formatBrandShareAxisDate,
  formatBrandShareTooltipDate,
} from '../brand-share-chart-config'

describe('BRAND_SHARE_COLORS', () => {
  it('maps categorical series to chart-1/2/3 tokens (no hex)', () => {
    expect(BRAND_SHARE_COLORS.pricePercent).toBe('var(--color-chart-1)')
    expect(BRAND_SHARE_COLORS.qtyPercent).toBe('var(--color-chart-2)')
    expect(BRAND_SHARE_COLORS.brandRating).toBe('var(--color-chart-3)')
  })

  it('labels all three metrics in RU', () => {
    expect(BRAND_SHARE_LABELS.brandRating).toBe('Рейтинг бренда')
    expect(BRAND_SHARE_LABELS.pricePercent).toBe('Доля по цене')
    expect(BRAND_SHARE_LABELS.qtyPercent).toBe('Доля по количеству')
  })
})

describe('formatBrandShareAxisDate', () => {
  it('formats ISO applyDate as DD.MM', () => {
    expect(formatBrandShareAxisDate('2026-07-05T00:00:00+03:00')).toBe('05.07')
  })
  it('returns the input unchanged for invalid dates', () => {
    expect(formatBrandShareAxisDate('not-a-date')).toBe('not-a-date')
  })
})

describe('formatBrandShareTooltipDate', () => {
  it('formats a full RU locale date', () => {
    expect(formatBrandShareTooltipDate('2026-07-05T00:00:00+03:00')).toMatch(/2026/)
  })
  it('returns the input unchanged for invalid dates', () => {
    expect(formatBrandShareTooltipDate('nope')).toBe('nope')
  })
})
