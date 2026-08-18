/**
 * Tests for margin-trend-utils
 * Pure utility functions for MarginTrendChart.
 */

import { describe, it, expect } from 'vitest'
import {
  formatDateRange,
  formatWeekLabel,
  formatMarginAxis,
  calculateYDomain,
  getMarginDotColor,
} from '../margin-trend-utils'

describe('formatDateRange', () => {
  it('formats a date range as "DD.MM - DD.MM"', () => {
    const result = formatDateRange('2025-03-10', '2025-03-16')
    expect(result).toBe('10.03 - 16.03')
  })

  it('zero-pads single-digit days and months', () => {
    const result = formatDateRange('2025-01-05', '2025-01-11')
    expect(result).toBe('05.01 - 11.01')
  })

  it('handles dates spanning month boundary', () => {
    const result = formatDateRange('2025-02-24', '2025-03-02')
    expect(result).toBe('24.02 - 02.03')
  })

  it('handles year boundary dates', () => {
    const result = formatDateRange('2024-12-30', '2025-01-05')
    expect(result).toBe('30.12 - 05.01')
  })
})

describe('formatWeekLabel', () => {
  it('strips year prefix from ISO week', () => {
    expect(formatWeekLabel('2025-W47')).toBe('W47')
  })

  it('works with single-digit week numbers', () => {
    expect(formatWeekLabel('2025-W05')).toBe('W05')
  })

  it('works with week 52', () => {
    expect(formatWeekLabel('2025-W52')).toBe('W52')
  })
})

describe('formatMarginAxis', () => {
  it('formats integer percentage with no decimals', () => {
    expect(formatMarginAxis(15)).toBe('15%')
  })

  it('truncates decimal values to whole percent', () => {
    expect(formatMarginAxis(15.7)).toBe('16%')
  })

  it('handles zero', () => {
    expect(formatMarginAxis(0)).toBe('0%')
  })

  it('handles negative values', () => {
    expect(formatMarginAxis(-5)).toBe('-5%')
  })
})

describe('calculateYDomain', () => {
  it('returns calculated domain when data has margin values', () => {
    const data = [{ margin_pct: 10 }, { margin_pct: 30 }, { margin_pct: 20 }]
    const result = calculateYDomain(data)
    expect(result.hasMarginData).toBe(true)
    expect(result.minMargin).toBe(10)
    expect(result.maxMargin).toBe(30)
    expect(result.marginValues).toEqual([10, 30, 20])
    // Domain should have padding around [10, 30]
    expect(result.yDomain[0]).toBeLessThan(10)
    expect(result.yDomain[1]).toBeGreaterThan(30)
  })

  it('returns defaults when all margin values are null', () => {
    const data = [{ margin_pct: null }, { margin_pct: null }]
    const result = calculateYDomain(data)
    expect(result.hasMarginData).toBe(false)
    expect(result.minMargin).toBe(-10)
    expect(result.maxMargin).toBe(50)
    expect(result.marginValues).toEqual([])
  })

  it('returns defaults for empty data array', () => {
    const result = calculateYDomain([])
    expect(result.hasMarginData).toBe(false)
    expect(result.minMargin).toBe(-10)
    expect(result.maxMargin).toBe(50)
  })

  it('filters out undefined values', () => {
    const data = [
      { margin_pct: 15 },
      { margin_pct: undefined as unknown as number },
      { margin_pct: 25 },
    ]
    const result = calculateYDomain(data)
    expect(result.hasMarginData).toBe(true)
    expect(result.marginValues).toEqual([15, 25])
  })

  it('handles single data point (zero padding, domain equals value)', () => {
    const data = [{ margin_pct: 42 }]
    const result = calculateYDomain(data)
    expect(result.minMargin).toBe(42)
    expect(result.maxMargin).toBe(42)
    // When min == max, padding = 0, so domain collapses to [42, 42]
    expect(result.yDomain).toEqual([42, 42])
  })

  it('handles negative margin values', () => {
    const data = [{ margin_pct: -5 }, { margin_pct: 10 }]
    const result = calculateYDomain(data)
    expect(result.minMargin).toBe(-5)
    expect(result.maxMargin).toBe(10)
    expect(result.yDomain[0]).toBeLessThan(-5)
  })
})

describe('getMarginDotColor', () => {
  // 168.10: semantic chart tokens — pin exact var() names (not RGB), precedent 168.1
  it('returns chart-positive token for positive margin', () => {
    expect(getMarginDotColor(5)).toBe('var(--color-chart-positive)')
    expect(getMarginDotColor(0.01)).toBe('var(--color-chart-positive)')
  })

  it('returns chart-negative token for negative margin', () => {
    expect(getMarginDotColor(-1)).toBe('var(--color-chart-negative)')
    expect(getMarginDotColor(-99.9)).toBe('var(--color-chart-negative)')
  })

  it('returns chart-reference token for exactly zero', () => {
    expect(getMarginDotColor(0)).toBe('var(--color-chart-reference)')
  })
})
