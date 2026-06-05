import { describe, it, expect } from 'vitest'
import {
  mergeSearchAndAdData,
  computeOverlapSummary,
  getTopWastedSpend,
  fmtCurrency,
  classifyCannibalization,
} from '../cross-reference-utils'
import type { SearchOrderItem } from '@/types/search-analytics'
import type { AdvertisingItem } from '@/types/advertising-analytics'

function makeSearchItem(overrides: Partial<SearchOrderItem> = {}): SearchOrderItem {
  return {
    key: 100,
    totalOrders: 10,
    vendorCode: 'VC-100',
    uniqueQueries: 5,
    ...overrides,
  }
}

function makeAdItem(overrides: Partial<AdvertisingItem> = {}): AdvertisingItem {
  return {
    key: 'sku:200',
    imtId: null,
    spend: 1000,
    revenue: 500,
    total_sales: 800,
    organic_sales: 300,
    organic_contribution: 37.5,
    profit: 300,
    orders: 10,
    clicks: 100,
    views: 1000,
    ctr: 10,
    cpc: 10,
    roas: 0.5,
    roi: -0.5,
    conversion_rate: 10,
    profit_after_ads: -700,
    // iter-129: 'profitable' is NOT a valid EfficiencyStatus (the `as` cast masked it). roi -0.5 /
    // profit_after_ads -700 are negative → 'loss' is the contract-valid, semantically-correct value.
    efficiency_status: 'loss',
    ...overrides,
  } as AdvertisingItem
}

describe('mergeSearchAndAdData', () => {
  it('returns empty array when both inputs are empty', () => {
    expect(mergeSearchAndAdData([], [])).toEqual([])
  })

  it('classifies organic-only items correctly', () => {
    const search = [makeSearchItem({ key: 100, vendorCode: 'VC-100' })]
    const result = mergeSearchAndAdData(search, [])
    expect(result).toHaveLength(1)
    expect(result[0].channel).toBe('organic')
    expect(result[0].nmId).toBe(100)
    expect(result[0].vendorCode).toBe('VC-100')
    expect(result[0].adSpend).toBe(0)
  })

  it('classifies ad-only items correctly', () => {
    const ad = [makeAdItem({ key: 'sku:200', spend: 500, clicks: 50 })]
    const result = mergeSearchAndAdData([], ad)
    expect(result).toHaveLength(1)
    expect(result[0].channel).toBe('ad')
    expect(result[0].nmId).toBe(200)
    expect(result[0].adSpend).toBe(500)
    expect(result[0].adClicks).toBe(50)
  })

  it('preserves null adRevenue when an ad ran but revenue is unknown; 0 for organic (iter-129)', () => {
    // ad ran but WB returned no revenue → null (rendered "—"), NOT a fabricated 0 ₽
    const adNull = mergeSearchAndAdData([], [makeAdItem({ key: 'sku:400', revenue: null })])
    expect(adNull[0].adRevenue).toBeNull()
    // ad ran with a real revenue → preserved
    const adNum = mergeSearchAndAdData([], [makeAdItem({ key: 'sku:401', revenue: 5000 })])
    expect(adNum[0].adRevenue).toBe(5000)
    // organic row (no ad item) → genuine 0 ad-revenue (a known zero, not unknown)
    const organic = mergeSearchAndAdData([makeSearchItem({ key: 500 })], [])
    expect(organic[0].adRevenue).toBe(0)
  })

  it('classifies both-channel items when nmId matches', () => {
    const search = [makeSearchItem({ key: 300, totalOrders: 15, uniqueQueries: 8 })]
    const ad = [makeAdItem({ key: 'sku:300', spend: 2000, clicks: 200 })]
    const result = mergeSearchAndAdData(search, ad)
    expect(result).toHaveLength(1)
    expect(result[0].channel).toBe('both')
    expect(result[0].totalOrders).toBe(15)
    expect(result[0].adSpend).toBe(2000)
  })

  it('handles mixed items with different nmIds', () => {
    const search = [
      makeSearchItem({ key: 100, vendorCode: 'VC-100' }),
      makeSearchItem({ key: 300, vendorCode: 'VC-300' }),
    ]
    const ad = [
      makeAdItem({ key: 'sku:200', spend: 500 }),
      makeAdItem({ key: 'sku:300', spend: 1500 }),
    ]
    const result = mergeSearchAndAdData(search, ad)
    expect(result).toHaveLength(3)

    const channels = result.map(r => r.channel).sort()
    expect(channels).toEqual(['ad', 'both', 'organic'])
  })

  it('sorts by adSpend DESC by default', () => {
    const search = [makeSearchItem({ key: 100 })]
    const ad = [
      makeAdItem({ key: 'sku:200', spend: 100 }),
      makeAdItem({ key: 'sku:300', spend: 5000 }),
    ]
    const result = mergeSearchAndAdData(search, ad)
    expect(result[0].adSpend).toBe(5000)
    expect(result[result.length - 1].adSpend).toBe(0)
  })

  it('ignores ad items with invalid key format', () => {
    const ad = [makeAdItem({ key: 'campaign:123', spend: 999 })]
    const result = mergeSearchAndAdData([], ad)
    expect(result).toHaveLength(0)
  })
})

