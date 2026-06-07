/**
 * Boundary Normalizer Tests — FBS Enhanced Analytics — Epic 129-FE Story 129.3
 *
 * Verifies normalizeFbsEnhancedResponse in fbs-enhanced-normalizer.ts:
 *   - Dual-lookup: both snake_case and camelCase inputs normalize correctly.
 *   - Null-preservation: ratio/money fields preserve null (anti-pattern #8).
 *   - Count coercion: count fields default to 0 on missing/null input.
 *   - Empty arrays: missing/malformed arrays produce empty arrays (no crash).
 *   - Funnel derivation: funnelData derived from orderStats when no separate section.
 *   - Query key factory: cabinetId scoping (Story 96.11 H2-1 multi-tenant lesson).
 *
 * Updated to match real backend contract per Request #202.
 * Pattern 3 wiring: emptyFbsEnhancedResponse imported from fbs-enhanced-empty.ts.
 */

import { describe, it, expect } from 'vitest'
import { normalizeFbsEnhancedResponse } from '../fbs-enhanced-normalizer'
import { fbsEnhancedQueryKeys } from '../fbs-enhanced'
import { emptyFbsEnhancedResponse } from '@/test/fixtures/fbs-enhanced-empty'

// ---------------------------------------------------------------------------
// Happy-path snake_case input
// ---------------------------------------------------------------------------

describe('normalizeFbsEnhancedResponse — snake_case input', () => {
  it('maps all 5 sections from snake_case to camelCase frontend shape', () => {
    const raw = {
      order_stats: {
        orders_count: 100,
        orders_sum_rub: 150500.0,
        cancel_count: 10,
        cancel_rate: 10.0,
        buyout_count: 80,
        buyout_rate: 80.0,
        avg_order_value: 1500.5,
        add_to_cart_percent: 25.0,
        orders_percent: 5.0,
      },
      stock_analytics: {
        total_stock: 500,
        available_stock: 400,
        reserved_stock: 80,
        in_transit: 20,
        product_count: 50,
      },
      regional_data: [{ region: 'Центральный', quantity: 450, percentage: 45.0 }],
      calculated_metrics: {
        turnover_rate: 2.5,
        stock_coverage_days: 30.0,
        orders_per_product: 1.8,
      },
      funnel_data: {
        add_to_cart_percent: 25.0,
        orders_percent: 5.0,
      },
      period: { from: '2026-04-01', to: '2026-04-30' },
      generated_at: '2026-04-30T12:00:00Z',
    }

    const result = normalizeFbsEnhancedResponse(raw)

    expect(result.orderStats.ordersCount).toBe(100)
    expect(result.orderStats.ordersSumRub).toBe(150500.0)
    expect(result.orderStats.cancelCount).toBe(10)
    expect(result.orderStats.cancelRate).toBe(10.0)
    expect(result.orderStats.buyoutCount).toBe(80)
    expect(result.orderStats.buyoutRate).toBe(80.0)
    expect(result.orderStats.avgOrderValue).toBe(1500.5)
    expect(result.orderStats.addToCartPercent).toBe(25.0)
    expect(result.orderStats.ordersPercent).toBe(5.0)

    expect(result.stockAnalytics.totalStock).toBe(500)
    expect(result.stockAnalytics.availableStock).toBe(400)
    expect(result.stockAnalytics.reservedStock).toBe(80)
    expect(result.stockAnalytics.inTransit).toBe(20)
    expect(result.stockAnalytics.productCount).toBe(50)

    expect(result.regionalData).toHaveLength(1)
    expect(result.regionalData[0].region).toBe('Центральный')
    expect(result.regionalData[0].quantity).toBe(450)
    expect(result.regionalData[0].percentage).toBe(45.0)

    expect(result.calculatedMetrics.turnoverRate).toBe(2.5)
    expect(result.calculatedMetrics.stockCoverageDays).toBe(30.0)
    expect(result.calculatedMetrics.ordersPerProduct).toBe(1.8)

    expect(result.funnelData.addToCartPercent).toBe(25.0)
    expect(result.funnelData.ordersPercent).toBe(5.0)

    expect(result.period.from).toBe('2026-04-01')
    expect(result.period.to).toBe('2026-04-30')
    expect(result.generatedAt).toBe('2026-04-30T12:00:00Z')
  })
})

