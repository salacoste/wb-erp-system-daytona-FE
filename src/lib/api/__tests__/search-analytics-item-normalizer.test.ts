/**
 * Search Analytics Per-Item Normalizer Tests
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeSearchQueryItem,
  normalizeSearchProductItem,
  normalizeSearchOrderItem,
} from '../search-analytics-item-normalizer'

// --- normalizeSearchQueryItem ---

describe('normalizeSearchQueryItem', () => {
  it('normalizes a fully-populated query item', () => {
    const raw = {
      searchQuery: 'платье',
      avgPosition: 3,
      totalImpressions: 500,
      totalClicks: 100,
      avgCtr: 0.2,
      totalOrders: 15,
      searchCartAdds: 25,
    }
    const result = normalizeSearchQueryItem(raw)
    expect(result.searchQuery).toBe('платье')
    expect(result.avgPosition).toBe(3)
    expect(result.totalImpressions).toBe(500)
    expect(result.totalClicks).toBe(100)
    expect(result.avgCtr).toBe(0.2)
    expect(result.totalOrders).toBe(15)
    expect(result.searchCartAdds).toBe(25)
  })

  it('preserves null for avgCtr (rate field per AP#8)', () => {
    const raw = { avgCtr: null }
    const result = normalizeSearchQueryItem(raw)
    expect(result.avgCtr).toBeNull()
  })

  it('defaults counts to 0 when missing', () => {
    const result = normalizeSearchQueryItem({})
    expect(result.avgPosition).toBe(0)
    expect(result.totalImpressions).toBe(0)
    expect(result.totalClicks).toBe(0)
    expect(result.totalOrders).toBe(0)
    expect(result.searchCartAdds).toBe(0)
  })

  it('defaults searchQuery to empty string when null', () => {
    const result = normalizeSearchQueryItem({ searchQuery: null })
    expect(result.searchQuery).toBe('')
  })
})

// --- normalizeSearchProductItem ---

describe('normalizeSearchProductItem', () => {
  it('normalizes a fully-populated product item', () => {
    const raw = {
      nmId: 554433,
      vendorCode: 'VC-001',
      avgPosition: 5,
      totalImpressions: 300,
      totalClicks: 60,
      avgCtr: 0.2,
      totalOrders: 10,
      searchCartAdds: 18,
    }
    const result = normalizeSearchProductItem(raw)
    expect(result.nmId).toBe(554433)
    expect(result.vendorCode).toBe('VC-001')
    expect(result.avgPosition).toBe(5)
    expect(result.avgCtr).toBe(0.2)
    expect(result.totalOrders).toBe(10)
  })

  it('preserves null for vendorCode', () => {
    const result = normalizeSearchProductItem({ vendorCode: null })
    expect(result.vendorCode).toBeNull()
  })

  it('preserves null for avgCtr (rate field per AP#8)', () => {
    const result = normalizeSearchProductItem({ avgCtr: null })
    expect(result.avgCtr).toBeNull()
  })

  it('defaults nmId to 0 when missing', () => {
    const result = normalizeSearchProductItem({})
    expect(result.nmId).toBe(0)
    expect(result.vendorCode).toBeNull()
  })
})

// --- normalizeSearchOrderItem ---

describe('normalizeSearchOrderItem', () => {
  it('normalizes an item with string key', () => {
    const raw = { key: 'платье летнее', totalOrders: 5 }
    const result = normalizeSearchOrderItem(raw)
    expect(result).not.toBeNull()
    expect(result!.key).toBe('платье летнее')
    expect(result!.totalOrders).toBe(5)
  })

  it('coerces numeric key to string', () => {
    const raw = { key: 12345, totalOrders: 10 }
    const result = normalizeSearchOrderItem(raw)
    expect(result).not.toBeNull()
    expect(result!.key).toBe('12345')
  })

  it('returns null when key is null', () => {
    const raw = { key: null, totalOrders: 5 }
    expect(normalizeSearchOrderItem(raw)).toBeNull()
  })

  it('returns null when key is undefined', () => {
    const raw = { totalOrders: 5 }
    expect(normalizeSearchOrderItem(raw)).toBeNull()
  })

  it('returns null when key is an object', () => {
    const raw = { key: { nested: true }, totalOrders: 5 }
    expect(normalizeSearchOrderItem(raw)).toBeNull()
  })

  it('returns null when key is boolean', () => {
    const raw = { key: true, totalOrders: 5 }
    expect(normalizeSearchOrderItem(raw)).toBeNull()
  })

  it('returns null for null input', () => {
    expect(normalizeSearchOrderItem(null)).toBeNull()
  })

  it('includes optional vendorCode when present', () => {
    const raw = { key: 'test', vendorCode: 'VC-001' }
    const result = normalizeSearchOrderItem(raw)
    expect(result!.vendorCode).toBe('VC-001')
  })

  it('includes optional uniqueProducts when present', () => {
    const raw = { key: 'test', uniqueProducts: 42 }
    const result = normalizeSearchOrderItem(raw)
    expect(result!.uniqueProducts).toBe(42)
  })

  it('includes optional uniqueQueries when present', () => {
    const raw = { key: 'test', uniqueQueries: 15 }
    const result = normalizeSearchOrderItem(raw)
    expect(result!.uniqueQueries).toBe(15)
  })

  it('omits optional fields when not present in raw', () => {
    const raw = { key: 'test', totalOrders: 1 }
    const result = normalizeSearchOrderItem(raw)
    expect(result!.vendorCode).toBeUndefined()
    expect(result!.uniqueProducts).toBeUndefined()
    expect(result!.uniqueQueries).toBeUndefined()
  })

  it('defaults totalOrders to 0 when missing', () => {
    const raw = { key: 'test' }
    const result = normalizeSearchOrderItem(raw)
    expect(result!.totalOrders).toBe(0)
  })
})
