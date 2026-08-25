import { describe, it, expect } from 'vitest'
import {
  computeKeywordOverlap,
  computePositionSpendCorrelation,
  classifyCannibalization,
  interpretCorrelation,
} from '../ad-search-correlation-utils'
import type { CrossReferenceItem } from '../cross-reference-utils'

function makeItem(overrides: Partial<CrossReferenceItem> = {}): CrossReferenceItem {
  return {
    nmId: 100,
    vendorCode: 'VC-100',
    totalOrders: 10,
    uniqueQueries: 5,
    adSpend: 1000,
    adClicks: 50,
    adRevenue: 500,
    channel: 'both',
    organicContribution: 60,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// computeKeywordOverlap
// ---------------------------------------------------------------------------

describe('computeKeywordOverlap', () => {
  it('returns 0 jaccard for two empty arrays', () => {
    const result = computeKeywordOverlap([], [])
    expect(result.jaccard).toBe(0)
    expect(result.intersection).toEqual([])
    expect(result.unionSize).toBe(0)
  })

  it('returns 0 jaccard for disjoint sets', () => {
    const result = computeKeywordOverlap(['футболка'], ['джинсы'])
    expect(result.jaccard).toBe(0)
    expect(result.intersection).toEqual([])
    expect(result.unionSize).toBe(2)
  })

  it('returns 1 for identical sets', () => {
    const result = computeKeywordOverlap(['футболка', 'носки'], ['футболка', 'носки'])
    expect(result.jaccard).toBe(1)
    expect(result.intersection).toHaveLength(2)
    expect(result.unionSize).toBe(2)
  })

  it('computes partial overlap correctly', () => {
    const result = computeKeywordOverlap(
      ['футболка', 'носки', 'шорты'],
      ['футболка', 'джинсы', 'шорты', 'куртка']
    )
    // intersection: футболка, шорты (2)
    // union: 3 + 4 - 2 = 5
    expect(result.jaccard).toBeCloseTo(2 / 5)
    expect(result.intersection).toHaveLength(2)
    expect(result.unionSize).toBe(5)
  })

  it('is case-insensitive and trims whitespace', () => {
    const result = computeKeywordOverlap(['Футболка '], [' футболка'])
    expect(result.jaccard).toBe(1)
    expect(result.intersection).toEqual(['футболка'])
  })
})

// ---------------------------------------------------------------------------
// computePositionSpendCorrelation
// ---------------------------------------------------------------------------

describe('computePositionSpendCorrelation', () => {
  it('returns null when fewer than 3 data points', () => {
    const items = [makeItem({ nmId: 1 }), makeItem({ nmId: 2 })]
    const result = computePositionSpendCorrelation(items)
    expect(result.pearsonR).toBeNull()
    expect(result.sampleSize).toBe(2)
    expect(result.label).toBe('Недостаточно данных')
  })

  it('returns null for zero-variance data', () => {
    // All same totalOrders and adSpend
    const items = Array.from({ length: 5 }, (_, i) =>
      makeItem({ nmId: i + 1, totalOrders: 10, adSpend: 1000 })
    )
    const result = computePositionSpendCorrelation(items)
    expect(result.pearsonR).toBeNull()
    expect(result.label).toBe('Нет вариации данных')
  })

  it('detects positive correlation', () => {
    // More organic orders → more ad spend
    const items = [
      makeItem({ nmId: 1, totalOrders: 5, adSpend: 500 }),
      makeItem({ nmId: 2, totalOrders: 10, adSpend: 1000 }),
      makeItem({ nmId: 3, totalOrders: 15, adSpend: 1500 }),
      makeItem({ nmId: 4, totalOrders: 20, adSpend: 2000 }),
    ]
    const result = computePositionSpendCorrelation(items)
    expect(result.pearsonR).toBeCloseTo(1, 1)
    expect(result.sampleSize).toBe(4)
  })

  it('detects negative correlation', () => {
    // More organic orders → less ad spend
    const items = [
      makeItem({ nmId: 1, totalOrders: 20, adSpend: 500 }),
      makeItem({ nmId: 2, totalOrders: 15, adSpend: 1000 }),
      makeItem({ nmId: 3, totalOrders: 10, adSpend: 1500 }),
      makeItem({ nmId: 4, totalOrders: 5, adSpend: 2000 }),
    ]
    const result = computePositionSpendCorrelation(items)
    expect(result.pearsonR).toBeCloseTo(-1, 1)
  })

  it('clamps pearsonR to [-1, 1]', () => {
    const items = [
      makeItem({ nmId: 1, totalOrders: 1, adSpend: 100 }),
      makeItem({ nmId: 2, totalOrders: 2, adSpend: 200 }),
      makeItem({ nmId: 3, totalOrders: 3, adSpend: 300 }),
    ]
    const result = computePositionSpendCorrelation(items)
    expect(result.pearsonR).toBeGreaterThanOrEqual(-1)
    expect(result.pearsonR).toBeLessThanOrEqual(1)
  })

  it('filters out items with 0 orders AND 0 spend', () => {
    const items = [
      makeItem({ nmId: 1, totalOrders: 0, adSpend: 0 }),
      makeItem({ nmId: 2, totalOrders: 0, adSpend: 0 }),
      makeItem({ nmId: 3, totalOrders: 10, adSpend: 500 }),
    ]
    const result = computePositionSpendCorrelation(items)
    expect(result.sampleSize).toBe(1)
    expect(result.pearsonR).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// classifyCannibalization
// ---------------------------------------------------------------------------

describe('classifyCannibalization', () => {
  it('returns empty array when no both-channel items', () => {
    const items = [
      makeItem({ nmId: 1, channel: 'organic', adSpend: 0 }),
      makeItem({ nmId: 2, channel: 'ad', adSpend: 500 }),
    ]
    expect(classifyCannibalization(items)).toEqual([])
  })

  it('returns empty array when all adSpend is 0', () => {
    const items = [makeItem({ nmId: 1, channel: 'both', adSpend: 0 })]
    expect(classifyCannibalization(items)).toEqual([])
  })

  it('classifies high risk for high organic + top-quartile spend', () => {
    const items = Array.from({ length: 10 }, (_, i) =>
      makeItem({
        nmId: i + 1,
        channel: 'both',
        organicContribution: i === 9 ? 80 : 30, // item 10 has high organic
        adSpend: i === 9 ? 10000 : 100 + i * 100, // item 10 has highest spend
      })
    )
    const result = classifyCannibalization(items)
    const highRisk = result.find(r => r.nmId === 10)
    expect(highRisk?.risk).toBe('high')
  })

  it('classifies medium risk for moderate organic + above-median spend', () => {
    const items = Array.from({ length: 6 }, (_, i) =>
      makeItem({
        nmId: i + 1,
        channel: 'both',
        organicContribution: i < 3 ? 55 : 20,
        adSpend: i < 3 ? 2000 : 500,
      })
    )
    const result = classifyCannibalization(items)
    const mediumRisk = result.filter(r => r.risk === 'medium')
    expect(mediumRisk.length).toBeGreaterThanOrEqual(1)
  })

  it('classifies low risk for low organic or low spend', () => {
    const items = [
      makeItem({ nmId: 1, channel: 'both', organicContribution: 10, adSpend: 100 }),
      makeItem({ nmId: 2, channel: 'both', organicContribution: 20, adSpend: 200 }),
      makeItem({ nmId: 3, channel: 'both', organicContribution: 30, adSpend: 300 }),
    ]
    const result = classifyCannibalization(items)
    const lowRisk = result.filter(r => r.risk === 'low')
    expect(lowRisk.length).toBe(3)
  })

  it('preserves null organicContribution as null in result', () => {
    const items = [
      makeItem({ nmId: 1, channel: 'both', adSpend: 100, organicContribution: undefined }),
      makeItem({ nmId: 2, channel: 'both', adSpend: 200, organicContribution: 50 }),
      makeItem({ nmId: 3, channel: 'both', adSpend: 300, organicContribution: 60 }),
    ]
    const result = classifyCannibalization(items)
    const nullItem = result.find(r => r.nmId === 1)
    expect(nullItem?.organicContribution).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Story 170.6-FE: unified correlation taxonomy (source-contract — the chart's
// CorrelationBadge consumes interpretCorrelation for BOTH label and tint).
// ---------------------------------------------------------------------------

describe('interpretCorrelation — unified taxonomy (170.6)', () => {
  it('label bands: 0.2/0.4/0.6/0.8 thresholds with util wording (no «Заметная»)', () => {
    expect(interpretCorrelation(0.1).label).toBe('Очень слабая корреляция')
    expect(interpretCorrelation(0.3).label).toBe('Слабая корреляция')
    expect(interpretCorrelation(0.5).label).toBe('Умеренная корреляция')
    expect(interpretCorrelation(0.7).label).toBe('Сильная корреляция')
    expect(interpretCorrelation(0.9).label).toBe('Очень сильная корреляция')
    expect(interpretCorrelation(-0.5).label).toBe('Умеренная корреляция') // |r|
  })

  it('tint bands: |r|<0.4 muted, 0.4–<0.8 status-warning /15+/30, ≥0.8 status-error /15+/30', () => {
    expect(interpretCorrelation(0.1).badgeClassName).toBe(
      'bg-muted text-muted-foreground border-border'
    )
    expect(interpretCorrelation(0.3).badgeClassName).toBe(
      'bg-muted text-muted-foreground border-border'
    )
    expect(interpretCorrelation(0.5).badgeClassName).toBe(
      'bg-status-warning/15 text-status-warning border-status-warning/30'
    )
    expect(interpretCorrelation(0.7).badgeClassName).toBe(
      'bg-status-warning/15 text-status-warning border-status-warning/30'
    )
    expect(interpretCorrelation(0.85).badgeClassName).toBe(
      'bg-status-error/15 text-status-error border-status-error/30'
    )
  })
})
