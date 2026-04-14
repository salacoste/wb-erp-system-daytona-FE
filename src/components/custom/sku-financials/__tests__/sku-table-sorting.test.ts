/**
 * sortSkuData — null handling tests
 * Story 87.3-FE AC-4: rows with null profit (missing COGS) pile at the bottom
 * when sorting by profit, regardless of sort order.
 */

import { describe, it, expect } from 'vitest'
import { sortSkuData, type SortField } from '../sku-table-sorting'
import type { SkuFinancialItem } from '@/types/sku-financials'

function makeItem(
  nmId: number,
  profit: Partial<SkuFinancialItem['profit']> = {}
): SkuFinancialItem {
  return {
    nmId,
    productName: `Product ${nmId}`,
    category: 'cat',
    brand: 'brand',
    quantity: { salesQty: 10, returnsQty: 0 },
    revenue: { gross: 10000, net: 9000 },
    costs: {
      cogs: 4000,
      logistics: 500,
      storage: 100,
      penalties: 0,
      paidAcceptance: 0,
      otherAdjustments: 0,
    },
    profit: { gross: 5000, operating: 4400, operatingMarginPct: 48.9, ...profit },
    profitabilityStatus: 'excellent',
    missingCogs: false,
  }
}

describe('sortSkuData — null profit handling (Story 87.3-FE AC-4)', () => {
  const fields: SortField[] = ['operatingProfit', 'grossProfit', 'operatingMarginPct']

  fields.forEach(field => {
    it(`pushes null profit rows to bottom in desc sort (field=${field})`, () => {
      const data = [
        makeItem(1, {
          [field === 'operatingMarginPct'
            ? 'operatingMarginPct'
            : field === 'grossProfit'
              ? 'gross'
              : 'operating']: null,
        }),
        makeItem(2, { operating: 500, gross: 700, operatingMarginPct: 25 }),
        makeItem(3, { operating: 1000, gross: 1200, operatingMarginPct: 50 }),
      ]
      const sorted = sortSkuData(data, field, 'desc')
      // Null row should be LAST
      expect(sorted[sorted.length - 1].nmId).toBe(1)
    })

    it(`pushes null profit rows to bottom in asc sort (field=${field})`, () => {
      const data = [
        makeItem(1, {
          [field === 'operatingMarginPct'
            ? 'operatingMarginPct'
            : field === 'grossProfit'
              ? 'gross'
              : 'operating']: null,
        }),
        makeItem(2, { operating: 500, gross: 700, operatingMarginPct: 25 }),
        makeItem(3, { operating: 1000, gross: 1200, operatingMarginPct: 50 }),
      ]
      const sorted = sortSkuData(data, field, 'asc')
      // Null row should also be LAST (not first) — missing COGS shouldn't hide at top
      expect(sorted[sorted.length - 1].nmId).toBe(1)
    })
  })

  it('sorts normally when no nulls present', () => {
    const data = [
      makeItem(1, { operating: 100 }),
      makeItem(2, { operating: 300 }),
      makeItem(3, { operating: 200 }),
    ]
    const sorted = sortSkuData(data, 'operatingProfit', 'desc')
    expect(sorted.map(i => i.nmId)).toEqual([2, 3, 1])
  })

  it('handles multiple null rows together at the bottom', () => {
    const data = [
      makeItem(1, { operating: null }),
      makeItem(2, { operating: 500 }),
      makeItem(3, { operating: null }),
      makeItem(4, { operating: 1000 }),
    ]
    const sorted = sortSkuData(data, 'operatingProfit', 'desc')
    // Non-null rows first (sorted desc), then null rows
    expect(sorted[0].nmId).toBe(4)
    expect(sorted[1].nmId).toBe(2)
    // Last two are nulls (order among nulls not guaranteed, check set)
    const nullIds = [sorted[2].nmId, sorted[3].nmId].sort()
    expect(nullIds).toEqual([1, 3])
  })

  it('sorts by productName (non-numeric field) normally', () => {
    const data = [makeItem(1), makeItem(2), makeItem(3)]
    data[0].productName = 'Charlie'
    data[1].productName = 'Alpha'
    data[2].productName = 'Bravo'
    const sorted = sortSkuData(data, 'productName', 'asc')
    expect(sorted.map(i => i.productName)).toEqual(['Alpha', 'Bravo', 'Charlie'])
  })
})
