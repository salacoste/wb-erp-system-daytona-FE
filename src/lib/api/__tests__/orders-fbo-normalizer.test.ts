/**
 * FBO Orders & Sales Boundary Normalizer Tests
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeFboOrderItem,
  normalizeFboOrderDetail,
  normalizeSaleFboItem,
  normalizeFboOrdersListResponse,
  normalizeFboOrdersAggregateResponse,
  normalizeFboSyncStatusResponse,
  normalizeFboSyncTriggerResponse,
  normalizeFboBackfillResponse,
  normalizeSalesFboListResponse,
  normalizeSalesFboAggregateResponse,
} from '../orders-fbo-normalizer'

// --- normalizeFboOrderItem ---

describe('normalizeFboOrderItem', () => {
  it('normalizes a fully-populated order item', () => {
    const raw = {
      id: 'abc-1',
      orderId: 'ORD-100',
      srid: 'SR-200',
      nmId: 554433,
      supplierArticle: 'ART-001',
      barcode: '4600001',
      brand: 'BrandX',
      subject: 'T-shirt',
      category: 'Apparel',
      totalPrice: 1500,
      discountPercent: 10,
      spp: 5.5,
      finishedPrice: 1350,
      priceWithDisc: 1200,
      warehouseName: 'Warehouse A',
      regionName: 'Moscow',
      orderDate: '2026-01-15',
      isCancel: false,
      createdAt: '2026-01-14T10:00:00Z',
      updatedAt: '2026-01-14T11:00:00Z',
    }
    const result = normalizeFboOrderItem(raw)
    expect(result.id).toBe('abc-1')
    expect(result.orderId).toBe('ORD-100')
    expect(result.nmId).toBe(554433)
    expect(result.totalPrice).toBe(1500)
    expect(result.spp).toBe(5.5)
    expect(result.isCancel).toBe(false)
    expect(result.barcode).toBe('4600001')
    expect(result.regionName).toBe('Moscow')
  })

  it('preserves null for nullable fields per AP#8', () => {
    const raw = { spp: null }
    const result = normalizeFboOrderItem(raw)
    expect(result.spp).toBeNull()
  })

  it('defaults missing fields to safe values', () => {
    const result = normalizeFboOrderItem({})
    expect(result.id).toBe('')
    expect(result.nmId).toBe(0)
    expect(result.totalPrice).toBe(0)
    expect(result.barcode).toBeNull()
    expect(result.regionName).toBeNull()
    expect(result.isCancel).toBe(false)
    expect(result.category).toBeNull()
  })

  it('handles null input', () => {
    const result = normalizeFboOrderItem(null)
    expect(result.id).toBe('')
    expect(result.nmId).toBe(0)
  })
})

// --- normalizeFboOrderDetail ---

describe('normalizeFboOrderDetail', () => {
  it('extends order item with detail fields', () => {
    const raw = {
      id: 'abc-1',
      orderId: 'ORD-100',
      srid: 'SR-200',
      nmId: 554433,
      supplierArticle: 'ART-001',
      barcode: '4600001',
      brand: 'BrandX',
      subject: 'T-shirt',
      category: null,
      totalPrice: 1500,
      discountPercent: 10,
      spp: null,
      finishedPrice: 1350,
      priceWithDisc: 1200,
      warehouseName: 'Warehouse A',
      regionName: 'Moscow',
      orderDate: '2026-01-15',
      isCancel: false,
      createdAt: '2026-01-14T10:00:00Z',
      updatedAt: '2026-01-14T11:00:00Z',
      deliveryDate: '2026-01-20',
      countryName: 'Russia',
    }
    const result = normalizeFboOrderDetail(raw)
    expect(result.orderId).toBe('ORD-100')
    expect(result.deliveryDate).toBe('2026-01-20')
    expect(result.countryName).toBe('Russia')
  })

  it('defaults detail fields to null when missing', () => {
    const result = normalizeFboOrderDetail({})
    expect(result.deliveryDate).toBeNull()
    expect(result.countryName).toBeNull()
  })
})

// --- normalizeSaleFboItem ---

describe('normalizeSaleFboItem', () => {
  it('normalizes a fully-populated sale item', () => {
    const raw = {
      id: 'sale-1',
      srid: 'SR-300',
      odid: 900001,
      nmId: 554433,
      supplierArticle: 'ART-002',
      brand: 'BrandY',
      subject: 'Pants',
      category: 'Clothing',
      finishedPrice: 2000,
      forPay: 1800,
      isStorno: true,
      saleDate: '2026-02-01',
      warehouseName: 'WH-B',
      regionName: 'SPb',
      createdAt: '2026-02-01T12:00:00Z',
    }
    const result = normalizeSaleFboItem(raw)
    expect(result.id).toBe('sale-1')
    expect(result.odid).toBe(900001)
    expect(result.forPay).toBe(1800)
    expect(result.isStorno).toBe(true)
  })

  it('defaults fields on empty input', () => {
    const result = normalizeSaleFboItem({})
    expect(result.id).toBe('')
    expect(result.odid).toBe(0)
    expect(result.isStorno).toBe(false)
    expect(result.category).toBeNull()
  })
})

// --- normalizeFboOrdersListResponse ---

describe('normalizeFboOrdersListResponse', () => {
  it('normalizes response with data array and meta pagination', () => {
    const raw = {
      data: [{ id: '1', orderId: 'O1', nmId: 100 }],
      meta: { total: 50, limit: 20, offset: 0 },
    }
    const result = normalizeFboOrdersListResponse(raw)
    expect(result.items).toHaveLength(1)
    expect(result.items[0].orderId).toBe('O1')
    expect(result.pagination.total).toBe(50)
  })

  it('falls back to items array when data is absent', () => {
    const raw = {
      items: [{ id: '2', orderId: 'O2', nmId: 200 }],
      pagination: { total: 10, limit: 10, offset: 0 },
    }
    const result = normalizeFboOrdersListResponse(raw)
    expect(result.items).toHaveLength(1)
    expect(result.items[0].orderId).toBe('O2')
  })

  it('defaults to empty items when no array present', () => {
    const result = normalizeFboOrdersListResponse({})
    expect(result.items).toEqual([])
    expect(result.pagination.total).toBe(0)
  })
})

// --- normalizeFboOrdersAggregateResponse ---

describe('normalizeFboOrdersAggregateResponse', () => {
  it('normalizes a fully-populated aggregate', () => {
    const raw = {
      count: 100,
      totalPrice: 500000,
      totalFinishedPrice: 450000,
      avgPrice: 4500,
      avgFinishedPrice: 4050,
      cancelledCount: 5,
      cancelRate: 0.05,
      dateRange: { from: '2026-01-01', to: '2026-01-31' },
    }
    const result = normalizeFboOrdersAggregateResponse(raw)
    expect(result.count).toBe(100)
    expect(result.avgPrice).toBe(4500)
    expect(result.cancelRate).toBe(0.05)
    expect(result.dateRange.from).toBe('2026-01-01')
  })

  it('preserves null for nullable ratio fields', () => {
    const raw = { avgPrice: null, cancelRate: null }
    const result = normalizeFboOrdersAggregateResponse(raw)
    expect(result.avgPrice).toBeNull()
    expect(result.cancelRate).toBeNull()
  })

  it('defaults counts to 0 and dateRange to null strings', () => {
    const result = normalizeFboOrdersAggregateResponse({})
    expect(result.count).toBe(0)
    expect(result.dateRange.from).toBeNull()
    expect(result.dateRange.to).toBeNull()
  })
})

// --- normalizeFboSyncStatusResponse ---

describe('normalizeFboSyncStatusResponse', () => {
  it('normalizes sync status', () => {
    const raw = { enabled: true, schedule: '0 */6 * * *', timezone: 'Europe/Moscow' }
    const result = normalizeFboSyncStatusResponse(raw)
    expect(result.enabled).toBe(true)
    expect(result.schedule).toBe('0 */6 * * *')
  })

  it('defaults on empty input', () => {
    const result = normalizeFboSyncStatusResponse({})
    expect(result.enabled).toBe(false)
    expect(result.schedule).toBe('')
  })
})

