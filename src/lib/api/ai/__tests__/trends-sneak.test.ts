/**
 * AI Trends + Sneak Preview normalizer tests — Story 108.1-FE
 * Covers empty arrays, null field preservation, unknown trend fallback.
 */

import { describe, it, expect } from 'vitest'
import { normalizeAiTrendsResponse, normalizeAiSneakPreviewResponse } from '../trends-sneak'

describe('normalizeAiTrendsResponse', () => {
  it('defaults topSkus to empty array when null', () => {
    expect(normalizeAiTrendsResponse({ topSkus: null }).topSkus).toEqual([])
    expect(normalizeAiTrendsResponse({}).topSkus).toEqual([])
  })

  it('preserves null for nullable money/ratio fields in topSkus', () => {
    const result = normalizeAiTrendsResponse({
      topSkus: [{ nmId: 1 }],
    })
    expect(result.topSkus[0].avgPerDay).toBeNull()
    expect(result.topSkus[0].weeklyVolume).toBeNull()
    expect(result.topSkus[0].vendorCode).toBeNull()
  })

  it('passes through fully populated topSku entries', () => {
    const result = normalizeAiTrendsResponse({
      topSkus: [{ nmId: 12345, vendorCode: 'SKU-A', avgPerDay: 3.5, weeklyVolume: 24 }],
    })
    expect(result.topSkus[0]).toEqual({
      nmId: 12345,
      vendorCode: 'SKU-A',
      avgPerDay: 3.5,
      weeklyVolume: 24,
    })
  })
})

describe('normalizeAiSneakPreviewResponse', () => {
  it('defaults skuForecasts to empty array when null', () => {
    expect(normalizeAiSneakPreviewResponse({ skuForecasts: null }).skuForecasts).toEqual([])
    expect(normalizeAiSneakPreviewResponse({}).skuForecasts).toEqual([])
  })

  it('defaults disclaimer to empty string when missing', () => {
    expect(normalizeAiSneakPreviewResponse({}).disclaimer).toBe('')
  })

  it('passes through disclaimer text', () => {
    const result = normalizeAiSneakPreviewResponse({ disclaimer: 'Low confidence warning' })
    expect(result.disclaimer).toBe('Low confidence warning')
  })

  it('falls back trend to "stable" for unknown values', () => {
    const result = normalizeAiSneakPreviewResponse({
      skuForecasts: [
        { nmId: 1, trend: 'rising' }, // not a valid TrendDirection
        { nmId: 2, trend: null },
        { nmId: 3 }, // missing trend
      ],
    })
    expect(result.skuForecasts[0].trend).toBe('stable')
    expect(result.skuForecasts[1].trend).toBe('stable')
    expect(result.skuForecasts[2].trend).toBe('stable')
  })

  it('passes through valid trend values unchanged', () => {
    const result = normalizeAiSneakPreviewResponse({
      skuForecasts: [
        { nmId: 1, trend: 'up' },
        { nmId: 2, trend: 'stable' },
        { nmId: 3, trend: 'down' },
      ],
    })
    expect(result.skuForecasts[0].trend).toBe('up')
    expect(result.skuForecasts[1].trend).toBe('stable')
    expect(result.skuForecasts[2].trend).toBe('down')
  })

  it('preserves null for estimatedRange bounds when missing', () => {
    const result = normalizeAiSneakPreviewResponse({
      skuForecasts: [{ nmId: 1, trend: 'up', estimatedRange: null }],
    })
    expect(result.skuForecasts[0].estimatedRange).toEqual({ low: null, high: null })
  })

  it('passes through estimatedRange bounds when present', () => {
    const result = normalizeAiSneakPreviewResponse({
      skuForecasts: [{ nmId: 1, trend: 'up', estimatedRange: { low: 18, high: 28 } }],
    })
    expect(result.skuForecasts[0].estimatedRange).toEqual({ low: 18, high: 28 })
  })

  it('preserves null avgPerDay for sneak preview skus', () => {
    const result = normalizeAiSneakPreviewResponse({
      skuForecasts: [{ nmId: 1, trend: 'stable' }],
    })
    expect(result.skuForecasts[0].avgPerDay).toBeNull()
  })
})
