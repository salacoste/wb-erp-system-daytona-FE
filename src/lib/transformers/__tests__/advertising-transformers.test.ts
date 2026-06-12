/**
 * Unit tests for advertising-transformers (Epic 37) — coverage added iter-153.
 *
 * Validating transformer (backend unknown → AdvertisingGroup | null) + array transform + type filters.
 * console.warn/error are spied (the transformer logs on invalid input by design). Filter inputs are
 * built THROUGH transformMergedGroups so they're genuinely typed (no casts).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  transformMergedGroup,
  transformMergedGroups,
  filterMergedGroupsOnly,
  filterIndividualProductsOnly,
} from '@/lib/transformers/advertising-transformers'

/** Minimal valid backend item (unknown input — no cast needed) */
const makeItem = (type: 'merged_group' | 'individual', imtId?: number): unknown => ({
  type,
  imtId,
  aggregateMetrics: {},
  products: [],
  mainProduct: { nmId: 100 },
})

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  vi.restoreAllMocks()
})

describe('transformMergedGroup', () => {
  it('returns the item for a valid merged_group (with imtId)', () => {
    const item = makeItem('merged_group', 55)
    expect(transformMergedGroup(item)).toBe(item)
  })
  it('returns the item for a valid individual (imtId not required)', () => {
    const item = makeItem('individual')
    expect(transformMergedGroup(item)).toBe(item)
  })
  it('returns null for an invalid type', () => {
    expect(
      transformMergedGroup({ ...(makeItem('merged_group', 1) as object), type: 'bogus' })
    ).toBeNull()
  })
  it('returns null when aggregateMetrics is missing or products is not an array', () => {
    expect(
      transformMergedGroup({ type: 'individual', products: [], mainProduct: { nmId: 1 } })
    ).toBeNull()
    expect(
      transformMergedGroup({
        type: 'individual',
        aggregateMetrics: {},
        products: 'x',
        mainProduct: { nmId: 1 },
      })
    ).toBeNull()
  })
  it('returns null for a merged_group missing imtId', () => {
    expect(transformMergedGroup(makeItem('merged_group'))).toBeNull()
  })
  it('returns null when mainProduct.nmId is missing', () => {
    expect(
      transformMergedGroup({
        type: 'individual',
        aggregateMetrics: {},
        products: [],
        mainProduct: {},
      })
    ).toBeNull()
  })
})

