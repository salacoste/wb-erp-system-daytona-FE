/**
 * Order Detail Boundary Normalizer Tests
 */

import { describe, it, expect } from 'vitest'
import { normalizeOrderDetail } from '../orders-detail-normalizer'

describe('normalizeOrderDetail', () => {
  it('normalizes a fully-populated order detail', () => {
    const raw = {
      orderId: 'ORD-100',
      orderUid: 'uid-abc',
      nmId: 554433,
      vendorCode: 'VC-001',
      productName: 'T-shirt',
      price: 1500,
      salePrice: 1350,
      supplierStatus: 'confirmed',
      wbStatus: 'sold',
      warehouseId: 50,
      deliveryType: 'courier',
      isB2B: false,
      cargoType: 'normal',
      createdAt: '2026-01-15T10:00:00Z',
      statusUpdatedAt: '2026-01-15T11:00:00Z',
      chrtId: 12345,
      address: {
        fullAddress: 'Moscow, Tverskaya 1',
        longitude: 37.6,
        latitude: 55.75,
      },
      statusHistory: [
        {
          supplierStatus: 'new',
          wbStatus: 'waiting',
          changedAt: '2026-01-15T10:00:00Z',
        },
        {
          supplierStatus: 'confirmed',
          wbStatus: 'sold',
          changedAt: '2026-01-15T11:00:00Z',
        },
      ],
      processingTimeSeconds: 3600,
      syncedAt: '2026-01-15T12:00:00Z',
    }
    const result = normalizeOrderDetail(raw)
    expect(result.orderId).toBe('ORD-100')
    expect(result.orderUid).toBe('uid-abc')
    expect(result.nmId).toBe(554433)
    expect(result.vendorCode).toBe('VC-001')
    expect(result.productName).toBe('T-shirt')
    expect(result.price).toBe(1500)
    expect(result.salePrice).toBe(1350)
    expect(result.supplierStatus).toBe('confirmed')
    expect(result.wbStatus).toBe('sold')
    expect(result.warehouseId).toBe(50)
    expect(result.deliveryType).toBe('courier')
    expect(result.isB2B).toBe(false)
    expect(result.cargoType).toBe('normal')
    expect(result.chrtId).toBe(12345)
    expect(result.address).not.toBeNull()
    expect(result.address!.fullAddress).toBe('Moscow, Tverskaya 1')
    expect(result.address!.longitude).toBe(37.6)
    expect(result.address!.latitude).toBe(55.75)
    expect(result.statusHistory).toHaveLength(2)
    expect(result.statusHistory[0].supplierStatus).toBe('new')
    expect(result.statusHistory[1].wbStatus).toBe('sold')
    expect(result.processingTimeSeconds).toBe(3600)
    expect(result.syncedAt).toBe('2026-01-15T12:00:00Z')
  })

  it('handles snake_case field aliases', () => {
    const raw = {
      order_id: 'ORD-200',
      order_uid: 'uid-def',
      nm_id: 100,
      vendor_code: 'VC-002',
      product_name: 'Shoes',
      sale_price: 2000,
      supplier_status: 'shipped',
      wb_status: 'delivered',
      warehouse_id: 60,
      delivery_type: 'pickup',
      is_b2b: true,
      cargo_type: 'oversize',
      created_at: '2026-02-01',
      status_updated_at: '2026-02-02',
      chrt_id: 99999,
      processing_time_seconds: 7200,
      synced_at: '2026-02-03',
    }
    const result = normalizeOrderDetail(raw)
    expect(result.orderId).toBe('ORD-200')
    expect(result.orderUid).toBe('uid-def')
    expect(result.nmId).toBe(100)
    expect(result.vendorCode).toBe('VC-002')
    expect(result.productName).toBe('Shoes')
    expect(result.salePrice).toBe(2000)
    expect(result.supplierStatus).toBe('shipped')
    expect(result.wbStatus).toBe('delivered')
    expect(result.warehouseId).toBe(60)
    expect(result.deliveryType).toBe('pickup')
    expect(result.isB2B).toBe(true)
    expect(result.cargoType).toBe('oversize')
    expect(result.chrtId).toBe(99999)
    expect(result.processingTimeSeconds).toBe(7200)
  })

  it('returns null address when missing', () => {
    const result = normalizeOrderDetail({})
    expect(result.address).toBeNull()
  })

  it('returns empty statusHistory when missing', () => {
    const result = normalizeOrderDetail({})
    expect(result.statusHistory).toEqual([])
  })

  it('handles snake_case status_history array', () => {
    const raw = {
      status_history: [{ supplierStatus: 'new', wbStatus: 'waiting', changed_at: '2026-01-01' }],
    }
    const result = normalizeOrderDetail(raw)
    expect(result.statusHistory).toHaveLength(1)
    expect(result.statusHistory[0].changedAt).toBe('2026-01-01')
  })

  it('preserves null for nullable address fields', () => {
    const raw = {
      address: { fullAddress: null, longitude: null, latitude: null },
    }
    const result = normalizeOrderDetail(raw)
    expect(result.address!.fullAddress).toBeNull()
    expect(result.address!.longitude).toBeNull()
    expect(result.address!.latitude).toBeNull()
  })

  it('preserves null for nullable string fields', () => {
    const raw = { productName: null, cargoType: null }
    const result = normalizeOrderDetail(raw)
    expect(result.productName).toBeNull()
    expect(result.cargoType).toBeNull()
  })

  it('defaults fields on empty input', () => {
    const result = normalizeOrderDetail({})
    expect(result.orderId).toBe('')
    expect(result.nmId).toBe(0)
    expect(result.price).toBe(0)
    expect(result.isB2B).toBe(false)
    expect(result.processingTimeSeconds).toBe(0)
  })

  it('handles null input', () => {
    const result = normalizeOrderDetail(null)
    expect(result.orderId).toBe('')
    expect(result.address).toBeNull()
    expect(result.statusHistory).toEqual([])
  })
})
