/**
 * Boundary Normalizer Tests — Fulfillment domain
 *
 * Covers: summary, trends, sync-status, products normalizers
 * for null input, missing fields, empty arrays, full shapes.
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeFulfillmentSummaryResponse,
  normalizeFulfillmentTrendsResponse,
  normalizeFulfillmentSyncStatusResponse,
  normalizeFulfillmentProductsResponse,
} from '../fulfillment-normalizer'

describe('normalizeFulfillmentSummaryResponse', () => {
  it('maps a full response to canonical shape', () => {
    const raw = {
      summary: {
        fbo: {
          ordersCount: 10,
          ordersRevenue: 50000,
          ordersRevenueDiscounted: 45000,
          salesCount: 8,
          salesRevenue: 40000,
          forPayTotal: 35000,
          returnsCount: 2,
          returnsRevenue: 5000,
          returnRate: 0.2,
          avgOrderValue: 5000,
        },
        fbs: {
          ordersCount: 5,
          ordersRevenue: 25000,
          ordersRevenueDiscounted: 22000,
          salesCount: 4,
          salesRevenue: 20000,
          forPayTotal: 18000,
          returnsCount: 1,
          returnsRevenue: 3000,
          returnRate: 0.15,
          avgOrderValue: 5000,
        },
        total: {
          ordersCount: 15,
          ordersRevenue: 75000,
          ordersRevenueDiscounted: 67000,
          fboShare: 66.7,
          fbsShare: 33.3,
        },
      },
      period: { from: '2025-01-01', to: '2025-01-07' },
    }
    const result = normalizeFulfillmentSummaryResponse(raw)
    expect(result.summary.fbo.ordersCount).toBe(10)
    expect(result.summary.total.fboShare).toBe(66.7)
    expect(result.period.from).toBe('2025-01-01')
  })

  it('handles null input', () => {
    const result = normalizeFulfillmentSummaryResponse(null)
    expect(result.summary.fbo.ordersCount).toBe(0)
    expect(result.period.from).toBe('')
  })

  it('handles missing fields', () => {
    const result = normalizeFulfillmentSummaryResponse({})
    // AP#8: money/share ratio fields preserve null (render '—'), not 0.
    expect(result.summary.fbo.salesRevenue).toBeNull()
    expect(result.summary.total.fboShare).toBeNull()
  })
})

describe('normalizeFulfillmentTrendsResponse', () => {
  const fullRaw = {
    trends: [
      {
        date: '2025-01-01',
        fbo: { ordersCount: 5, ordersRevenue: 25000, salesRevenue: 20000, returnsCount: 1 },
        fbs: { ordersCount: 3, ordersRevenue: 15000, salesRevenue: 12000, returnsCount: 0 },
      },
      {
        date: '2025-01-02',
        fbo: { ordersCount: 7, ordersRevenue: 35000, salesRevenue: 28000, returnsCount: 2 },
        fbs: { ordersCount: 4, ordersRevenue: 20000, salesRevenue: 16000, returnsCount: 1 },
      },
    ],
    period: { from: '2025-01-01', to: '2025-01-07', daysIncluded: 7 },
  }

  it('maps full trends response', () => {
    const result = normalizeFulfillmentTrendsResponse(fullRaw)
    expect(result.trends).toHaveLength(2)
    expect(result.trends[0].fbo.ordersCount).toBe(5)
    expect(result.period.daysIncluded).toBe(7)
  })

  it('handles null input with empty trends', () => {
    const result = normalizeFulfillmentTrendsResponse(null)
    expect(result.trends).toHaveLength(0)
    expect(result.period.from).toBe('')
  })

  it('handles missing trends array', () => {
    const result = normalizeFulfillmentTrendsResponse({
      period: { from: '2025-01-01', to: '2025-01-07', daysIncluded: 7 },
    })
    expect(result.trends).toHaveLength(0)
  })
})

describe('normalizeFulfillmentSyncStatusResponse', () => {
  const fullRaw = {
    orders: {
      lastSyncAt: '2025-01-01T12:00:00Z',
      recordsCount: 100,
      dateRange: { from: '2025-01-01', to: '2025-01-07' },
    },
    sales: {
      lastSyncAt: '2025-01-01T11:00:00Z',
      recordsCount: 80,
      dateRange: { from: '2025-01-01', to: '2025-01-07' },
    },
    aggregation: { lastRunAt: '2025-01-01T13:00:00Z', status: 'complete' },
    isDataAvailable: true,
  }

  it('maps full sync status', () => {
    const result = normalizeFulfillmentSyncStatusResponse(fullRaw)
    expect(result.orders?.recordsCount).toBe(100)
    expect(result.sales?.lastSyncAt).toBe('2025-01-01T11:00:00Z')
    expect(result.aggregation?.status).toBe('complete')
    expect(result.isDataAvailable).toBe(true)
  })

  it('handles null input', () => {
    const result = normalizeFulfillmentSyncStatusResponse(null)
    expect(result.orders).toBeNull()
    expect(result.sales).toBeNull()
    expect(result.aggregation).toBeNull()
    expect(result.isDataAvailable).toBe(false)
  })

  it('handles null orders/sales/aggregation', () => {
    const result = normalizeFulfillmentSyncStatusResponse({
      orders: null,
      sales: null,
      aggregation: null,
      isDataAvailable: false,
    })
    expect(result.orders).toBeNull()
    expect(result.sales).toBeNull()
    expect(result.aggregation).toBeNull()
  })
})

describe('normalizeFulfillmentProductsResponse', () => {
  const fullRaw = {
    products: [
      {
        nmId: 12345,
        supplierArticle: 'ART-001',
        category: 'Электроника',
        brand: 'BrandA',
        fbo: { ordersCount: 10, salesRevenue: 50000, returnsCount: 2, returnRate: 0.2 },
        fbs: { ordersCount: 5, salesRevenue: 25000, returnsCount: 1, returnRate: 0.15 },
        recommendation: 'Increase price',
      },
    ],
    total: 1,
    period: { from: '2025-01-01', to: '2025-01-07' },
  }

  it('maps full products response', () => {
    const result = normalizeFulfillmentProductsResponse(fullRaw)
    expect(result.products).toHaveLength(1)
    expect(result.products[0].nmId).toBe(12345)
    expect(result.products[0].recommendation).toBe('Increase price')
    expect(result.total).toBe(1)
  })

  it('handles null input', () => {
    const result = normalizeFulfillmentProductsResponse(null)
    expect(result.products).toHaveLength(0)
    expect(result.total).toBe(0)
    expect(result.period.from).toBe('')
  })

  it('handles missing products array', () => {
    const result = normalizeFulfillmentProductsResponse({
      total: 5,
      period: { from: '2025-01-01', to: '2025-01-07' },
    })
    expect(result.products).toHaveLength(0)
    expect(result.total).toBe(5)
  })
})
