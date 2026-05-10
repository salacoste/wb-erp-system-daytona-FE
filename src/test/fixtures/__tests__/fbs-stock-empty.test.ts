/**
 * Consumer-wiring proof for fbs-stock-empty fixture factories.
 * Story 96.11-FE — Pattern 3 § "Testing requirement":
 * shared-fixture module MUST have ≥1 test consuming it in the first downstream
 * test file (proves the wiring before the module accumulates consumers).
 *
 * @see src/test/fixtures/fbs-stock-empty.ts
 * @see src/test/fixtures/__tests__/acquiring-empty.test.ts (precedent pattern)
 */

import { describe, it, expect } from 'vitest'
import {
  emptyFbsStockGroupsResponse,
  emptyFbsStockSizesResponse,
  emptyFbsStockRegionsResponse,
  emptyFbsStockGroupItem,
  emptyFbsStockSizeItem,
  emptyFbsStockRegionItem,
} from '../fbs-stock-empty'

describe('fbs-stock-empty fixtures (Story 96.11-FE — Pattern 3 wiring proof)', () => {
  it('emptyFbsStockGroupsResponse: groups=[], period empty, generatedAt empty', () => {
    const r = emptyFbsStockGroupsResponse()
    expect(r.data.groups).toEqual([])
    expect(r.period.from).toBe('')
    expect(r.period.to).toBe('')
    expect(r.generatedAt).toBe('')
  })

  it('emptyFbsStockSizesResponse: sizes=[], period empty, generatedAt empty', () => {
    const r = emptyFbsStockSizesResponse()
    expect(r.data.sizes).toEqual([])
    expect(r.period.from).toBe('')
    expect(r.period.to).toBe('')
    expect(r.generatedAt).toBe('')
  })

  it('emptyFbsStockRegionsResponse: regions=[], generatedAt empty (no period field)', () => {
    const r = emptyFbsStockRegionsResponse()
    expect(r.data.regions).toEqual([])
    expect(r.generatedAt).toBe('')
  })

  it('emptyFbsStockGroupItem: money/ratio=null, counts=0, string=empty', () => {
    const item = emptyFbsStockGroupItem()
    expect(item.stockValue).toBeNull()
    expect(item.daysOfCover).toBeNull()
    expect(item.skuCount).toBe(0)
    expect(item.stockUnits).toBe(0)
    expect(item.averageDailyOutgoing).toBe(0)
    expect(item.groupName).toBe('')
  })

  it('emptyFbsStockSizeItem: ratio=null, counts=0, strings=empty', () => {
    const item = emptyFbsStockSizeItem()
    expect(item.daysOfCover).toBeNull()
    expect(item.nmId).toBe(0)
    expect(item.skuCount).toBe(0)
    expect(item.stockUnits).toBe(0)
    expect(item.size).toBe('')
  })

  it('emptyFbsStockRegionItem: money/ratio=null, counts=0, string=empty', () => {
    const item = emptyFbsStockRegionItem()
    expect(item.stockValue).toBeNull()
    expect(item.shareOfTotalPct).toBeNull() // ratio — null per CLAUDE.md anti-pattern #8
    expect(item.warehouseCount).toBe(0)
    expect(item.stockUnits).toBe(0)
    expect(item.regionName).toBe('')
  })
})
