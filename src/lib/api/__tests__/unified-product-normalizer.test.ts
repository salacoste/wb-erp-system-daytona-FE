/**
 * Tests for Unified Product Analytics Boundary Normalizer — Stories 120.6 + 120.7-FE.
 *
 * Covers: nullability edges, AP#8 coercion, nmId string coercion (AP#10),
 * missing sub-sections, empty arrays, non-string dates, organic-share + iROAS.
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeUnifiedProductResponse,
  normalizeOrganicShareResponse,
  normalizeIncrementalRoasResponse,
} from '@/lib/api/unified-product-normalizer'

const FULL_BACKEND_RESPONSE = {
  nmId: 887604577,
  period: { from: '2026-06-01', to: '2026-06-07' },
  funnel: {
    dates: [
      {
        date: '2026-06-01',
        openCardCount: 1000,
        addToCartCount: 200,
        ordersCount: 50,
        buyoutCount: 45,
        cancelCount: 5,
        cartConversion: 20.0,
        orderConversion: 5.0,
        buyoutConversion: 4.5,
        cancelRate: 0.5,
        totalConversion: 4.5,
      },
    ],
    totals: {
      openCardCount: 5000,
      addToCartCount: 1000,
      ordersCount: 250,
      buyoutCount: 225,
      cancelCount: 25,
      avgCartConversion: 20.0,
      avgOrderConversion: 5.0,
      avgBuyoutConversion: 4.5,
    },
  },
  advertising: {
    dates: [
      {
        date: '2026-06-01',
        views: 300,
        clicks: 30,
        orders: 10,
        spend: 1500.5,
        ctr: 10.0,
        cpc: 50.02,
      },
    ],
    totals: { views: 1800, clicks: 180, orders: 60, spend: 9000, avgCtr: 10.0, avgCpc: 50.0 },
    campaigns: [{ advertId: 1001, views: 300, clicks: 30, orders: 10, spend: 5000 }],
  },
  organic: {
    dates: [{ date: '2026-06-01', organicViews: 700, organicOrders: 40 }],
    totals: { organicViews: 3200, organicOrders: 190 },
  },
  summary: { organicTrafficShare: 64.0, adTrafficShare: 36.0, blendedConversion: 5.0 },
}

describe('normalizeUnifiedProductResponse', () => {
  it('normalizes a full backend response', () => {
    const result = normalizeUnifiedProductResponse(FULL_BACKEND_RESPONSE)
    // AP#10: nmId coerced to string
    expect(result.nmId).toBe('887604577')
    expect(result.period).toEqual({ from: '2026-06-01', to: '2026-06-07' })

    // Funnel
    expect(result.funnel.dates).toHaveLength(1)
    expect(result.funnel.dates[0].openCardCount).toBe(1000)
    expect(result.funnel.dates[0].cartConversion).toBe(20.0)
    expect(result.funnel.totals.ordersCount).toBe(250)

    // Advertising
    expect(result.advertising.dates).toHaveLength(1)
    expect(result.advertising.totals.spend).toBe(9000)
    expect(result.advertising.campaigns).toHaveLength(1)
    expect(result.advertising.campaigns[0].advertId).toBe(1001)

    // Organic
    expect(result.organic.dates).toHaveLength(1)
    expect(result.organic.totals.organicViews).toBe(3200)

    // Summary
    expect(result.summary.organicTrafficShare).toBe(64.0)
  })

  it('coerces null funnel conversions to null (AP#8)', () => {
    const raw = {
      ...FULL_BACKEND_RESPONSE,
      funnel: {
        dates: [
          {
            date: '2026-06-01',
            openCardCount: 0,
            addToCartCount: 0,
            ordersCount: 0,
            buyoutCount: 0,
            cancelCount: 0,
            cartConversion: null,
            orderConversion: null,
            buyoutConversion: null,
            cancelRate: null,
            totalConversion: null,
          },
        ],
        totals: {
          openCardCount: 0,
          addToCartCount: 0,
          ordersCount: 0,
          buyoutCount: 0,
          cancelCount: 0,
          avgCartConversion: null,
          avgOrderConversion: null,
          avgBuyoutConversion: null,
        },
      },
    }
    const result = normalizeUnifiedProductResponse(raw)
    expect(result.funnel.dates[0].cartConversion).toBeNull()
    expect(result.funnel.totals.avgCartConversion).toBeNull()
  })

  it('handles missing sub-sections gracefully (empty arrays + zeroed totals)', () => {
    const result = normalizeUnifiedProductResponse({ nmId: 123 })
    expect(result.nmId).toBe('123')
    expect(result.funnel.dates).toEqual([])
    expect(result.advertising.campaigns).toEqual([])
    expect(result.period).toEqual({ from: '', to: '' })
    // Zeroed totals
    expect(result.funnel.totals.openCardCount).toBe(0)
    expect(result.summary.organicTrafficShare).toBe(0)
  })

  it('handles non-string dates by falling back to empty string', () => {
    const raw = {
      ...FULL_BACKEND_RESPONSE,
      funnel: {
        dates: [
          {
            date: 12345,
            openCardCount: 10,
            addToCartCount: 2,
            ordersCount: 1,
            buyoutCount: 1,
            cancelCount: 0,
          },
        ],
        totals: FULL_BACKEND_RESPONSE.funnel.totals,
      },
    }
    const result = normalizeUnifiedProductResponse(raw)
    expect(result.funnel.dates[0].date).toBe('')
  })
})

// ============================================================
// Organic-Share normalizer tests (Story 120.7)
// ============================================================

describe('normalizeOrganicShareResponse', () => {
  it('normalizes a CorrelationResult[] with campaigns', () => {
    const raw = [
      {
        date: '2026-06-01',
        nmId: 887604577,
        adOrders: 10,
        estimatedAdCart: 25.5,
        organicCart: 40,
        confidence: 'high',
        campaigns: [{ advertId: 1001, adOrders: 5, spend: 3000, estimatedAdCart: 12 }],
      },
    ]
    const result = normalizeOrganicShareResponse(raw)
    expect(result).toHaveLength(1)
    expect(result[0].nmId).toBe('887604577')
    expect(result[0].adOrders).toBe(10)
    expect(result[0].estimatedAdCart).toBe(25.5)
    expect(result[0].confidence).toBe('high')
    expect(result[0].campaigns).toHaveLength(1)
    expect(result[0].campaigns[0].advertId).toBe(1001)
  })

  it('returns empty array for non-array input', () => {
    expect(normalizeOrganicShareResponse(null)).toEqual([])
    expect(normalizeOrganicShareResponse({})).toEqual([])
  })

  it('defaults confidence to "low" for invalid values', () => {
    const raw = [
      { date: '2026-06-01', nmId: 1, adOrders: 0, organicCart: 0, confidence: 'unknown' },
    ]
    const result = normalizeOrganicShareResponse(raw)
    expect(result[0].confidence).toBe('low')
  })

  it('coerces null estimatedAdCart to null (AP#8)', () => {
    const raw = [
      { date: '2026-06-01', nmId: 1, adOrders: 0, organicCart: 0, estimatedAdCart: null },
    ]
    const result = normalizeOrganicShareResponse(raw)
    expect(result[0].estimatedAdCart).toBeNull()
  })
})

// ============================================================
// Incremental ROAS normalizer tests (Story 120.7)
// ============================================================

describe('normalizeIncrementalRoasResponse', () => {
  it('normalizes a full IncrementalRoasResult', () => {
    const raw = {
      nmId: 887604577,
      period: { from: '2026-06-01', to: '2026-06-07' },
      totalRevenue: 150000,
      estimatedOrganicRevenue: 90000,
      adSpend: 30000,
      incrementalRevenue: 60000,
      iROAS: 2.0,
      interpretation: 'effective',
      organicCannibalizationPct: 60.0,
      totalOrders: 500,
      estimatedOrganicOrders: 300,
    }
    const result = normalizeIncrementalRoasResponse(raw)
    expect(result.nmId).toBe('887604577')
    expect(result.iROAS).toBe(2.0)
    expect(result.interpretation).toBe('effective')
    expect(result.organicCannibalizationPct).toBe(60.0)
    expect(result.totalOrders).toBe(500)
  })

  it('handles null iROAS + interpretation when adSpend is 0', () => {
    const raw = {
      nmId: 1,
      period: { from: '2026-06-01', to: '2026-06-07' },
      totalRevenue: 0,
      estimatedOrganicRevenue: 0,
      adSpend: 0,
      incrementalRevenue: 0,
      iROAS: null,
      interpretation: null,
      organicCannibalizationPct: null,
      totalOrders: 0,
      estimatedOrganicOrders: 0,
    }
    const result = normalizeIncrementalRoasResponse(raw)
    expect(result.iROAS).toBeNull()
    expect(result.interpretation).toBeNull()
    expect(result.organicCannibalizationPct).toBeNull()
  })

  it('defaults invalid interpretation to null', () => {
    const raw = {
      nmId: 1,
      period: { from: '', to: '' },
      totalRevenue: 0,
      estimatedOrganicRevenue: 0,
      adSpend: 0,
      incrementalRevenue: 0,
      iROAS: null,
      interpretation: 'great',
      organicCannibalizationPct: null,
      totalOrders: 0,
      estimatedOrganicOrders: 0,
    }
    const result = normalizeIncrementalRoasResponse(raw)
    expect(result.interpretation).toBeNull()
  })
})
