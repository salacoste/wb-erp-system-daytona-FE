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
