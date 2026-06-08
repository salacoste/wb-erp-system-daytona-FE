/**
 * Unit tests for useMarginAnalytics barrel re-exports and helpers
 * Tests the shared helpers exported from margin-analytics-query-keys.ts
 */

import { describe, it, expect } from 'vitest'
import {
  getCurrentIsoWeek,
  formatWeekDisplay,
  buildMarginAnalyticsParams,
  extractItems,
} from '../margin-analytics-query-keys'
import type { MarginAnalyticsFilters } from '../margin-analytics-query-keys'

describe('getCurrentIsoWeek', () => {
  it('returns a string in YYYY-Www format', () => {
    const result = getCurrentIsoWeek()
    expect(result).toMatch(/^\d{4}-W\d{2}$/)
  })
})

describe('formatWeekDisplay', () => {
  it('formats ISO week to Russian display string', () => {
    expect(formatWeekDisplay('2025-W47')).toBe('Неделя 47, 2025')
  })

  it('returns raw string for invalid format', () => {
    expect(formatWeekDisplay('invalid')).toBe('invalid')
  })

  it('handles week 01', () => {
    expect(formatWeekDisplay('2025-W01')).toBe('Неделя 1, 2025')
  })
})

describe('buildMarginAnalyticsParams', () => {
  it('builds params with single week', () => {
    const filters: MarginAnalyticsFilters = { week: '2025-W47' }
    const params = buildMarginAnalyticsParams(filters)

    expect(params.get('week')).toBe('2025-W47')
    expect(params.get('include_cogs')).toBe('true')
  })

  it('builds params with week range', () => {
    const filters: MarginAnalyticsFilters = { weekStart: '2025-W40', weekEnd: '2025-W47' }
    const params = buildMarginAnalyticsParams(filters)

    expect(params.get('weekStart')).toBe('2025-W40')
    expect(params.get('weekEnd')).toBe('2025-W47')
    expect(params.has('week')).toBe(false)
  })

  it('includes compare_to for single comparison', () => {
    const filters: MarginAnalyticsFilters = { week: '2025-W47', compareTo: '2025-W43' }
    const params = buildMarginAnalyticsParams(filters)

    expect(params.get('compare_to')).toBe('2025-W43')
  })

  it('includes compare range params', () => {
    const filters: MarginAnalyticsFilters = {
      week: '2025-W47',
      compareToStart: '2025-W40',
      compareToEnd: '2025-W43',
    }
    const params = buildMarginAnalyticsParams(filters)

    expect(params.get('compare_to_start')).toBe('2025-W40')
    expect(params.get('compare_to_end')).toBe('2025-W43')
  })

  it('includes cursor when provided', () => {
    const filters: MarginAnalyticsFilters = { week: '2025-W47', cursor: 'abc123' }
    const params = buildMarginAnalyticsParams(filters)

    expect(params.get('cursor')).toBe('abc123')
  })

  it('includes limit only when not default (50)', () => {
    const filtersDefault: MarginAnalyticsFilters = { week: '2025-W47' }
    const paramsDefault = buildMarginAnalyticsParams(filtersDefault)
    expect(paramsDefault.has('limit')).toBe(false)

    const filtersCustom: MarginAnalyticsFilters = { week: '2025-W47', limit: 100 }
    const paramsCustom = buildMarginAnalyticsParams(filtersCustom)
    expect(paramsCustom.get('limit')).toBe('100')
  })

  it('defaults include_cogs to true', () => {
    const filters: MarginAnalyticsFilters = { week: '2025-W47' }
    const params = buildMarginAnalyticsParams(filters)
    expect(params.get('include_cogs')).toBe('true')
  })

  it('sets include_cogs to false when specified', () => {
    const filters: MarginAnalyticsFilters = { week: '2025-W47', includeCogs: false }
    const params = buildMarginAnalyticsParams(filters)
    expect(params.get('include_cogs')).toBe('false')
  })
})

describe('extractItems', () => {
  it('extracts items from { items: [...] } shape', () => {
    const response = { items: [{ a: 1 }], meta: { week: 'W47' } }
    const { items, meta } = extractItems(response)
    expect(items).toEqual([{ a: 1 }])
    expect(meta).toEqual({ week: 'W47' })
  })

  it('extracts items from { data: [...] } shape', () => {
    const response = { data: [{ a: 1 }] }
    const { items } = extractItems(response)
    expect(items).toEqual([{ a: 1 }])
  })

  it('handles raw array response', () => {
    const response = [{ a: 1 }, { a: 2 }]
    const { items, meta } = extractItems(response)
    expect(items).toEqual([{ a: 1 }, { a: 2 }])
    expect(meta).toBeUndefined()
  })

  it('returns empty array for empty response', () => {
    const response = { items: [] }
    const { items } = extractItems(response)
    expect(items).toEqual([])
  })
})
