/**
 * Boundary Normalizer Tests — Buyout Analytics
 *
 * Covers normalizeBySkuBuyoutResponse and normalizeBuyoutSummaryResponse
 * for null input, missing fields, empty arrays, and full shapes.
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeBySkuBuyoutResponse,
  normalizeBuyoutSummaryResponse,
} from '../buyout-analytics-normalizer'

// ---------------------------------------------------------------------------
// normalizeBySkuBuyoutResponse
// ---------------------------------------------------------------------------

describe('normalizeBySkuBuyoutResponse', () => {
  it('maps a full by-sku response to canonical shape', () => {
    const raw = {
      data: [
        {
          nmId: 123,
          supplierArticle: 'ART-1',
          productName: 'Product A',
          brand: 'Brand X',
          category: 'Shoes',
          salesCount: 100,
          returnsCount: 10,
          buyoutRatePct: 90.5,
          returnRatePct: 10.0,
          source: 'blended',
          confidence: 'high',
          trend: 'up',
          trendDelta: 2.5,
          trendPeriod: 'week-1',
          previousBuyoutRatePct: 88.0,
          returnBreakdown: {
            cancelBeforeShipment: 3,
            refusalAtPvz: 4,
            returnAfterReceipt: 3,
            total: 10,
            estimated: false,
          },
        },
      ],
      pagination: { total: 1, limit: 20, offset: 0, hasMore: false },
    }

    const result = normalizeBySkuBuyoutResponse(raw)

    expect(result.data).toHaveLength(1)
    const item = result.data[0]
    expect(item.nmId).toBe(123)
    expect(item.supplierArticle).toBe('ART-1')
    expect(item.salesCount).toBe(100)
    expect(item.buyoutRatePct).toBe(90.5)
    expect(item.source).toBe('blended')
    expect(item.confidence).toBe('high')
    expect(item.trend).toBe('up')
    expect(item.trendDelta).toBe(2.5)
    expect(item.returnBreakdown?.total).toBe(10)
    expect(result.pagination.total).toBe(1)
  })

  it('returns safe defaults for null input', () => {
    const result = normalizeBySkuBuyoutResponse(null)
    expect(result.data).toEqual([])
    expect(result.pagination).toEqual({ total: 0, limit: 0, offset: 0, hasMore: false })
  })

  it('returns safe defaults for undefined input', () => {
    const result = normalizeBySkuBuyoutResponse(undefined)
    expect(result.data).toEqual([])
  })

  it('handles missing fields on items', () => {
    const raw = { data: [{}], pagination: {} }
    const result = normalizeBySkuBuyoutResponse(raw)
    const item = result.data[0]
    expect(item.nmId).toBe(0)
    expect(item.supplierArticle).toBeNull()
    expect(item.productName).toBeNull()
    expect(item.brand).toBeNull()
    expect(item.salesCount).toBe(0)
    expect(item.buyoutRatePct).toBeNull()
    expect(item.returnRatePct).toBeNull()
    expect(item.source).toBe('unknown')
    expect(item.confidence).toBe('low')
    expect(item.trend).toBeUndefined()
  })

  it('handles empty data array', () => {
    const result = normalizeBySkuBuyoutResponse({ data: [], pagination: { total: 0 } })
    expect(result.data).toEqual([])
    expect(result.pagination.total).toBe(0)
  })

  it('handles non-array data as empty', () => {
    const result = normalizeBySkuBuyoutResponse({ data: 'not-array' })
    expect(result.data).toEqual([])
  })

  it('coerces unknown source to "unknown"', () => {
    const raw = { data: [{ source: 'invalid_source' }] }
    const result = normalizeBySkuBuyoutResponse(raw)
    expect(result.data[0].source).toBe('unknown')
  })

  it('handles null money/ratio fields as null (AP#8)', () => {
    const raw = { data: [{ buyoutRatePct: null, returnRatePct: null }] }
    const result = normalizeBySkuBuyoutResponse(raw)
    expect(result.data[0].buyoutRatePct).toBeNull()
    expect(result.data[0].returnRatePct).toBeNull()
  })

  it('accepts snake_case pagination fields', () => {
    const raw = { data: [], pagination: { total: 5, has_more: true } }
    const result = normalizeBySkuBuyoutResponse(raw)
    expect(result.pagination.hasMore).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// normalizeBuyoutSummaryResponse
// ---------------------------------------------------------------------------

describe('normalizeBuyoutSummaryResponse', () => {
  it('maps a full summary response to canonical shape', () => {
    const raw = {
      overallBuyoutRatePct: 85.3,
      overallReturnRatePct: 14.7,
      totalSalesCount: 500,
      totalReturnsCount: 75,
      skuCount: 120,
      topDecliners: [{ nmId: 42, buyoutRatePct: 30.0, trendDelta: -15.2 }],
      period: { from: '2026-W01', to: '2026-W04' },
      source: 'weekly',
      confidence: 'medium',
    }

    const result = normalizeBuyoutSummaryResponse(raw)

    expect(result.overallBuyoutRatePct).toBe(85.3)
    expect(result.totalSalesCount).toBe(500)
    expect(result.skuCount).toBe(120)
    expect(result.topDecliners).toHaveLength(1)
    expect(result.topDecliners![0].nmId).toBe(42)
    expect(result.period.from).toBe('2026-W01')
    expect(result.source).toBe('weekly')
    expect(result.confidence).toBe('medium')
  })

  it('returns safe defaults for null input', () => {
    const result = normalizeBuyoutSummaryResponse(null)
    expect(result.overallBuyoutRatePct).toBeNull()
    expect(result.totalSalesCount).toBe(0)
    expect(result.topDecliners).toEqual([])
    expect(result.period).toEqual({ from: '', to: '' })
    expect(result.source).toBe('unknown')
    expect(result.confidence).toBe('low')
  })

  it('handles null money/ratio fields (AP#8)', () => {
    const raw = { overallBuyoutRatePct: null, overallReturnRatePct: null }
    const result = normalizeBuyoutSummaryResponse(raw)
    expect(result.overallBuyoutRatePct).toBeNull()
    expect(result.overallReturnRatePct).toBeNull()
  })

  it('handles missing optional fields', () => {
    const result = normalizeBuyoutSummaryResponse({})
    expect(result.skuCount).toBe(0)
    expect(result.topDecliners).toEqual([])
  })

  it('handles empty topDecliners array', () => {
    const result = normalizeBuyoutSummaryResponse({ topDecliners: [] })
    expect(result.topDecliners).toEqual([])
  })
})
