/**
 * Funnel Analytics Per-Item Normalizer Tests
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeSharedMetrics,
  normalizeTopSearchQuery,
  normalizeFunnelProductItem,
  normalizeFunnelDayItem,
} from '../funnel-item-normalizer'

// --- normalizeSharedMetrics ---

describe('normalizeSharedMetrics', () => {
  it('normalizes all 10 metric fields', () => {
    const r = {
      openCardCount: 100,
      addToCartCount: 50,
      ordersCount: 20,
      buyoutCount: 18,
      cancelCount: 2,
      cartConversion: 50,
      orderConversion: 20,
      buyoutConversion: 18,
      cancelRate: 10,
      totalConversion: 20,
    }
    const result = normalizeSharedMetrics(r)
    expect(result.openCardCount).toBe(100)
    expect(result.addToCartCount).toBe(50)
    expect(result.ordersCount).toBe(20)
    expect(result.buyoutCount).toBe(18)
    expect(result.cancelCount).toBe(2)
    expect(result.cartConversion).toBe(50)
    expect(result.orderConversion).toBe(20)
    expect(result.buyoutConversion).toBe(18)
    expect(result.cancelRate).toBe(10)
    expect(result.totalConversion).toBe(20)
  })

  it('defaults all fields to 0 when missing', () => {
    const result = normalizeSharedMetrics({})
    expect(result.openCardCount).toBe(0)
    expect(result.addToCartCount).toBe(0)
    expect(result.ordersCount).toBe(0)
    expect(result.buyoutCount).toBe(0)
    expect(result.cancelCount).toBe(0)
    expect(result.cartConversion).toBe(0)
    expect(result.orderConversion).toBe(0)
    expect(result.buyoutConversion).toBe(0)
    expect(result.cancelRate).toBe(0)
    expect(result.totalConversion).toBe(0)
  })
})

// --- normalizeTopSearchQuery ---

describe('normalizeTopSearchQuery', () => {
  it('normalizes a valid search query', () => {
    const raw = { query: 'платье', impressions: 100, clicks: 20, orders: 5 }
    const result = normalizeTopSearchQuery(raw)
    expect(result).not.toBeNull()
    expect(result!.query).toBe('платье')
    expect(result!.impressions).toBe(100)
    expect(result!.clicks).toBe(20)
    expect(result!.orders).toBe(5)
  })

  it('returns null when query is empty string', () => {
    const raw = { query: '', impressions: 10 }
    expect(normalizeTopSearchQuery(raw)).toBeNull()
  })

  it('returns null when query is whitespace-only', () => {
    const raw = { query: '   ', impressions: 10 }
    expect(normalizeTopSearchQuery(raw)).toBeNull()
  })

  it('returns null when query is not a string', () => {
    const raw = { query: 123, impressions: 10 }
    expect(normalizeTopSearchQuery(raw)).toBeNull()
  })

  it('returns null when query is missing', () => {
    const raw = { impressions: 10 }
    expect(normalizeTopSearchQuery(raw)).toBeNull()
  })

  it('defaults counts to 0 when missing', () => {
    const raw = { query: 'test' }
    const result = normalizeTopSearchQuery(raw)
    expect(result!.impressions).toBe(0)
    expect(result!.clicks).toBe(0)
    expect(result!.orders).toBe(0)
  })
})

// --- normalizeFunnelProductItem ---

describe('normalizeFunnelProductItem', () => {
  it('normalizes a fully-populated product item', () => {
    const raw = {
      nmId: 554433,
      ordersSumRub: 100000,
      buyoutSumRub: 90000,
      cancelSumRub: 10000,
      vendorCode: 'VC-001',
      brandName: 'BrandX',
      openCardCount: 500,
      addToCartCount: 200,
      ordersCount: 50,
      buyoutCount: 45,
      cancelCount: 5,
      cartConversion: 40,
      orderConversion: 10,
      buyoutConversion: 9,
      cancelRate: 10,
      totalConversion: 10,
    }
    const result = normalizeFunnelProductItem(raw)
    expect(result.nmId).toBe(554433)
    expect(result.ordersSumRub).toBe(100000)
    expect(result.vendorCode).toBe('VC-001')
    expect(result.brandName).toBe('BrandX')
    expect(result.openCardCount).toBe(500)
    expect(result.ordersCount).toBe(50)
  })

  it('omits vendorCode when missing', () => {
    const result = normalizeFunnelProductItem({ nmId: 1 })
    expect(result.vendorCode).toBeUndefined()
  })

  it('omits brandName when missing', () => {
    const result = normalizeFunnelProductItem({ nmId: 1 })
    expect(result.brandName).toBeUndefined()
  })

  it('omits topSearchQueries when missing', () => {
    const result = normalizeFunnelProductItem({ nmId: 1 })
    expect(result.topSearchQueries).toBeUndefined()
  })

  it('includes topSearchQueries and filters nulls', () => {
    const raw = {
      nmId: 1,
      topSearchQueries: [
        { query: 'valid', impressions: 10 },
        { query: '', impressions: 5 },
        { query: 'also valid', impressions: 20 },
      ],
    }
    const result = normalizeFunnelProductItem(raw)
    expect(result.topSearchQueries).toHaveLength(2)
    expect(result.topSearchQueries![0].query).toBe('valid')
    expect(result.topSearchQueries![1].query).toBe('also valid')
  })

  it('defaults counts to 0 on empty input', () => {
    const result = normalizeFunnelProductItem({})
    expect(result.nmId).toBe(0)
    expect(result.ordersSumRub).toBe(0)
    expect(result.openCardCount).toBe(0)
  })
})

// --- normalizeFunnelDayItem ---

describe('normalizeFunnelDayItem', () => {
  it('normalizes a fully-populated day item', () => {
    const raw = {
      date: '2026-01-15',
      openCardCount: 100,
      addToCartCount: 50,
      ordersCount: 20,
      buyoutCount: 18,
      cancelCount: 2,
      cartConversion: 50,
      orderConversion: 20,
      buyoutConversion: 18,
      cancelRate: 10,
      totalConversion: 20,
    }
    const result = normalizeFunnelDayItem(raw)
    expect(result.date).toBe('2026-01-15')
    expect(result.openCardCount).toBe(100)
    expect(result.ordersCount).toBe(20)
  })

  it('rejects non-string date (Defensive Frontend)', () => {
    const raw = { date: 20260115 }
    const result = normalizeFunnelDayItem(raw)
    expect(result.date).toBe('')
  })

  it('defaults date to empty string when missing', () => {
    const result = normalizeFunnelDayItem({})
    expect(result.date).toBe('')
  })

  it('defaults all metric fields to 0 when missing', () => {
    const result = normalizeFunnelDayItem({})
    expect(result.openCardCount).toBe(0)
    expect(result.ordersCount).toBe(0)
    expect(result.totalConversion).toBe(0)
  })
})