// ---------------------------------------------------------------------------
// Happy-path camelCase input (dual-lookup fallback)
// ---------------------------------------------------------------------------

describe('normalizeFbsEnhancedResponse — camelCase input', () => {
  it('maps all 5 sections from camelCase to frontend shape', () => {
    const raw = {
      orderStats: {
        ordersCount: 50,
        ordersSumRub: 100000.0,
        cancelCount: 5,
        cancelRate: 10.0,
        buyoutCount: 40,
        buyoutRate: 80.0,
        avgOrderValue: 2000.0,
        addToCartPercent: 20.0,
        ordersPercent: 3.5,
      },
      stockAnalytics: {
        totalStock: 200,
        availableStock: 150,
        reservedStock: 30,
        inTransit: 20,
        productCount: 20,
      },
      regionalData: [{ region: 'Сибирь', quantity: 100, percentage: 20.0 }],
      calculatedMetrics: {
        turnoverRate: 1.5,
        stockCoverageDays: 20.0,
        ordersPerProduct: 0.9,
      },
      funnelData: {
        addToCartPercent: 20.0,
        ordersPercent: 3.5,
      },
      period: { from: '2026-03-01', to: '2026-03-31' },
      generatedAt: '2026-03-31T10:00:00Z',
    }

    const result = normalizeFbsEnhancedResponse(raw)

    expect(result.orderStats.ordersCount).toBe(50)
    expect(result.orderStats.buyoutRate).toBe(80.0)
    expect(result.stockAnalytics.totalStock).toBe(200)
    expect(result.regionalData[0].region).toBe('Сибирь')
    expect(result.calculatedMetrics.turnoverRate).toBe(1.5)
    expect(result.funnelData.addToCartPercent).toBe(20.0)
    expect(result.generatedAt).toBe('2026-03-31T10:00:00Z')
  })
})

// ---------------------------------------------------------------------------
// Funnel derivation from orderStats (no separate funnelData)
// ---------------------------------------------------------------------------

describe('normalizeFbsEnhancedResponse — funnel derivation', () => {
  it('derives funnelData from orderStats when funnelData is absent', () => {
    const raw = {
      orderStats: {
        ordersCount: 10,
        ordersSumRub: 10000.0,
        cancelCount: 1,
        cancelRate: 10.0,
        buyoutCount: 8,
        buyoutRate: 80.0,
        avgOrderValue: 1000.0,
        addToCartPercent: 30.0,
        ordersPercent: 6.0,
      },
      stockAnalytics: {
        totalStock: 100,
        availableStock: 80,
        reservedStock: 10,
        inTransit: 10,
        productCount: 10,
      },
      regionalData: [],
      calculatedMetrics: { turnoverRate: null, stockCoverageDays: null, ordersPerProduct: null },
      // No funnelData section — normalizer should derive from orderStats
      period: { from: '2026-04-01', to: '2026-04-30' },
      generatedAt: '',
    }

    const result = normalizeFbsEnhancedResponse(raw)

    // Funnel data derived from orderStats fields
    expect(result.funnelData.addToCartPercent).toBe(30.0)
    expect(result.funnelData.ordersPercent).toBe(6.0)
  })

  it('uses separate funnelData when present (not derived)', () => {
    const raw = {
      orderStats: {
        ordersCount: 10,
        ordersSumRub: null,
        cancelCount: 0,
        cancelRate: null,
        buyoutCount: 8,
        buyoutRate: null,
        avgOrderValue: null,
        addToCartPercent: 30.0,
        ordersPercent: 6.0,
      },
      stockAnalytics: {
        totalStock: 100,
        availableStock: 80,
        reservedStock: 10,
        inTransit: 10,
        productCount: 10,
      },
      regionalData: [],
      calculatedMetrics: { turnoverRate: null, stockCoverageDays: null, ordersPerProduct: null },
      funnelData: {
        addToCartPercent: 35.0, // Different from orderStats
        ordersPercent: 7.0,
      },
      period: { from: '2026-04-01', to: '2026-04-30' },
      generatedAt: '',
    }

    const result = normalizeFbsEnhancedResponse(raw)

    // Uses funnelData section, not orderStats
    expect(result.funnelData.addToCartPercent).toBe(35.0)
    expect(result.funnelData.ordersPercent).toBe(7.0)
  })
})

