/**
 * Funnel Boundary Normalizer Tests — Epic 119-FE retro A-3
 * (deferred from Story 119.2-FE 1st-pass F-10).
 * Structural twin of search-analytics-normalizer.test.ts (Story 119.1-FE).
 *
 * Central cases:
 *  - Discriminated union: product item (nmId) vs day item (date string)
 *  - topSearchQueries (Story 119.2-FE): invalid entries dropped
 *  - SEMANTIC-ZERO disposition (funnel-empty.ts): null/missing ratios → 0,
 *    NOT null — the deliberate difference from 119.1's nullable searchOrderShare
 *  - lastSyncAt: genuinely nullable, preserved as null (NOT coerced to '')
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeFunnelDayItem,
  normalizeFunnelProductItem,
  normalizeFunnelResponse,
  normalizeFunnelSyncStatus,
  normalizeTopSearchQuery,
} from '../funnel-normalizer'

// --- normalizeTopSearchQuery ----------------------------------------------

describe('normalizeTopSearchQuery', () => {
  it('valid entry passes through with numeric coercion', () => {
    const r = normalizeTopSearchQuery({ query: 'тест', impressions: 10, clicks: 3, orders: 1 })
    expect(r).toEqual({ query: 'тест', impressions: 10, clicks: 3, orders: 1 })
  })

  it('empty-string query → null (matches filterValidQueries guard)', () => {
    expect(normalizeTopSearchQuery({ query: '', impressions: 5 })).toBeNull()
  })

  it('whitespace-only query → null', () => {
    expect(normalizeTopSearchQuery({ query: '   ', impressions: 5 })).toBeNull()
  })

  it('non-string query → null', () => {
    expect(normalizeTopSearchQuery({ query: 123, impressions: 5 })).toBeNull()
    expect(normalizeTopSearchQuery({ query: null })).toBeNull()
    expect(normalizeTopSearchQuery(null)).toBeNull()
  })

  it('missing metrics → 0 (SEMANTIC-ZERO)', () => {
    const r = normalizeTopSearchQuery({ query: 'x' })
    expect(r).toEqual({ query: 'x', impressions: 0, clicks: 0, orders: 0 })
  })
})

// --- normalizeFunnelProductItem -------------------------------------------

describe('normalizeFunnelProductItem', () => {
  it('full item passes through', () => {
    const r = normalizeFunnelProductItem({
      nmId: 887604577,
      vendorCode: 'izoblack_20',
      brandName: 'Protape',
      openCardCount: 100,
      addToCartCount: 40,
      ordersCount: 20,
      ordersSumRub: 5000,
      buyoutCount: 15,
      buyoutSumRub: 3750,
      cancelCount: 2,
      cancelSumRub: 500,
      cartConversion: 40,
      orderConversion: 50,
      buyoutConversion: 75,
      cancelRate: 10,
      totalConversion: 20,
    })
    expect(r.nmId).toBe(887604577)
    expect(r.vendorCode).toBe('izoblack_20')
    expect(r.brandName).toBe('Protape')
    expect(r.ordersSumRub).toBe(5000)
    expect(r.cartConversion).toBe(40)
  })

  it('missing numeric fields → 0 (SEMANTIC-ZERO, not null)', () => {
    const r = normalizeFunnelProductItem({ nmId: 1 })
    expect(r.openCardCount).toBe(0)
    expect(r.ordersSumRub).toBe(0)
    expect(r.cartConversion).toBe(0) // ratio coerces to 0, deliberately NOT null
    expect(r.totalConversion).toBe(0)
  })

  it('null ratio → 0 (SEMANTIC-ZERO disposition differs from 119.1)', () => {
    const r = normalizeFunnelProductItem({ nmId: 1, cartConversion: null, buyoutConversion: null })
    expect(r.cartConversion).toBe(0)
    expect(r.buyoutConversion).toBe(0)
  })

  it('vendorCode/brandName omitted when absent', () => {
    const r = normalizeFunnelProductItem({ nmId: 1 })
    expect('vendorCode' in r).toBe(false)
    expect('brandName' in r).toBe(false)
  })

  it('non-string vendorCode/brandName → omitted (Defensive Frontend)', () => {
    const r = normalizeFunnelProductItem({ nmId: 1, vendorCode: { x: 1 }, brandName: 42 })
    expect('vendorCode' in r).toBe(false)
    expect('brandName' in r).toBe(false)
  })

  it('nmId coerced from string', () => {
    expect(normalizeFunnelProductItem({ nmId: '887604577' }).nmId).toBe(887604577)
  })

  it('topSearchQueries: invalid entries dropped, valid kept', () => {
    const r = normalizeFunnelProductItem({
      nmId: 1,
      topSearchQueries: [
        { query: 'good', impressions: 5, clicks: 2, orders: 1 },
        { query: '', impressions: 9 }, // dropped
        { query: 99 }, // dropped
      ],
    })
    expect(r.topSearchQueries).toEqual([{ query: 'good', impressions: 5, clicks: 2, orders: 1 }])
  })

  it('topSearchQueries omitted when not an array', () => {
    expect('topSearchQueries' in normalizeFunnelProductItem({ nmId: 1 })).toBe(false)
    expect(
      'topSearchQueries' in normalizeFunnelProductItem({ nmId: 1, topSearchQueries: 'bad' })
    ).toBe(false)
  })

  it('garbage input → all-zero product item', () => {
    const r = normalizeFunnelProductItem(null)
    expect(r.nmId).toBe(0)
    expect(r.openCardCount).toBe(0)
  })
})

// --- normalizeFunnelDayItem -----------------------------------------------

describe('normalizeFunnelDayItem', () => {
  it('date passes through; metrics coerced', () => {
    const r = normalizeFunnelDayItem({ date: '2026-05-01', openCardCount: 7, cartConversion: 12 })
    expect(r.date).toBe('2026-05-01')
    expect(r.openCardCount).toBe(7)
    expect(r.cartConversion).toBe(12)
  })

  it('missing date → empty string', () => {
    expect(normalizeFunnelDayItem({ openCardCount: 1 }).date).toBe('')
  })

  it('non-string date → empty string (Defensive Frontend: no fake-date coercion)', () => {
    expect(normalizeFunnelDayItem({ date: 123 }).date).toBe('')
    expect(normalizeFunnelDayItem({ date: {} }).date).toBe('')
  })

  it('day item carries no *SumRub keys (product-only fields)', () => {
    const r = normalizeFunnelDayItem({ date: '2026-05-01' })
    expect('ordersSumRub' in r).toBe(false)
    expect('buyoutSumRub' in r).toBe(false)
    expect('cancelSumRub' in r).toBe(false)
  })
})

// --- normalizeFunnelResponse ----------------------------------------------

describe('normalizeFunnelResponse', () => {
  it('maps items, summary, and pagination', () => {
    const r = normalizeFunnelResponse({
      items: [{ nmId: 1, openCardCount: 10 }],
      summary: { openCardCount: 10, ordersSumRub: 500, cartConversion: 40 },
      pagination: { total: 1, limit: 50, offset: 0, hasMore: true },
    })
    expect(r.items).toHaveLength(1)
    expect(r.summary.openCardCount).toBe(10)
    expect(r.summary.ordersSumRub).toBe(500)
    expect(r.pagination).toEqual({ total: 1, limit: 50, offset: 0, hasMore: true })
  })

  it('routes items by groupBy intent, not per-item date-sniffing', () => {
    // groupBy=day → day items even if a row also carries nmId; no *SumRub keys
    const day = normalizeFunnelResponse({ items: [{ date: '2026-05-01', nmId: 9 }] }, 'day')
    expect('date' in day.items[0]).toBe(true)
    expect('ordersSumRub' in day.items[0]).toBe(false)
    // groupBy=product (default) → product items even if a row carries a stray date
    const prod = normalizeFunnelResponse({ items: [{ nmId: 9, date: '2026-05-01' }] }, 'product')
    expect('nmId' in prod.items[0]).toBe(true)
    expect('date' in prod.items[0]).toBe(false)
    expect(normalizeFunnelResponse({ items: [{ nmId: 1 }] }).items[0]).toHaveProperty('nmId')
  })

  it('summary money sums: null/missing → 0 (SEMANTIC-ZERO)', () => {
    const r = normalizeFunnelResponse({ summary: { ordersSumRub: null, buyoutSumRub: undefined } })
    expect(r.summary.ordersSumRub).toBe(0)
    expect(r.summary.buyoutSumRub).toBe(0)
    expect(r.summary.cancelSumRub).toBe(0)
  })

  it('missing/non-array items → empty array', () => {
    expect(normalizeFunnelResponse({}).items).toEqual([])
    expect(normalizeFunnelResponse({ items: 'nope' }).items).toEqual([])
  })

  it('hasMore is strict: only boolean true → true', () => {
    expect(normalizeFunnelResponse({ pagination: { hasMore: 'true' } }).pagination.hasMore).toBe(
      false
    )
    expect(normalizeFunnelResponse({ pagination: { hasMore: 1 } }).pagination.hasMore).toBe(false)
    expect(normalizeFunnelResponse({ pagination: { hasMore: true } }).pagination.hasMore).toBe(true)
  })

  it('garbage input → empty canonical shape', () => {
    const r = normalizeFunnelResponse(null)
    expect(r.items).toEqual([])
    expect(r.summary.openCardCount).toBe(0)
    expect(r.pagination.total).toBe(0)
  })

  // Epic 114.5: optional cross-source approximation meta
  it('normalizes meta when present and well-formed', () => {
    const r = normalizeFunnelResponse({
      items: [],
      meta: {
        totalConversionApproximate: true,
        dataSource: { funnel: 'product_funnel_daily', buyout: 'wb-product-data-api-v2' },
        syncedPeriod: { from: '2026-05-01', to: '2026-05-07', lastSyncAt: '2026-05-07T10:00:00Z' },
      },
    })
    expect(r.meta).toEqual({
      totalConversionApproximate: true,
      dailyGranularityAvailable: false, // absent in raw → strict === true → false
      dataSource: { funnel: 'product_funnel_daily', buyout: 'wb-product-data-api-v2' },
      syncedPeriod: { from: '2026-05-01', to: '2026-05-07', lastSyncAt: '2026-05-07T10:00:00Z' },
    })
  })

  it('omits meta entirely when absent', () => {
    expect('meta' in normalizeFunnelResponse({ items: [] })).toBe(false)
    expect('meta' in normalizeFunnelResponse(null)).toBe(false)
  })

  it('meta booleans/strings coerced defensively (strict bool, null lastSyncAt)', () => {
    const r = normalizeFunnelResponse({
      meta: {
        totalConversionApproximate: 'true', // non-strict → false
        dataSource: { funnel: 42, buyout: undefined }, // non-string → ''
        syncedPeriod: { from: '2026-05-01', to: '2026-05-07', lastSyncAt: 0 }, // non-string → null
      },
    })
    expect(r.meta?.totalConversionApproximate).toBe(false)
    expect(r.meta?.dataSource).toEqual({ funnel: '', buyout: '' })
    expect(r.meta?.syncedPeriod.lastSyncAt).toBeNull()
  })
})

// --- normalizeFunnelSyncStatus --------------------------------------------

describe('normalizeFunnelSyncStatus', () => {
  it('string lastSyncAt preserved; counts coerced', () => {
    const r = normalizeFunnelSyncStatus({
      lastSyncAt: '2026-05-01T12:00:00Z',
      recordsCount: 42,
      productsCount: 7,
    })
    expect(r.lastSyncAt).toBe('2026-05-01T12:00:00Z')
    expect(r.recordsCount).toBe(42)
    expect(r.productsCount).toBe(7)
  })

  it('null lastSyncAt preserved (never synced) — NOT coerced to empty string', () => {
    expect(normalizeFunnelSyncStatus({ lastSyncAt: null }).lastSyncAt).toBeNull()
  })

  it('non-string lastSyncAt → null', () => {
    expect(normalizeFunnelSyncStatus({ lastSyncAt: 0 }).lastSyncAt).toBeNull()
    expect(normalizeFunnelSyncStatus({}).lastSyncAt).toBeNull()
  })
})
