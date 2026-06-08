/**
 * Supplies Normalizer Tests
 * Tests for normalizeSuppliesListResponse and normalizeSupplyDetailResponse
 * from supplies-normalizer.ts
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeSuppliesListResponse,
  normalizeSupplyDetailResponse,
} from '../supplies-normalizer'

// --- normalizeSuppliesListResponse ---

describe('normalizeSuppliesListResponse', () => {
  it('normalizes a fully-populated supplies list', () => {
    const raw = {
      items: [
        {
          id: 'sup-001',
          name: 'Supply A',
          status: 'active',
          createdAt: '2026-01-10T08:00:00Z',
          closedAt: null,
          ordersCount: 12,
          cargoType: 1,
          isLargeCargo: false,
        },
      ],
      pagination: { total: 50, limit: 20, offset: 0 },
    }
    const result = normalizeSuppliesListResponse(raw)
    expect(result.items).toHaveLength(1)
    expect(result.items[0].id).toBe('sup-001')
    expect(result.items[0].name).toBe('Supply A')
    expect(result.items[0].status).toBe('active')
    expect(result.items[0].createdAt).toBe('2026-01-10T08:00:00Z')
    expect(result.items[0].ordersCount).toBe(12)
  })

  it('handles snake_case item fields', () => {
    const raw = {
      items: [
        {
          supplyId: 'sup-002',
          created_at: '2026-02-01T00:00:00Z',
          closed_at: '2026-02-05T00:00:00Z',
          orders_count: 5,
          cargo_type: 2,
          is_large_cargo: true,
        },
      ],
    }
    const result = normalizeSuppliesListResponse(raw)
    expect(result.items[0].id).toBe('sup-002')
    expect(result.items[0].createdAt).toBe('2026-02-01T00:00:00Z')
    expect(result.items[0].closedAt).toBe('2026-02-05T00:00:00Z')
    expect(result.items[0].ordersCount).toBe(5)
    expect((result.items[0] as unknown as Record<string, unknown>).isLargeCargo).toBe(true)
  })

  it('defaults status to "unknown" when missing', () => {
    const raw = { items: [{}] }
    const result = normalizeSuppliesListResponse(raw)
    expect(result.items[0].status).toBe('unknown')
  })

  it('defaults name to empty string when missing', () => {
    const raw = { items: [{}] }
    expect(normalizeSuppliesListResponse(raw).items[0].name).toBe('')
  })

  it('defaults closedAt to null when missing', () => {
    const raw = { items: [{ id: 'x' }] }
    expect(normalizeSuppliesListResponse(raw).items[0].closedAt).toBeNull()
  })

  it('defaults scanDt to null when missing', () => {
    const raw = { items: [{ id: 'x' }] }
    const item = normalizeSuppliesListResponse(raw).items[0] as unknown as Record<string, unknown>
    expect(item.scanDt).toBeNull()
  })

  it('handles pagination under "meta" key', () => {
    const raw = { items: [], meta: { total: 100, limit: 10, offset: 20 } }
    const result = normalizeSuppliesListResponse(raw)
    expect(result.pagination.total).toBe(100)
    expect(result.pagination.limit).toBe(10)
    expect(result.pagination.offset).toBe(20)
  })

  it('defaults pagination when missing', () => {
    const raw = { items: [] }
    const result = normalizeSuppliesListResponse(raw)
    expect(result.pagination.total).toBe(0)
    expect(result.pagination.limit).toBe(50)
  })

  it('returns empty items for null/undefined raw', () => {
    expect(normalizeSuppliesListResponse(null).items).toEqual([])
    expect(normalizeSuppliesListResponse(undefined).items).toEqual([])
  })
})

// --- normalizeSupplyDetailResponse ---

describe('normalizeSupplyDetailResponse', () => {
  it('normalizes a flat detail response', () => {
    const raw = {
      id: 'sup-100',
      name: 'Big Supply',
      status: 'closed',
      createdAt: '2026-03-01T00:00:00Z',
      orders: [],
      documents: [],
    }
    const result = normalizeSupplyDetailResponse(raw)
    expect(result.id).toBe('sup-100')
    expect(result.name).toBe('Big Supply')
    expect(result.status).toBe('closed')
  })

  it('flattens nested { supply: {...} } structure (iter-68)', () => {
    const raw = {
      supply: {
        id: 'sup-200',
        name: 'Nested Supply',
        status: 'active',
        ordersCount: 5,
      },
      orders: [],
      documents: [],
    }
    const result = normalizeSupplyDetailResponse(raw)
    expect(result.id).toBe('sup-200')
    expect(result.name).toBe('Nested Supply')
    expect(result.ordersCount).toBe(5)
  })

  it('maps backend order "article" to frontend "vendorCode"', () => {
    const raw = {
      id: 'sup-300',
      orders: [{ orderId: 'ord-1', article: 'ART-001', salePrice: 500 }],
      documents: [],
    }
    const result = normalizeSupplyDetailResponse(raw)
    expect(result.orders[0].vendorCode).toBe('ART-001')
  })

  it('prefers vendorCode over article when both present', () => {
    const raw = {
      id: 'sup-301',
      orders: [{ orderId: 'ord-1', vendorCode: 'VC-1', article: 'ART-OLD' }],
      documents: [],
    }
    const result = normalizeSupplyDetailResponse(raw)
    expect(result.orders[0].vendorCode).toBe('VC-1')
  })

  it('sets productName to null when missing (renders "—")', () => {
    const raw = {
      id: 'sup-302',
      orders: [{ orderId: 'ord-1' }],
      documents: [],
    }
    expect(normalizeSupplyDetailResponse(raw).orders[0].productName).toBeNull()
  })

  it('preserves null salePrice when backend sends no price (#205)', () => {
    const raw = {
      id: 'sup-303',
      orders: [{ orderId: 'ord-1', article: 'ART-001' }],
      documents: [],
    }
    expect(normalizeSupplyDetailResponse(raw).orders[0].salePrice).toBeNull()
  })

  it('maps document docType to frontend type', () => {
    const raw = {
      id: 'sup-400',
      orders: [],
      documents: [{ docType: 'act', format: 'pdf', generatedAt: '2026-04-01Z' }],
    }
    const result = normalizeSupplyDetailResponse(raw)
    expect(result.documents[0].type).toBe('act')
  })

  it('maps fileSize to sizeBytes on documents', () => {
    const raw = {
      id: 'sup-401',
      orders: [],
      documents: [{ fileSize: 2048 }],
    }
    const result = normalizeSupplyDetailResponse(raw)
    expect(result.documents[0].sizeBytes).toBe(2048)
  })

  it('defaults sizeBytes to null when missing', () => {
    const raw = {
      id: 'sup-402',
      orders: [],
      documents: [{ type: 'act' }],
    }
    expect(normalizeSupplyDetailResponse(raw).documents[0].sizeBytes).toBeNull()
  })

  it('returns empty orders/documents for null/undefined raw', () => {
    const result = normalizeSupplyDetailResponse(null)
    expect(result.orders).toEqual([])
    expect(result.documents).toEqual([])
  })
})
