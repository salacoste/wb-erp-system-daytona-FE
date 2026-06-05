/**
 * Shipment-cost boundary normalizer tests
 * Covers: box-types, sku-packaging, shipments, fcu-aggregation
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeBoxType,
  normalizeBoxTypeList,
  normalizeSkuPackagingBoxType,
} from '../box-types-normalizer'
import { normalizeSkuPackaging, normalizeSkuPackagingList } from '../sku-packaging-normalizer'
import { normalizeShipment, normalizeShipmentListResponse } from '../shipments-normalizer'
import { normalizeFcuBySkuItem, normalizeFcuBySkuList } from '../fcu-aggregation-normalizer'

// ---------------------------------------------------------------------------
// Box Types
// ---------------------------------------------------------------------------

describe('normalizeBoxType', () => {
  const fullRaw = {
    id: 'bt-1',
    cabinetId: 'cab-1',
    name: 'Standard',
    lengthCm: '40.0',
    widthCm: '30.0',
    heightCm: '20.0',
    volumeCm3: '24000.0',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  }

  it('fully-populated response normalizes correctly', () => {
    const result = normalizeBoxType(fullRaw)
    expect(result.id).toBe('bt-1')
    expect(result.name).toBe('Standard')
    expect(result.lengthCm).toBe('40.0')
    expect(result.isActive).toBe(true)
  })

  it('missing fields default to safe values', () => {
    const result = normalizeBoxType({})
    expect(result.id).toBe('')
    expect(result.name).toBe('')
    expect(result.isActive).toBe(false)
    expect(result.lengthCm).toBe('')
  })

  it('null input produces safe defaults', () => {
    const result = normalizeBoxType(null)
    expect(result.id).toBe('')
    expect(result.name).toBe('')
  })

  it('normalizeBoxTypeList wraps array and handles non-array', () => {
    expect(normalizeBoxTypeList([fullRaw, fullRaw])).toHaveLength(2)
    expect(normalizeBoxTypeList(null)).toHaveLength(0)
    expect(normalizeBoxTypeList('oops')).toHaveLength(0)
  })
})

describe('normalizeSkuPackagingBoxType', () => {
  it('normalizes embedded box type subset', () => {
    const result = normalizeSkuPackagingBoxType({
      id: 'bt-2',
      name: 'Small',
      lengthCm: '10',
      widthCm: '10',
      heightCm: '10',
      volumeCm3: '1000',
      isActive: true,
    })
    expect(result.id).toBe('bt-2')
    expect(result.name).toBe('Small')
  })

  it('missing fields default safely', () => {
    const result = normalizeSkuPackagingBoxType({})
    expect(result.id).toBe('')
    expect(result.isActive).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// SKU Packaging
// ---------------------------------------------------------------------------

describe('normalizeSkuPackaging', () => {
  const fullRaw = {
    nmId: 12345,
    cabinetId: 'cab-1',
    boxTypeId: 'bt-1',
    unitsPerBox: 10,
    boxType: {
      id: 'bt-1',
      name: 'Std',
      lengthCm: '40',
      widthCm: '30',
      heightCm: '20',
      volumeCm3: '24000',
      isActive: true,
    },
    product: { nmId: 12345, vendorCode: 'VC-1', brand: 'Brand', subject: 'Shoes' },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  }

  it('fully-populated normalizes correctly', () => {
    const result = normalizeSkuPackaging(fullRaw)
    expect(result.nmId).toBe(12345)
    expect(result.unitsPerBox).toBe(10)
    expect(result.boxType.name).toBe('Std')
    expect(result.product.vendorCode).toBe('VC-1')
  })

  it('null nested objects produce safe defaults', () => {
    const result = normalizeSkuPackaging({ boxType: null, product: null })
    expect(result.boxType.id).toBe('')
    expect(result.product.nmId).toBe(0)
  })

  it('normalizeSkuPackagingList handles non-array', () => {
    expect(normalizeSkuPackagingList(null)).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Shipments
// ---------------------------------------------------------------------------

describe('normalizeShipment', () => {
  const fullRaw = {
    id: 'sh-1',
    cabinetId: 'cab-1',
    name: 'Shipment A',
    deliveryMode: 'FIXED_VEHICLE',
    totalDeliveryCost: '5000.00',
    palletRate: '1500.00',
    status: 'DRAFT',
    createdBy: 'user-1',
    confirmedBy: null,
    confirmedAt: null,
    supplyId: null,
    pallets: [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  }

  it('fully-populated normalizes correctly', () => {
    const result = normalizeShipment(fullRaw)
    expect(result.id).toBe('sh-1')
    expect(result.deliveryMode).toBe('FIXED_VEHICLE')
    expect(result.totalDeliveryCost).toBe('5000.00')
    expect(result.status).toBe('DRAFT')
    expect(result.confirmedBy).toBeNull()
  })

  it('missing fields default safely', () => {
    const result = normalizeShipment({})
    expect(result.id).toBe('')
    expect(result.deliveryMode).toBe('FIXED_VEHICLE')
    expect(result.status).toBe('DRAFT')
    expect(result.pallets).toEqual([])
  })

  it('nested pallets with box lines normalize recursively', () => {
    const result = normalizeShipment({
      ...fullRaw,
      pallets: [
        {
          id: 'p-1',
          shipmentId: 'sh-1',
          palletNumber: 1,
          boxLines: [
            {
              id: 'bl-1',
              palletId: 'p-1',
              nmId: 123,
              boxCount: 5,
              totalUnits: 50,
              unitCostRub: '12.50',
              boxVolume: '1000',
              totalVolume: '5000',
              volumeShare: '0.25',
              allocatedDeliveryCost: '1250.00',
              deliveryCostPerUnit: '25.00',
              finalCostPerUnit: '37.50',
              finalCostLine: '1875.00',
              createdAt: '2026-01-01T00:00:00Z',
              updatedAt: '2026-01-01T00:00:00Z',
            },
          ],
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ],
    })
    expect(result.pallets).toHaveLength(1)
    const line = result.pallets[0].boxLines[0]
    expect(line.nmId).toBe(123)
    expect(line.unitCostRub).toBe('12.50')
    expect(line.totalUnits).toBe(50)
  })
})

describe('normalizeShipmentListResponse', () => {
  it('normalizes list with pagination', () => {
    const result = normalizeShipmentListResponse({
      data: [
        {
          id: 'sh-1',
          cabinetId: 'cab-1',
          deliveryMode: 'PER_PALLET',
          status: 'CONFIRMED',
          createdBy: 'u1',
          pallets: [],
          createdAt: '',
          updatedAt: '',
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    })
    expect(result.data).toHaveLength(1)
    expect(result.total).toBe(1)
    expect(result.page).toBe(1)
  })

  it('non-array data defaults to empty', () => {
    const result = normalizeShipmentListResponse({ data: null })
    expect(result.data).toEqual([])
    expect(result.total).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// FCU Aggregation
// ---------------------------------------------------------------------------

describe('normalizeFcuBySkuItem', () => {
  const fullRaw = {
    nmId: 12345,
    productName: 'T-Shirt',
    latestPcu: 150.5,
    latestDcu: 25.3,
    latestFcu: 175.8,
    shipmentId: 'sh-uuid',
    shipmentName: 'Shipment 1',
    confirmedAt: '2026-01-15T10:00:00Z',
  }

  it('fully-populated normalizes correctly', () => {
    const result = normalizeFcuBySkuItem(fullRaw)
    expect(result.nmId).toBe(12345)
    expect(result.latestPcu).toBe(150.5)
    expect(result.latestDcu).toBe(25.3)
    expect(result.latestFcu).toBe(175.8)
    expect(result.shipmentId).toBe('sh-uuid')
  })

  it('null dcu/fcu preserved as null (AP#8)', () => {
    const result = normalizeFcuBySkuItem({ ...fullRaw, latestDcu: null, latestFcu: null })
    expect(result.latestDcu).toBeNull()
    expect(result.latestFcu).toBeNull()
  })

  it('missing pcu defaults to 0 (known cost)', () => {
    const result = normalizeFcuBySkuItem({ ...fullRaw, latestPcu: undefined })
    expect(result.latestPcu).toBe(0)
  })

  it('normalizeFcuBySkuList handles non-array', () => {
    expect(normalizeFcuBySkuList(null)).toHaveLength(0)
    expect(normalizeFcuBySkuList([fullRaw])).toHaveLength(1)
  })
})
