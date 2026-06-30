/**
 * Tests for margin-analytics-query-keys.ts
 * Pure-function coverage: getCurrentIsoWeek, formatWeekDisplay, buildMarginAnalyticsParams, extractItems
 */

import { describe, it, expect } from 'vitest'
import {
  getCurrentIsoWeek,
  formatWeekDisplay,
  buildMarginAnalyticsParams,
  extractItems,
  MARGIN_ANALYTICS_QUERY_CONFIG,
} from '../margin-analytics-query-keys'

// ---------------------------------------------------------------------------
// getCurrentIsoWeek
// ---------------------------------------------------------------------------

describe('getCurrentIsoWeek', () => {
  it('returns string in YYYY-Www format', () => {
    const result = getCurrentIsoWeek()
    expect(result).toMatch(/^\d{4}-W\d{2}$/)
  })

  it('week number is between 01 and 53', () => {
    const result = getCurrentIsoWeek()
    const weekNum = parseInt(result.split('-W')[1], 10)
    expect(weekNum).toBeGreaterThanOrEqual(1)
    expect(weekNum).toBeLessThanOrEqual(53)
  })
})

// ---------------------------------------------------------------------------
// formatWeekDisplay
// ---------------------------------------------------------------------------

describe('formatWeekDisplay', () => {
  it('formats valid ISO week string', () => {
    expect(formatWeekDisplay('2025-W47')).toBe('Неделя 47, 2025')
  })

  it('formats week 01 correctly', () => {
    expect(formatWeekDisplay('2026-W01')).toBe('Неделя 1, 2026')
  })

  it('returns raw string for invalid format', () => {
    expect(formatWeekDisplay('not-a-week')).toBe('not-a-week')
  })

  it('returns raw string for partial match', () => {
    expect(formatWeekDisplay('2025-W')).toBe('2025-W')
  })
})

// ---------------------------------------------------------------------------
// buildMarginAnalyticsParams
// ---------------------------------------------------------------------------

describe('buildMarginAnalyticsParams', () => {
  it('builds single week params', () => {
    const params = buildMarginAnalyticsParams({ week: '2025-W47' })
    expect(params.get('week')).toBe('2025-W47')
    expect(params.get('include_cogs')).toBe('true')
  })

  it('builds range params when weekStart and weekEnd provided', () => {
    const params = buildMarginAnalyticsParams({ weekStart: '2025-W45', weekEnd: '2025-W47' })
    expect(params.get('weekStart')).toBe('2025-W45')
    expect(params.get('weekEnd')).toBe('2025-W47')
    expect(params.has('week')).toBe(false)
  })

  it('prefers range over single week when both provided', () => {
    const params = buildMarginAnalyticsParams({
      week: '2025-W47',
      weekStart: '2025-W45',
      weekEnd: '2025-W47',
    })
    expect(params.has('week')).toBe(false)
    expect(params.get('weekStart')).toBe('2025-W45')
  })

  it('adds cursor param when provided', () => {
    const params = buildMarginAnalyticsParams({ week: '2025-W47', cursor: 'abc123' })
    expect(params.get('cursor')).toBe('abc123')
  })

  it('omits limit when default (50)', () => {
    const params = buildMarginAnalyticsParams({ week: '2025-W47', limit: 50 })
    expect(params.has('limit')).toBe(false)
  })

  it('adds limit when non-default', () => {
    const params = buildMarginAnalyticsParams({ week: '2025-W47', limit: 100 })
    expect(params.get('limit')).toBe('100')
  })

  it('adds compare_to for single comparison', () => {
    const params = buildMarginAnalyticsParams({ week: '2025-W47', compareTo: '2025-W43' })
    expect(params.get('compare_to')).toBe('2025-W43')
  })

  it('adds compare range params', () => {
    const params = buildMarginAnalyticsParams({
      week: '2025-W47',
      compareToStart: '2025-W43',
      compareToEnd: '2025-W45',
    })
    expect(params.get('compare_to_start')).toBe('2025-W43')
    expect(params.get('compare_to_end')).toBe('2025-W45')
  })

  it('defaults include_cogs to true', () => {
    const params = buildMarginAnalyticsParams({ week: '2025-W47' })
    expect(params.get('include_cogs')).toBe('true')
  })

  it('sets include_cogs to false when explicitly false', () => {
    const params = buildMarginAnalyticsParams({ week: '2025-W47', includeCogs: false })
    expect(params.get('include_cogs')).toBe('false')
  })

  it('defaults FR-2 and FR-4 opt-in flags to true for contract #219 fields', () => {
    const params = buildMarginAnalyticsParams({ week: '2026-W26' })
    expect(params.get('include_ads')).toBe('true')
    expect(params.get('include_stock')).toBe('true')
  })

  it('allows explicitly disabling FR opt-in flags', () => {
    const params = buildMarginAnalyticsParams({
      week: '2026-W26',
      includeAds: false,
      includeStock: false,
    })
    expect(params.get('include_ads')).toBe('false')
    expect(params.get('include_stock')).toBe('false')
  })
})

// ---------------------------------------------------------------------------
// extractItems
// ---------------------------------------------------------------------------

describe('extractItems', () => {
  it('extracts from array response', () => {
    const response = [{ id: 1 }, { id: 2 }]
    const { items, meta } = extractItems(response)
    expect(items).toEqual(response)
    expect(meta).toBeUndefined()
  })

  it('extracts from object with items field', () => {
    const response = { items: [{ id: 1 }], meta: { total: 1 } }
    const { items, meta } = extractItems(response)
    expect(items).toEqual([{ id: 1 }])
    expect(meta).toEqual({ total: 1 })
  })

  it('extracts from object with data field as fallback', () => {
    const response = { data: [{ id: 1 }], meta: { total: 1 } }
    const { items, meta } = extractItems(response)
    expect(items).toEqual([{ id: 1 }])
    expect(meta).toEqual({ total: 1 })
  })

  it('returns empty array for empty object', () => {
    const { items } = extractItems({})
    expect(items).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// MARGIN_ANALYTICS_QUERY_CONFIG
// ---------------------------------------------------------------------------

describe('MARGIN_ANALYTICS_QUERY_CONFIG', () => {
  it('has expected config values', () => {
    expect(MARGIN_ANALYTICS_QUERY_CONFIG.staleTime).toBe(30000)
    expect(MARGIN_ANALYTICS_QUERY_CONFIG.gcTime).toBe(300000)
    expect(MARGIN_ANALYTICS_QUERY_CONFIG.retry).toBe(1)
    expect(MARGIN_ANALYTICS_QUERY_CONFIG.refetchOnWindowFocus).toBe(true)
  })
})
