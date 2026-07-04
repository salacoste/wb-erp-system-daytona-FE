/**
 * Orders Boundary Normalizer Tests — Epic 122-FE (#200)
 *
 * Key cases:
 *  - wbStatus/supplierStatus enum validation — unknown values map to fallback
 *  - Null/missing fields handled defensively
 *  - Pagination and query info normalization
 */

import { describe, it, expect } from 'vitest'
import { normalizeOrderItem, normalizeOrdersResponse } from '../orders-normalizer'

describe('normalizeOrderItem', () => {
  const validItem = {
    orderId: '123456',
    orderUid: 'uid-abc',
    nmId: 987654,
    vendorCode: 'VC-001',
    productName: 'Товар',
    price: 1500,
    salePrice: 1200,
    supplierStatus: 'confirm',
    wbStatus: 'sold',
    warehouseId: 123,
    deliveryType: 'fbs',
    isB2B: false,
    cargoType: 'MGT',
    createdAt: '2026-06-01T10:00:00Z',
    statusUpdatedAt: '2026-06-02T10:00:00Z',
  }

  it('passes through valid order item unchanged', () => {
    const result = normalizeOrderItem(validItem)
    expect(result.orderId).toBe('123456')
    expect(result.nmId).toBe(987654)
    expect(result.wbStatus).toBe('sold')
    expect(result.supplierStatus).toBe('confirm')
    expect(result.price).toBe(1500)
  })

  it('maps unknown wbStatus to fallback "waiting"', () => {
    const result = normalizeOrderItem({ ...validItem, wbStatus: 'unknown_status_xyz' })
    expect(result.wbStatus).toBe('waiting')
  })

  it('maps unknown supplierStatus to fallback "new"', () => {
    const result = normalizeOrderItem({ ...validItem, supplierStatus: 'bogus' })
    expect(result.supplierStatus).toBe('new')
  })

  it('handles null productName', () => {
    const result = normalizeOrderItem({ ...validItem, productName: null })
    expect(result.productName).toBeNull()
  })

  it('handles missing fields with safe defaults', () => {
    const result = normalizeOrderItem({})
    expect(result.orderId).toBe('')
    expect(result.nmId).toBe(0)
    expect(result.wbStatus).toBe('waiting')
    expect(result.supplierStatus).toBe('new')
    expect(result.isB2B).toBe(false)
    expect(result.cargoType).toBeNull()
  })

  // --- Story O1: operational status mapping ---

  it('maps id (UUID), operationalStatus, operationalStatusUpdatedAt', () => {
    const result = normalizeOrderItem({
      ...validItem,
      id: '2405776e-4660-4857-ab4f-a56a3134dda9',
      operationalStatus: 'ASSEMBLED',
      operationalStatusUpdatedAt: '2026-07-04T12:00:00Z',
    })
    expect(result.id).toBe('2405776e-4660-4857-ab4f-a56a3134dda9')
    expect(result.operationalStatus).toBe('ASSEMBLED')
    expect(result.operationalStatusUpdatedAt).toBe('2026-07-04T12:00:00Z')
  })

  it('preserves null operationalStatusUpdatedAt (AP#8)', () => {
    const result = normalizeOrderItem({ ...validItem, operationalStatusUpdatedAt: null })
    expect(result.operationalStatusUpdatedAt).toBeNull()
  })

  it('defaults unknown operationalStatus to NEW', () => {
    const result = normalizeOrderItem({ ...validItem, operationalStatus: 'BOGUS' })
    expect(result.operationalStatus).toBe('NEW')
  })

  it('defaults missing operationalStatus to NEW', () => {
    const result = normalizeOrderItem({ ...validItem })
    expect(result.operationalStatus).toBe('NEW')
    expect(result.operationalStatusUpdatedAt).toBeNull()
  })
})

describe('normalizeOrdersResponse', () => {
  it('normalizes full response with items and pagination', () => {
    const raw = {
      items: [
        { orderId: '1', nmId: 100, wbStatus: 'sold', supplierStatus: 'complete' },
        { orderId: '2', nmId: 200, wbStatus: 'waiting', supplierStatus: 'new' },
      ],
      pagination: { total: 50, limit: 20, offset: 0 },
      query: { from: '2026-06-01', to: '2026-06-05' },
    }
    const result = normalizeOrdersResponse(raw)
    expect(result.items).toHaveLength(2)
    expect(result.items[0].orderId).toBe('1')
    expect(result.pagination.total).toBe(50)
    expect(result.query.from).toBe('2026-06-01')
  })

  it('handles empty/missing items array', () => {
    expect(normalizeOrdersResponse({}).items).toEqual([])
    expect(normalizeOrdersResponse({ items: null }).items).toEqual([])
  })

  it('handles missing pagination/query gracefully', () => {
    const result = normalizeOrdersResponse({ items: [] })
    expect(result.pagination).toEqual({ total: 0, limit: 0, offset: 0 })
    expect(result.query).toEqual({ from: null, to: null })
  })
})