// --- normalizeFboSyncTriggerResponse ---

describe('normalizeFboSyncTriggerResponse', () => {
  it('normalizes trigger response', () => {
    const raw = { jobId: 'j-123', message: 'Sync started', priority: 'high' }
    const result = normalizeFboSyncTriggerResponse(raw)
    expect(result.jobId).toBe('j-123')
    expect(result.message).toBe('Sync started')
    expect(result.priority).toBe('high')
  })
})

// --- normalizeFboBackfillResponse ---

describe('normalizeFboBackfillResponse', () => {
  it('normalizes backfill response', () => {
    const raw = { jobId: 'j-456', message: 'Backfill queued' }
    const result = normalizeFboBackfillResponse(raw)
    expect(result.jobId).toBe('j-456')
    expect(result.message).toBe('Backfill queued')
  })
})

// --- normalizeSalesFboListResponse ---

describe('normalizeSalesFboListResponse', () => {
  it('normalizes sales list with data array', () => {
    const raw = {
      data: [{ id: 's1', srid: 'SR1', odid: 1, nmId: 10, finishedPrice: 500 }],
      meta: { total: 5, limit: 10, offset: 0 },
    }
    const result = normalizeSalesFboListResponse(raw)
    expect(result.items).toHaveLength(1)
    expect(result.items[0].finishedPrice).toBe(500)
    expect(result.pagination.total).toBe(5)
  })
})

// --- normalizeSalesFboAggregateResponse ---

describe('normalizeSalesFboAggregateResponse', () => {
  it('normalizes a fully-populated aggregate', () => {
    const raw = {
      count: 80,
      totalFinishedPrice: 300000,
      totalForPay: 270000,
      returnsCount: 3,
      returnsRevenue: 15000,
      returnRate: 0.04,
      avgSaleValue: 3375,
      dateRange: { from: '2026-01-01', to: '2026-01-31' },
    }
    const result = normalizeSalesFboAggregateResponse(raw)
    expect(result.count).toBe(80)
    expect(result.returnsRevenue).toBe(15000)
    expect(result.returnRate).toBe(0.04)
    expect(result.avgSaleValue).toBe(3375)
  })

  it('preserves null for nullable ratio fields', () => {
    const raw = { returnsRevenue: null, returnRate: null, avgSaleValue: null }
    const result = normalizeSalesFboAggregateResponse(raw)
    expect(result.returnsRevenue).toBeNull()
    expect(result.returnRate).toBeNull()
    expect(result.avgSaleValue).toBeNull()
  })

  it('defaults counts to 0', () => {
    const result = normalizeSalesFboAggregateResponse({})
    expect(result.count).toBe(0)
    expect(result.returnsCount).toBe(0)
  })
})
