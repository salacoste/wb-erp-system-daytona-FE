/**
 * Unit tests for seasonal-localization (Story 51.6-FE) — regression coverage added iter-134.
 *
 * Pure localization maps + lookups + chart-color logic (no imports/IO). Covers known→Russian,
 * the distinct fallbacks (full → passthrough; short → slice(0,3)/slice(0,2)), formatPeakHour
 * zero-padding, and the bar/heatmap color thresholds (asserted via the SEASONAL_COLORS constant).
 */

import { describe, it, expect } from 'vitest'
import {
  MONTH_NAMES_RU,
  MONTH_SHORT_RU,
  WEEKDAY_NAMES_RU,
  WEEKDAY_SHORT_RU,
  SEASONAL_COLORS,
  localizeMonth,
  localizeMonthShort,
  localizeWeekday,
  localizeWeekdayShort,
  formatPeakHour,
  getBarColor,
  getHeatmapColor,
} from '@/lib/seasonal-localization'

describe('month/weekday localization', () => {
  it('localizes known full month/weekday to Russian', () => {
    expect(localizeMonth('January')).toBe('Январь')
    expect(localizeWeekday('Monday')).toBe('Понедельник')
  })

  it('localizes known short month/weekday to Russian', () => {
    expect(localizeMonthShort('January')).toBe('Янв')
    expect(localizeWeekdayShort('Monday')).toBe('Пн')
  })

  it('falls back to passthrough for unknown FULL names', () => {
    expect(localizeMonth('Foo')).toBe('Foo')
    expect(localizeWeekday('Funday')).toBe('Funday')
  })

  it('falls back to a slice for unknown SHORT names (3 for month, 2 for weekday)', () => {
    expect(localizeMonthShort('Foobar')).toBe('Foo')
    expect(localizeWeekdayShort('Foobar')).toBe('Fo')
  })
})

describe('formatPeakHour', () => {
  it('zero-pads to a 2-digit 24h time', () => {
    expect(formatPeakHour(9)).toBe('09:00')
    expect(formatPeakHour(14)).toBe('14:00')
    expect(formatPeakHour(0)).toBe('00:00')
    expect(formatPeakHour(23)).toBe('23:00')
  })
})

describe('getBarColor', () => {
  it('returns peak color for the peak value, low color for the low value, else default', () => {
    expect(getBarColor('July', 'July')).toBe(SEASONAL_COLORS.bar.peak)
    expect(getBarColor('January', 'July', 'January')).toBe(SEASONAL_COLORS.bar.low)
    expect(getBarColor('March', 'July', 'January')).toBe(SEASONAL_COLORS.bar.default)
  })

  it('ignores the low branch when lowValue is omitted', () => {
    expect(getBarColor('January', 'July')).toBe(SEASONAL_COLORS.bar.default)
  })
})

describe('getHeatmapColor', () => {
  it('returns low when maxValue is 0 (avoids divide-by-zero)', () => {
    expect(getHeatmapColor(5, 0)).toBe(SEASONAL_COLORS.heatmap.low)
  })

  it('maps the intensity ratio to gradient buckets (0.9 / 0.6 / 0.3 boundaries)', () => {
    expect(getHeatmapColor(9, 10)).toBe(SEASONAL_COLORS.heatmap.peak) // 0.9
    expect(getHeatmapColor(6, 10)).toBe(SEASONAL_COLORS.heatmap.high) // 0.6
    expect(getHeatmapColor(3, 10)).toBe(SEASONAL_COLORS.heatmap.medium) // 0.3
    expect(getHeatmapColor(2.9, 10)).toBe(SEASONAL_COLORS.heatmap.low) // <0.3
  })
})

describe('map completeness', () => {
  it('has 12 months (full + short) and 7 weekdays (full + short)', () => {
    expect(Object.keys(MONTH_NAMES_RU)).toHaveLength(12)
    expect(Object.keys(MONTH_SHORT_RU)).toHaveLength(12)
    expect(Object.keys(WEEKDAY_NAMES_RU)).toHaveLength(7)
    expect(Object.keys(WEEKDAY_SHORT_RU)).toHaveLength(7)
  })
})
