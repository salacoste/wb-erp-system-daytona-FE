/**
 * Storage Queries Normalizer Tests
 * Covers: normalizeStorageBySkuResponse, normalizeTopConsumersResponse
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeStorageBySkuResponse,
  normalizeTopConsumersResponse,
} from '../storage-queries-normalizer'

// ---------------------------------------------------------------------------
// normalizeStorageBySkuResponse
// ---------------------------------------------------------------------------

describe('normalizeStorageBySkuResponse', () => {
  it('happy path: normalizes full envelope', () => {
    const raw = {
      period: { from: '2025-W44', to: '2025-W47', days_count: 28 },
      data: [
        {
          nm_id: '12345',
          vendor_code: 'SKU-001',
          product_name: 'Product A',
          brand: 'Brand X',
          storage_cost_total: 500,
          storage_cost_avg_daily: 17.8,
          volume_avg: 2.5,
          warehouses: ['Коледино'],
          days_stored: 28,
          total_stock: 100,
          has_warehouse_stock: true,
        },
      ],
      summary: { total_storage_cost: 500, products_count: 1, avg_cost_per_product: 500 },
      pagination: { total: 1, cursor: null, has_more: false },
      has_data: true,
    }
    const result = normalizeStorageBySkuResponse(raw, '2025-W44', '2025-W47')
    expect(result.data).toHaveLength(1)
    expect(result.data[0].nm_id).toBe('12345')
    expect(result.data[0].storage_cost_total).toBe(500)
    expect(result.data[0].volume_avg).toBe(2.5)
    expect(result.data[0].warehouses).toEqual(['Коледино'])
    expect(result.has_data).toBe(true)
    expect(result.period.from).toBe('2025-W44')
  })

  it('null input returns empty safe response with fallback period', () => {
    const result = normalizeStorageBySkuResponse(null, '2025-W01', '2025-W04')
    expect(result.data).toEqual([])
    expect(result.period.from).toBe('2025-W01')
    expect(result.period.to).toBe('2025-W04')
    expect(result.has_data).toBe(false)
  })

  it('bare array input is treated as data', () => {
    const raw = [{ nm_id: '999', storage_cost_total: 100 }]
    const result = normalizeStorageBySkuResponse(raw, 'W1', 'W2')
    expect(result.data).toHaveLength(1)
    expect(result.data[0].nm_id).toBe('999')
  })

  it('missing fields default safely', () => {
    const raw = { data: [{}] }
    const result = normalizeStorageBySkuResponse(raw, 'W1', 'W2')
    const item = result.data[0]
    expect(item.nm_id).toBe('')
    expect(item.vendor_code).toBeNull()
    expect(item.product_name).toBeNull()
    // AP#8: money fields preserve null (render '—'), not 0.
    expect(item.storage_cost_total).toBeNull()
    expect(item.storage_cost_avg_daily).toBeNull()
    expect(item.volume_avg).toBeNull()
    expect(item.warehouses).toEqual([])
  })

  it('null volume_avg is preserved as null', () => {
    const raw = { data: [{ nm_id: '1', volume_avg: null }] }
    const result = normalizeStorageBySkuResponse(raw, 'W1', 'W2')
    expect(result.data[0].volume_avg).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// normalizeTopConsumersResponse
// ---------------------------------------------------------------------------

describe('normalizeTopConsumersResponse', () => {
  it('happy path: normalizes top_consumers envelope', () => {
    const raw = {
      period: { from: '2025-W44', to: '2025-W47', days_count: 28 },
      top_consumers: [
        {
          rank: 1,
          nm_id: '12345',
          vendor_code: 'SKU-001',
          product_name: 'Product A',
          brand: 'Brand X',
          storage_cost: 500,
          percent_of_total: 25.5,
          volume: 3.0,
          has_warehouse_stock: true,
        },
      ],
      total_storage_cost: 2000,
      has_data: true,
    }
    const result = normalizeTopConsumersResponse(raw)
    expect(result.top_consumers).toHaveLength(1)
    const item = result.top_consumers[0]
    expect(item.rank).toBe(1)
    expect(item.nm_id).toBe('12345')
    expect(item.storage_cost).toBe(500)
    expect(item.percent_of_total).toBe(25.5)
    expect(item.volume).toBe(3.0)
    expect(result.total_storage_cost).toBe(2000)
  })

  it('null input returns empty safe response', () => {
    const result = normalizeTopConsumersResponse(null)
    expect(result.top_consumers).toEqual([])
    expect(result.total_storage_cost).toBe(0)
    expect(result.has_data).toBe(false)
  })

  it('missing top_consumers returns empty array', () => {
    const result = normalizeTopConsumersResponse({})
    expect(result.top_consumers).toEqual([])
  })

  it('missing fields default safely', () => {
    const raw = { top_consumers: [{}] }
    const result = normalizeTopConsumersResponse(raw)
    const item = result.top_consumers[0]
    expect(item.rank).toBe(0)
    expect(item.nm_id).toBe('')
    expect(item.vendor_code).toBeNull()
    // AP#8: money field preserves null (render '—'), not 0.
    expect(item.storage_cost).toBeNull()
    expect(item.volume).toBeNull()
    expect(item.revenue_net).toBeUndefined()
  })

  it('null volume preserved as null, revenue_net as undefined (optional field)', () => {
    const raw = { top_consumers: [{ rank: 1, volume: null, revenue_net: null }] }
    const result = normalizeTopConsumersResponse(raw)
    expect(result.top_consumers[0].volume).toBeNull()
    expect(result.top_consumers[0].revenue_net).toBeUndefined()
  })
})
