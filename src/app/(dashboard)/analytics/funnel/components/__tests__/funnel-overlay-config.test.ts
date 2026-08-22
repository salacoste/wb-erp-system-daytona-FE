import { describe, it, expect } from 'vitest'
import {
  mergeFunnelAndAdDaily,
  formatOverlayDate,
  formatCompactRub,
  formatCompactCount,
  fmtCurrency,
  OVERLAY_SERIES,
  OVERLAY_COLORS,
} from '../funnel-overlay-config'
import type { FunnelDayItem } from '@/types/analytics-funnel'
import type { AdvertisingDailyItem } from '@/types/advertising-analytics'

function makeFunnelDay(overrides: Partial<FunnelDayItem> = {}): FunnelDayItem {
  return {
    date: '2026-03-01',
    openCardCount: 100,
    addToCartCount: 50,
    ordersCount: 20,
    buyoutCount: 15,
    cancelCount: 2,
    cartConversion: 50,
    orderConversion: 20,
    buyoutConversion: 15,
    cancelRate: 2,
    totalConversion: 15,
    ...overrides,
  }
}

function makeAdDay(overrides: Partial<AdvertisingDailyItem> = {}): AdvertisingDailyItem {
  return {
    date: '2026-03-01',
    spend: 5000,
    views: 1000,
    clicks: 50,
    orders: 10,
    ...overrides,
  }
}

describe('mergeFunnelAndAdDaily', () => {
  it('merges funnel and ad data by date', () => {
    const funnel = [makeFunnelDay({ date: '2026-03-01' })]
    const ad = [makeAdDay({ date: '2026-03-01', spend: 3000 })]
    const result = mergeFunnelAndAdDaily(funnel, ad)
    expect(result).toHaveLength(1)
    expect(result[0].adSpend).toBe(3000)
    expect(result[0].openCardCount).toBe(100)
  })

  it('returns null adSpend when no ad data for date', () => {
    const funnel = [makeFunnelDay({ date: '2026-03-01' })]
    const ad = [makeAdDay({ date: '2026-03-02', spend: 1000 })]
    const result = mergeFunnelAndAdDaily(funnel, ad)
    expect(result[0].adSpend).toBeNull()
  })

  it('handles undefined ad data', () => {
    const funnel = [makeFunnelDay()]
    const result = mergeFunnelAndAdDaily(funnel, undefined)
    expect(result).toHaveLength(1)
    expect(result[0].adSpend).toBeNull()
  })

  it('handles empty funnel array', () => {
    const result = mergeFunnelAndAdDaily([], [makeAdDay()])
    expect(result).toHaveLength(0)
  })

  it('merges multiple days correctly', () => {
    const funnel = [
      makeFunnelDay({ date: '2026-03-01', ordersCount: 10 }),
      makeFunnelDay({ date: '2026-03-02', ordersCount: 20 }),
      makeFunnelDay({ date: '2026-03-03', ordersCount: 30 }),
    ]
    const ad = [
      makeAdDay({ date: '2026-03-01', spend: 1000 }),
      makeAdDay({ date: '2026-03-03', spend: 3000 }),
    ]
    const result = mergeFunnelAndAdDaily(funnel, ad)
    expect(result).toHaveLength(3)
    expect(result[0].adSpend).toBe(1000)
    expect(result[1].adSpend).toBeNull()
    expect(result[2].adSpend).toBe(3000)
  })

  it('preserves totalConversion from funnel data', () => {
    const funnel = [makeFunnelDay({ totalConversion: 42.5 })]
    const result = mergeFunnelAndAdDaily(funnel, undefined)
    expect(result[0].totalConversion).toBe(42.5)
  })
})

describe('formatOverlayDate', () => {
  it('formats date as DD.MM', () => {
    expect(formatOverlayDate('2026-03-08')).toBe('08.03')
  })

  it('formats single-digit day with leading zero', () => {
    expect(formatOverlayDate('2026-01-05')).toBe('05.01')
  })
})

describe('formatCompactRub', () => {
  it('formats millions', () => {
    expect(formatCompactRub(1_500_000)).toBe('1,5M ₽')
  })

  it('formats thousands', () => {
    expect(formatCompactRub(50_000)).toBe('50K ₽')
  })

  it('formats small values', () => {
    expect(formatCompactRub(500)).toBe('500 ₽')
  })
})

describe('formatCompactCount', () => {
  it('formats millions', () => {
    expect(formatCompactCount(2_500_000)).toBe('2,5M')
  })

  it('formats thousands', () => {
    expect(formatCompactCount(1_500)).toBe('1,5K')
  })

  it('formats small values', () => {
    expect(formatCompactCount(42)).toBe('42')
  })
})

describe('fmtCurrency', () => {
  it('formats as Russian currency', () => {
    const result = fmtCurrency(12500)
    expect(result).toContain('12')
    expect(result).toContain('500')
    expect(result).toContain('₽')
  })
})

describe('OVERLAY_SERIES', () => {
  it('has 4 series with correct axes', () => {
    expect(OVERLAY_SERIES).toHaveLength(4)
    const leftSeries = OVERLAY_SERIES.filter(s => s.axis === 'left')
    const rightSeries = OVERLAY_SERIES.filter(s => s.axis === 'right')
    expect(leftSeries).toHaveLength(3)
    expect(rightSeries).toHaveLength(1)
    expect(rightSeries[0].key).toBe('adSpend')
  })

  it('adSpend has dashed stroke', () => {
    const adSeries = OVERLAY_SERIES.find(s => s.key === 'adSpend')
    expect(adSeries?.strokeDasharray).toBe('6 3')
  })
})

describe('OVERLAY_COLORS', () => {
  it('uses the registered theme-owned chart color roles', () => {
    expect(OVERLAY_COLORS).toEqual({
      openCardCount: 'var(--color-chart-1)',
      ordersCount: 'var(--color-chart-5)',
      buyoutCount: 'var(--color-chart-4)',
      adSpend: 'var(--color-chart-2)',
    })
  })

  it('contains no raw hex series colors', () => {
    for (const color of Object.values(OVERLAY_COLORS)) {
      expect(color).toMatch(/^var\(--color-chart-/)
      expect(color).not.toMatch(/^#/)
    }
  })
})