describe('transformMergedGroups', () => {
  it('returns [] for non-array input', () => {
    expect(transformMergedGroups('nope' as unknown as unknown[])).toEqual([])
  })

  it('does not warn per invalid row during batch transforms', () => {
    transformMergedGroups([
      { type: 'individual', products: [], mainProduct: { nmId: 1 } },
      { type: 'individual', aggregateMetrics: {}, products: 'x', mainProduct: { nmId: 1 } },
      makeItem('individual'),
    ])

    expect(console.warn).not.toHaveBeenCalled()
  })

  it('normalizes flat individual imtId rows into single-product groups', () => {
    const result = transformMergedGroups([
      {
        type: 'individual',
        sku_id: '906010371',
        imtId: 1177392390,
        product_name: 'PLB20',
        views: 3284,
        clicks: 380,
        orders: 18,
        spend: 2523,
        revenue: 10065,
        total_sales: 61372.94,
        organic_sales: 51307.94,
        organic_contribution: 83.6,
        roas: 3.99,
        roi: 298.93,
        ctr: 11.57,
        cpc: 6.64,
        conversion_rate: 4.74,
        profit_after_ads: -103623.03,
      },
    ])

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      type: 'individual',
      imtId: 1177392390,
      productCount: 1,
      mainProduct: { nmId: 906010371, vendorCode: 'PLB20' },
      aggregateMetrics: { totalSpend: 2523, totalSales: 61372.94 },
    })
    expect(result[0].products).toHaveLength(1)
    expect(result[0].products[0]).toMatchObject({ nmId: 906010371, totalSpend: 2523 })
  })

  it('normalizes flat merged_group rows with mergedProducts into renderable groups', () => {
    const result = transformMergedGroups([
      {
        type: 'merged_group',
        imtId: 303077974,
        label: 'MK-400-Gray (склейка)',
        mainProduct: { nmId: 321678606, vendorCode: 'MK-400-Gray' },
        productCount: 2,
        mergedProducts: [
          { nmId: 321678606, vendorCode: 'MK-400-Gray', spend: 865, revenue: 10571, orders: 13 },
          { nmId: 785293635, vendorCode: 'MK-400-White', spend: 218, revenue: 16825, orders: 22 },
        ],
        views: 16343,
        clicks: 746,
        orders: 70,
        spend: 7390,
        revenue: 42589,
        totalSales: 67240.82,
        organicSales: 24651.82,
        organicContribution: 36.66,
        roas: 5.76,
        roi: 476.31,
        ctr: 4.56,
        cpc: 9.91,
        conversionRate: 9.38,
        profitAfterAds: -102790.96,
      },
    ])

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      type: 'merged_group',
      imtId: 303077974,
      productCount: 2,
      aggregateMetrics: { totalSpend: 7390, totalRevenue: 42589, totalSales: 67240.82 },
    })
    expect(result[0].products).toHaveLength(2)
    expect(result[0].products[0]).toMatchObject({ nmId: 321678606, isMainProduct: true })
  })

  it('keeps merged_group rows with imtId 0', () => {
    const nested = transformMergedGroups([
      {
        type: 'merged_group',
        imtId: 0,
        aggregateMetrics: {},
        products: [{ nmId: 1, vendorCode: 'VC-001' }],
        mainProduct: { nmId: 1, vendorCode: 'VC-001' },
      },
    ])

    const flat = transformMergedGroups([
      {
        type: 'merged_group',
        imtId: 0,
        mainProduct: { nmId: 1, vendorCode: 'VC-001' },
        mergedProducts: [{ nmId: 1, vendorCode: 'VC-001' }],
      },
    ])

    expect(nested).toHaveLength(1)
    expect(nested[0].imtId).toBe(0)
    expect(flat).toHaveLength(1)
    expect(flat[0].imtId).toBe(0)
  })

  it('does not invent a main product when flat merged_group omits mainProduct', () => {
    const result = transformMergedGroups([
      {
        type: 'merged_group',
        imtId: 303077974,
        productCount: 2,
        mergedProducts: [
          { nmId: 321678606, vendorCode: 'MK-400-Gray' },
          { nmId: 785293635, vendorCode: 'MK-400-White' },
        ],
        spend: 7390,
      },
    ])

    expect(result).toHaveLength(1)
    expect(result[0].mainProduct).toEqual({ nmId: 0, vendorCode: '—', name: undefined })
    expect(result[0].products).toHaveLength(2)
    expect(result[0].products.every(product => product.isMainProduct === false)).toBe(true)
  })

  it('keeps valid items and drops invalid ones', () => {
    const result = transformMergedGroups([
      makeItem('merged_group', 1),
      { type: 'bogus' },
      makeItem('individual'),
      makeItem('merged_group'), // missing imtId → dropped
    ])
    expect(result).toHaveLength(2)
    expect(result.map(g => g.type)).toEqual(['merged_group', 'individual'])
  })
})

describe('filters', () => {
  const groups = transformMergedGroups([
    makeItem('merged_group', 1),
    makeItem('individual'),
    makeItem('merged_group', 2),
  ])
  it('filterMergedGroupsOnly keeps only merged_group', () => {
    const r = filterMergedGroupsOnly(groups)
    expect(r).toHaveLength(2)
    expect(r.every(g => g.type === 'merged_group')).toBe(true)
  })
  it('filterIndividualProductsOnly keeps only individual', () => {
    const r = filterIndividualProductsOnly(groups)
    expect(r).toHaveLength(1)
    expect(r[0].type).toBe('individual')
  })
})
