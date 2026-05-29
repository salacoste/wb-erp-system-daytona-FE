/**
 * Boundary Normalizer Tests — Story 119.1-FE
 * Tests for the 6 search-analytics normalizers (3 per-item + 3 per-endpoint).
 * Mirrors src/lib/api/__tests__/monitor-summary-normalizer.test.ts (Story 92.1-FE)
 * and structural-twin cabinet-normalizer.ts (Story 89.1-FE).
 *
 * Central regression-prevention cases:
 *  - Story 117.1-FE F-1: numeric/null `key` drift on SearchOrderItem
 *  - Story 117.2-FE Side-observation: `searchOrderShare > 100` preserved as-is
 *  - Story 117.4-FE filter stance: non-string `key` defensive handling
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeSearchByProductResponse,
  normalizeSearchByQueryResponse,
  normalizeSearchOrderItem,
  normalizeSearchOrdersResponse,
  normalizeSearchProductItem,
  normalizeSearchQueryItem,
} from '../search-analytics-normalizer'

// --- normalizeSearchOrderItem — key-drift absorption (the central reason) --

describe('normalizeSearchOrderItem', () => {
  it('string key passes through unchanged', () => {
    const r = normalizeSearchOrderItem({ key: 'жидкая изолента', totalOrders: 42 })
    expect(r).not.toBeNull()
    expect(r?.key).toBe('жидкая изолента')
    expect(r?.totalOrders).toBe(42)
  })

  it('numeric key coerced via String() (Story 117.1-FE coerce stance)', () => {
    const r = normalizeSearchOrderItem({ key: 20260301, totalOrders: 7 })
    expect(r?.key).toBe('20260301')
  })

  it('null key drops the item (Story 117.4-FE filter stance)', () => {
    expect(normalizeSearchOrderItem({ key: null, totalOrders: 5 })).toBeNull()
  })

  it('undefined key drops the item', () => {
    expect(normalizeSearchOrderItem({ key: undefined, totalOrders: 5 })).toBeNull()
  })

  it('boolean/object keys drop the item (defensive guard)', () => {
    expect(normalizeSearchOrderItem({ key: false, totalOrders: 5 })).toBeNull()
    expect(normalizeSearchOrderItem({ key: { nmId: 1 }, totalOrders: 5 })).toBeNull()
  })

  it('totalOrders: undefined → 0 (AP#8 counts exception)', () => {
    const r = normalizeSearchOrderItem({ key: 'foo', totalOrders: undefined })
    expect(r?.totalOrders).toBe(0)
  })

  it('uniqueProducts: undefined preserved as undefined (optional)', () => {
    const r = normalizeSearchOrderItem({ key: 'foo', totalOrders: 1 })
    expect(r?.uniqueProducts).toBeUndefined()
  })

  it('uniqueProducts: number preserved', () => {
    const r = normalizeSearchOrderItem({ key: 'foo', totalOrders: 1, uniqueProducts: 3 })
    expect(r?.uniqueProducts).toBe(3)
  })

  it('vendorCode: null preserved (null-vs-zero rule)', () => {
    const r = normalizeSearchOrderItem({ key: 'foo', totalOrders: 1, vendorCode: null })
    expect(r?.vendorCode).toBeNull()
  })

  it('null/undefined raw returns null (defensive)', () => {
    expect(normalizeSearchOrderItem(null)).toBeNull()
    expect(normalizeSearchOrderItem(undefined)).toBeNull()
  })
})

// --- normalizeSearchOrdersResponse ----------------------------------------

describe('normalizeSearchOrdersResponse', () => {
  const fullRaw = () => ({
    period: { from: '2026-03-01', to: '2026-03-07' },
    groupBy: 'query',
    items: [
      { key: 'жидкая изолента', totalOrders: 50, uniqueProducts: 4 },
      { key: 20260301, totalOrders: 10 },
      { key: null, totalOrders: 3 },
    ],
    summary: { totalSearchOrders: 60, searchOrderShare: 35.5 },
  })

  it('mixed items array: null-keyed dropped, others coerced', () => {
    const r = normalizeSearchOrdersResponse(fullRaw())
    expect(r.items).toHaveLength(2)
    expect(r.items[0].key).toBe('жидкая изолента')
    expect(r.items[1].key).toBe('20260301')
  })

  it('summary.searchOrderShare: 394.23 (>100% case) preserved as-is — Story 117.2', () => {
    const raw = fullRaw()
    raw.summary.searchOrderShare = 394.23
    expect(normalizeSearchOrdersResponse(raw).summary.searchOrderShare).toBe(394.23)
  })

  it('summary.searchOrderShare: null preserved as null (Story 119.1-FE F-2, AP#8 ratio rule)', () => {
    const r = normalizeSearchOrdersResponse({
      period: { from: 'a', to: 'b' },
      groupBy: 'query',
      items: [],
      summary: { totalSearchOrders: 0, searchOrderShare: null },
    })
    expect(r.summary.searchOrderShare).toBeNull()
  })

  it('summary.searchOrderShare: undefined → null (not 0 — null-vs-zero distinction)', () => {
    const r = normalizeSearchOrdersResponse({
      period: { from: 'a', to: 'b' },
      groupBy: 'query',
      items: [],
      summary: { totalSearchOrders: 0 },
    })
    expect(r.summary.searchOrderShare).toBeNull()
  })

  it('summary.searchOrderShare: NaN-coercing input → null (not 0)', () => {
    const r = normalizeSearchOrdersResponse({
      period: { from: 'a', to: 'b' },
      groupBy: 'query',
      items: [],
      summary: { totalSearchOrders: 0, searchOrderShare: 'not-a-number' },
    })
    expect(r.summary.searchOrderShare).toBeNull()
  })

  it('summary.totalSearchOrders: undefined → 0 (counts exception)', () => {
    const r = normalizeSearchOrdersResponse({
      period: { from: 'a', to: 'b' },
      groupBy: 'query',
      items: [],
      summary: { searchOrderShare: 10 },
    })
    expect(r.summary.totalSearchOrders).toBe(0)
  })

  it('items: undefined → [] (defensive empty array)', () => {
    const r = normalizeSearchOrdersResponse({
      period: { from: 'a', to: 'b' },
      groupBy: 'query',
      summary: { totalSearchOrders: 0, searchOrderShare: 0 },
    })
    expect(r.items).toEqual([])
  })

  it('groupBy: undefined → fallback to "query"', () => {
    const r = normalizeSearchOrdersResponse({
      period: { from: 'a', to: 'b' },
      items: [],
      summary: { totalSearchOrders: 0, searchOrderShare: 0 },
    })
    expect(r.groupBy).toBe('query')
  })

  it('groupBy: "day" passes through', () => {
    const r = normalizeSearchOrdersResponse({ ...fullRaw(), groupBy: 'day' })
    expect(r.groupBy).toBe('day')
  })

  it('completely undefined raw returns safe empty shape without crash', () => {
    const r = normalizeSearchOrdersResponse(undefined)
    expect(r.items).toEqual([])
    expect(r.groupBy).toBe('query')
    expect(r.summary.totalSearchOrders).toBe(0)
    // Story 119.1-FE 1st-pass F-2 (AP#8 ratio null-preservation) + Pass-2 P2-1:
    // searchOrderShare was previously coerced 0 by toCount; now preserves null
    // via toNullableNumber. The 'completely undefined raw' case canonically
    // yields null (unknown) — counts default to 0 (known-zero), ratios default
    // to null (unknown). Asserting 0 here was the pre-F-2 contract.
    expect(r.summary.searchOrderShare).toBeNull()
  })
})

// --- normalizeSearchQueryItem ---------------------------------------------

describe('normalizeSearchQueryItem', () => {
  it('fully-populated item normalizes', () => {
    const r = normalizeSearchQueryItem({
      searchQuery: 'foo',
      avgPosition: 1.5,
      totalImpressions: 1000,
      totalClicks: 50,
      avgCtr: 5,
      totalOrders: 7,
    })
    expect(r.searchQuery).toBe('foo')
    expect(r.totalImpressions).toBe(1000)
    expect(r.totalOrders).toBe(7)
  })

  it('all counts undefined → 0', () => {
    const r = normalizeSearchQueryItem({ searchQuery: 'foo' })
    expect(r.totalImpressions).toBe(0)
    expect(r.totalClicks).toBe(0)
    expect(r.totalOrders).toBe(0)
  })
})

// --- normalizeSearchProductItem -------------------------------------------

describe('normalizeSearchProductItem', () => {
  it('fully-populated item normalizes (vendorCode string preserved)', () => {
    const r = normalizeSearchProductItem({
      nmId: 12345,
      vendorCode: 'VC-1',
      totalImpressions: 500,
      totalOrders: 3,
    })
    expect(r.nmId).toBe(12345)
    expect(r.vendorCode).toBe('VC-1')
    expect(r.totalImpressions).toBe(500)
  })

  it('vendorCode: undefined canonicalized to null', () => {
    expect(normalizeSearchProductItem({ nmId: 1 }).vendorCode).toBeNull()
  })

  it('vendorCode: null preserved', () => {
    expect(normalizeSearchProductItem({ nmId: 1, vendorCode: null }).vendorCode).toBeNull()
  })

  it('vendorCode: object input → null (Story 119.1-FE F-4 — Defensive Frontend, rejects garbage coercion)', () => {
    expect(
      normalizeSearchProductItem({ nmId: 1, vendorCode: { code: 'VC-1' } }).vendorCode
    ).toBeNull()
  })

  it('vendorCode: numeric input → null (Story 119.1-FE F-4 — type discipline, not String(12345))', () => {
    expect(normalizeSearchProductItem({ nmId: 1, vendorCode: 12345 }).vendorCode).toBeNull()
  })
})

// --- normalizeSearchOrderItem — vendorCode discipline (Story 119.1-FE F-4) -

describe('normalizeSearchOrderItem vendorCode', () => {
  it('object vendorCode → null on order item (Defensive Frontend)', () => {
    const r = normalizeSearchOrderItem({ key: 'foo', totalOrders: 1, vendorCode: { code: 'X' } })
    expect(r?.vendorCode).toBeNull()
  })

  it('numeric vendorCode → null on order item', () => {
    const r = normalizeSearchOrderItem({ key: 'foo', totalOrders: 1, vendorCode: 9999 })
    expect(r?.vendorCode).toBeNull()
  })
})

// --- normalizeSearchByProductResponse -------------------------------------

describe('normalizeSearchByProductResponse', () => {
  it('queries: undefined → []; totalQueries: undefined → 0', () => {
    const r = normalizeSearchByProductResponse({
      nmId: 123,
      period: { from: 'a', to: 'b' },
    })
    expect(r.queries).toEqual([])
    expect(r.totalQueries).toBe(0)
  })

  it('empty queries: [] preserved', () => {
    const r = normalizeSearchByProductResponse({
      nmId: 123,
      period: { from: 'a', to: 'b' },
      queries: [],
      totalQueries: 0,
    })
    expect(r.queries).toEqual([])
  })

  it('queries items normalized through normalizeSearchQueryItem', () => {
    const r = normalizeSearchByProductResponse({
      nmId: 123,
      period: { from: 'a', to: 'b' },
      queries: [{ searchQuery: 'foo' }],
      totalQueries: 1,
    })
    expect(r.queries[0].totalImpressions).toBe(0)
  })

  it('completely undefined raw returns safe empty shape', () => {
    const r = normalizeSearchByProductResponse(undefined)
    expect(r.queries).toEqual([])
    expect(r.totalQueries).toBe(0)
  })
})

// --- normalizeSearchByQueryResponse ---------------------------------------

describe('normalizeSearchByQueryResponse', () => {
  it('products: undefined → []; totalProducts: undefined → 0', () => {
    const r = normalizeSearchByQueryResponse({
      query: 'foo',
      period: { from: 'a', to: 'b' },
    })
    expect(r.products).toEqual([])
    expect(r.totalProducts).toBe(0)
  })

  it('products[0].vendorCode: null preserved', () => {
    const r = normalizeSearchByQueryResponse({
      query: 'foo',
      period: { from: 'a', to: 'b' },
      products: [{ nmId: 1, vendorCode: null }],
      totalProducts: 1,
    })
    expect(r.products[0].vendorCode).toBeNull()
  })

  it('products[0].vendorCode: undefined canonicalized to null', () => {
    const r = normalizeSearchByQueryResponse({
      query: 'foo',
      period: { from: 'a', to: 'b' },
      products: [{ nmId: 1 }],
      totalProducts: 1,
    })
    expect(r.products[0].vendorCode).toBeNull()
  })
})

// --- src/test/fixtures/search-empty consumer smoke-test (Pass-2 P2-5) ----
//
// Pattern 3 (CLAUDE.md § Multi-Source Orchestration; Story 92.6-FE origin):
// the Story-1 empty-fixture factory needs at least one use-site to validate
// it compiles against real types. Without this, structural drift between the
// fixture and the type contract goes undetected until Story 119.2 / 119.3 /
// future consumers try to import.
import {
  emptySearchByProductResponse,
  emptySearchByQueryResponse,
  emptySearchOrdersResponse,
} from '@/test/fixtures/search-empty'

describe('search-empty fixtures (Pattern 3 smoke-test)', () => {
  it('emptySearchByProductResponse returns a normalize-stable empty shape', () => {
    const fx = emptySearchByProductResponse()
    expect(normalizeSearchByProductResponse(fx)).toEqual(fx)
  })

  it('emptySearchByQueryResponse returns a normalize-stable empty shape', () => {
    const fx = emptySearchByQueryResponse()
    expect(normalizeSearchByQueryResponse(fx)).toEqual(fx)
  })

  it('emptySearchOrdersResponse returns a normalize-stable empty shape (searchOrderShare null)', () => {
    const fx = emptySearchOrdersResponse()
    expect(normalizeSearchOrdersResponse(fx)).toEqual(fx)
    // Pattern 3 contract check: ratio defaults to null, not 0 (AP#8).
    expect(fx.summary.searchOrderShare).toBeNull()
  })

  it('emptySearchOrdersResponse accepts overrides for test specialization', () => {
    const fx = emptySearchOrdersResponse({
      summary: { totalSearchOrders: 42, searchOrderShare: 12.5 },
    })
    expect(fx.summary.totalSearchOrders).toBe(42)
    expect(fx.summary.searchOrderShare).toBe(12.5)
  })
})