// ---------------------------------------------------------------------------
// Null preservation (CLAUDE.md anti-pattern #8)
// ---------------------------------------------------------------------------

describe('normalizeFbsEnhancedResponse — null preservation', () => {
  it('preserves null on all ratio/money fields', () => {
    const raw = {
      orderStats: {
        ordersCount: 0,
        ordersSumRub: null,
        cancelCount: 0,
        cancelRate: null,
        buyoutCount: 0,
        buyoutRate: null,
        avgOrderValue: null,
        addToCartPercent: null,
        ordersPercent: null,
      },
      stockAnalytics: {
        totalStock: 0,
        availableStock: 0,
        reservedStock: 0,
        inTransit: 0,
        productCount: 0,
      },
      regionalData: [{ region: 'Тест', quantity: 0, percentage: null }],
      calculatedMetrics: {
        turnoverRate: null,
        stockCoverageDays: null,
        ordersPerProduct: null,
      },
      funnelData: { addToCartPercent: null, ordersPercent: null },
      period: { from: '', to: '' },
      generatedAt: '',
    }

    const result = normalizeFbsEnhancedResponse(raw)

    expect(result.orderStats.ordersSumRub).toBeNull()
    expect(result.orderStats.cancelRate).toBeNull()
    expect(result.orderStats.buyoutRate).toBeNull()
    expect(result.orderStats.avgOrderValue).toBeNull()
    expect(result.orderStats.addToCartPercent).toBeNull()
    expect(result.orderStats.ordersPercent).toBeNull()
    expect(result.regionalData[0].percentage).toBeNull()
    expect(result.calculatedMetrics.turnoverRate).toBeNull()
    expect(result.calculatedMetrics.stockCoverageDays).toBeNull()
    expect(result.calculatedMetrics.ordersPerProduct).toBeNull()
    expect(result.funnelData.addToCartPercent).toBeNull()
    expect(result.funnelData.ordersPercent).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Safety / edge cases
// ---------------------------------------------------------------------------

describe('normalizeFbsEnhancedResponse — edge cases', () => {
  it('null/undefined input produces safe empty shape', () => {
    const result = normalizeFbsEnhancedResponse(null)

    expect(result.orderStats.ordersCount).toBe(0)
    expect(result.orderStats.buyoutRate).toBeNull()
    expect(result.stockAnalytics.totalStock).toBe(0)
    expect(result.stockAnalytics.productCount).toBe(0)
    expect(result.regionalData).toEqual([])
    expect(result.calculatedMetrics.turnoverRate).toBeNull()
    expect(result.funnelData.addToCartPercent).toBeNull()
    expect(result.funnelData.ordersPercent).toBeNull()
    expect(result.period.from).toBe('')
    expect(result.generatedAt).toBe('')
  })

  it('missing regionalData array produces empty array (no crash)', () => {
    const result = normalizeFbsEnhancedResponse({ orderStats: {} })
    expect(result.regionalData).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Query key factory — multi-tenant scoping (Story 96.11 H2-1)
// ---------------------------------------------------------------------------

describe('fbsEnhancedQueryKeys — cabinet isolation', () => {
  it('includes cabinetId as first segment', () => {
    const key = fbsEnhancedQueryKeys.view('cab-123', { from: '2026-04-01', to: '2026-04-30' })
    expect(key[0]).toBe('fbs-enhanced')
    expect(key[1]).toBe('cab-123')
  })

  it('null cabinetId produces distinct key from string cabinetId', () => {
    const keyNull = fbsEnhancedQueryKeys.view(null, { from: '2026-04-01', to: '2026-04-30' })
    const keyCab = fbsEnhancedQueryKeys.view('cab-456', { from: '2026-04-01', to: '2026-04-30' })
    expect(keyNull[1]).toBeNull()
    expect(keyCab[1]).toBe('cab-456')
    expect(keyNull).not.toEqual(keyCab)
  })

  it('different cabinetIds produce different keys (prevents cross-cabinet cache leak)', () => {
    const keyA = fbsEnhancedQueryKeys.all('cab-A')
    const keyB = fbsEnhancedQueryKeys.all('cab-B')
    expect(keyA).not.toEqual(keyB)
  })
})

// ---------------------------------------------------------------------------
// Ratio unit-contract lock — percent-points (0-100) NOT divided
// ---------------------------------------------------------------------------

describe('normalizeFbsEnhancedResponse — ratio unit-contract', () => {
  it('preserves buyoutRate 80.0 as 80.0 — NOT divided by 100 (percent-points contract)', () => {
    // Contract per Request #202: backend sends percent-points (0-100).
    // Normalizer preserves the value as-is; formatPercentage() in the UI divides by 100
    // for display only.
    const raw = {
      orderStats: {
        ordersCount: 10,
        ordersSumRub: 10000.0,
        cancelCount: 1,
        cancelRate: 10.0,
        buyoutCount: 8,
        buyoutRate: 80.0,
        avgOrderValue: 1000.0,
        addToCartPercent: 25.0,
        ordersPercent: 5.0,
      },
      stockAnalytics: {
        totalStock: 100,
        availableStock: 80,
        reservedStock: 10,
        inTransit: 10,
        productCount: 5,
      },
      regionalData: [{ region: 'Тест', quantity: 10, percentage: 60.0 }],
      calculatedMetrics: { turnoverRate: 2.0, stockCoverageDays: 15.0, ordersPerProduct: 1.0 },
      funnelData: { addToCartPercent: 25.0, ordersPercent: 5.0 },
      period: { from: '2026-04-01', to: '2026-04-30' },
      generatedAt: '2026-04-30T12:00:00Z',
    }

    const result = normalizeFbsEnhancedResponse(raw)

    // All assertions confirm values are NOT divided — percent-points contract preserved
    expect(result.orderStats.buyoutRate).toBe(80.0)
    expect(result.orderStats.cancelRate).toBe(10.0)
    expect(result.orderStats.addToCartPercent).toBe(25.0)
    expect(result.orderStats.ordersPercent).toBe(5.0)
    expect(result.regionalData[0].percentage).toBe(60.0)
    expect(result.calculatedMetrics.turnoverRate).toBe(2.0)
    expect(result.funnelData.addToCartPercent).toBe(25.0)
    expect(result.funnelData.ordersPercent).toBe(5.0)
  })
})

// ---------------------------------------------------------------------------
// Pattern 3 fixture wiring proof (AC-5 requirement)
// ---------------------------------------------------------------------------

describe('fbs-enhanced-empty fixtures — Pattern 3 wiring', () => {
  it('emptyFbsEnhancedResponse satisfies FbsEnhancedResponse shape', () => {
    const empty = emptyFbsEnhancedResponse()

    // Counts are 0 (not null)
    expect(empty.orderStats.ordersCount).toBe(0)
    expect(empty.orderStats.cancelCount).toBe(0)
    expect(empty.orderStats.buyoutCount).toBe(0)
    expect(empty.stockAnalytics.totalStock).toBe(0)
    expect(empty.stockAnalytics.productCount).toBe(0)

    // Ratios/money are null per anti-pattern #8
    expect(empty.orderStats.buyoutRate).toBeNull()
    expect(empty.orderStats.cancelRate).toBeNull()
    expect(empty.orderStats.avgOrderValue).toBeNull()
    expect(empty.orderStats.ordersSumRub).toBeNull()
    expect(empty.orderStats.addToCartPercent).toBeNull()
    expect(empty.orderStats.ordersPercent).toBeNull()
    expect(empty.calculatedMetrics.turnoverRate).toBeNull()

    // Funnel data — both null (ratios)
    expect(empty.funnelData.addToCartPercent).toBeNull()
    expect(empty.funnelData.ordersPercent).toBeNull()

    // Collections are empty arrays
    expect(empty.regionalData).toEqual([])

    // Strings are empty
    expect(empty.period.from).toBe('')
    expect(empty.generatedAt).toBe('')
  })
})