describe('computeOverlapSummary', () => {
  it('returns zeros for empty array', () => {
    const summary = computeOverlapSummary([])
    expect(summary).toEqual({ organicOnly: 0, adOnly: 0, both: 0, total: 0 })
  })

  it('counts channels correctly', () => {
    const search = [makeSearchItem({ key: 100 }), makeSearchItem({ key: 200 })]
    const ad = [
      makeAdItem({ key: 'sku:200', spend: 100 }),
      makeAdItem({ key: 'sku:300', spend: 200 }),
      makeAdItem({ key: 'sku:400', spend: 300 }),
    ]
    const merged = mergeSearchAndAdData(search, ad)
    const summary = computeOverlapSummary(merged)
    expect(summary.organicOnly).toBe(1) // nmId 100
    expect(summary.adOnly).toBe(2) // nmId 300, 400
    expect(summary.both).toBe(1) // nmId 200
    expect(summary.total).toBe(4)
  })
})

describe('getTopWastedSpend', () => {
  it('returns empty array when no both-channel items', () => {
    const search = [makeSearchItem({ key: 100 })]
    const merged = mergeSearchAndAdData(search, [])
    expect(getTopWastedSpend(merged)).toEqual([])
  })

  it('returns only both-channel items with ad spend > 0', () => {
    const search = [makeSearchItem({ key: 100 }), makeSearchItem({ key: 200 })]
    const ad = [
      makeAdItem({ key: 'sku:100', spend: 3000 }),
      makeAdItem({ key: 'sku:200', spend: 1000 }),
      makeAdItem({ key: 'sku:300', spend: 5000 }),
    ]
    const merged = mergeSearchAndAdData(search, ad)
    const top = getTopWastedSpend(merged)
    // Only 100 and 200 are 'both', 300 is 'ad' only
    expect(top).toHaveLength(2)
    expect(top[0].adSpend).toBe(3000)
    expect(top[1].adSpend).toBe(1000)
  })

  it('respects limit parameter', () => {
    const search = Array.from({ length: 10 }, (_, i) => makeSearchItem({ key: i + 1 }))
    const ad = Array.from({ length: 10 }, (_, i) =>
      makeAdItem({ key: `sku:${i + 1}`, spend: (i + 1) * 100 })
    )
    const merged = mergeSearchAndAdData(search, ad)
    const top3 = getTopWastedSpend(merged, 3)
    expect(top3).toHaveLength(3)
    expect(top3[0].adSpend).toBe(1000)
  })

  it('sorts by adSpend DESC', () => {
    const search = [
      makeSearchItem({ key: 1 }),
      makeSearchItem({ key: 2 }),
      makeSearchItem({ key: 3 }),
    ]
    const ad = [
      makeAdItem({ key: 'sku:1', spend: 500 }),
      makeAdItem({ key: 'sku:2', spend: 3000 }),
      makeAdItem({ key: 'sku:3', spend: 1500 }),
    ]
    const merged = mergeSearchAndAdData(search, ad)
    const top = getTopWastedSpend(merged)
    expect(top[0].adSpend).toBe(3000)
    expect(top[1].adSpend).toBe(1500)
    expect(top[2].adSpend).toBe(500)
  })
})

describe('fmtCurrency', () => {
  it('formats whole rubles with a NON-breaking space before ₽ (never a regular U+0020)', () => {
    const s = fmtCurrency(1234567)
    expect(s).toContain('₽')
    expect(s).toMatch(/1\s234\s567/) // NBSP thousands separators
    // regression: the ₽ must NOT be preceded by a regular space (it would wrap to a new line)
    expect(s).not.toContain(' ₽')
    // NBSP (U+00A0) or narrow NBSP (U+202F) before ₽, per Intl currency style
    expect(s).toMatch(/[\u00a0\u202f]₽/)
    // thousands separators must also be non-breaking (no regular space between digits)
    expect(s).not.toMatch(/\d \d/)
  })

  it('renders no decimals (whole rubles)', () => {
    expect(fmtCurrency(1234.56)).not.toMatch(/[.,]\d/)
  })

  it('handles zero and negative amounts with a non-breaking space before ₽', () => {
    expect(fmtCurrency(0)).toMatch(/^0[\u00a0\u202f]₽$/)
    const neg = fmtCurrency(-500)
    expect(neg).toContain('₽')
    expect(neg).toMatch(/[\u00a0\u202f]₽/)
    expect(neg).not.toContain(' ₽')
  })

  it('renders "—" for null (unknown), not "0 ₽" (iter-129)', () => {
    expect(fmtCurrency(null)).toBe('—')
  })
})

describe('classifyCannibalization (Story 121.2-FE)', () => {
  function makeItem(o: { organicContribution?: number | null; adSpend?: number } = {}) {
    return {
      nmId: 1,
      vendorCode: null,
      totalOrders: 10,
      uniqueQueries: null,
      adSpend: o.adSpend ?? 1000,
      adClicks: 50,
      adRevenue: null,
      organicContribution: o.organicContribution ?? null,
      channel: 'both' as const,
    }
  }

  it('returns "high" when organicContribution > 70% and spend > 0', () => {
    expect(classifyCannibalization(makeItem({ organicContribution: 85, adSpend: 500 }))).toBe(
      'high'
    )
  })

  it('returns "medium" when organicContribution is 40-70% and spend > 0', () => {
    expect(classifyCannibalization(makeItem({ organicContribution: 55, adSpend: 200 }))).toBe(
      'medium'
    )
  })

  it('returns "low" when organicContribution <= 40% and spend > 0', () => {
    expect(classifyCannibalization(makeItem({ organicContribution: 20, adSpend: 300 }))).toBe('low')
  })

  it('returns "low" when organicContribution is null (no ad data)', () => {
    expect(classifyCannibalization(makeItem({ organicContribution: null }))).toBe('low')
  })

  it('returns "low" when spend is 0 (organic-only product)', () => {
    expect(classifyCannibalization(makeItem({ organicContribution: 80, adSpend: 0 }))).toBe('low')
  })
})
