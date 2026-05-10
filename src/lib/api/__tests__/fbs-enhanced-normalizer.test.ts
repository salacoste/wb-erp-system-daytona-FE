/**
 * Boundary Normalizer Tests — FBS Enhanced Analytics — Story 96.13-FE
 *
 * Verifies normalizeFbsEnhancedResponse in fbs-enhanced-normalizer.ts:
 *   - Dual-lookup: both snake_case and camelCase inputs normalize correctly.
 *   - Null-preservation: ratio/money fields preserve null (anti-pattern #8).
 *   - Count coercion: count fields default to 0 on missing/null input.
 *   - Empty arrays: missing/malformed arrays produce empty arrays (no crash).
 *   - Query key factory: cabinetId scoping (Story 96.11 H2-1 multi-tenant lesson).
 *
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
        total_orders: 100,
        delivered_orders: 80,
        returned_orders: 10,
        buyout_rate: 80.0,
        return_rate: 10.0,
        average_order_value: 1500.5,
      },
      stock_analytics: {
        total_skus: 50,
        total_units: 500,
        low_stock_skus: 5,
        out_of_stock_skus: 2,
        avg_days_of_cover: 30.5,
      },
      regional_data: [{ region_name: 'Центральный', order_share: 45.0, stock_share: 40.0 }],
      calculated_metrics: {
        turnover_rate: 2.5,
        stock_coverage_days: 30.0,
        orders_per_product: 1.8,
      },
      funnel_data: {
        product_views: 10000,
        cart_adds: 2000,
        orders: 100,
        deliveries: 80,
      },
      period: { from: '2026-04-01', to: '2026-04-30' },
      generated_at: '2026-04-30T12:00:00Z',
    }

    const result = normalizeFbsEnhancedResponse(raw)

    expect(result.orderStats.totalOrders).toBe(100)
    expect(result.orderStats.deliveredOrders).toBe(80)
    expect(result.orderStats.returnedOrders).toBe(10)
    expect(result.orderStats.buyoutRate).toBe(80.0)
    expect(result.orderStats.returnRate).toBe(10.0)
    expect(result.orderStats.averageOrderValue).toBe(1500.5)

    expect(result.stockAnalytics.totalSkus).toBe(50)
    expect(result.stockAnalytics.totalUnits).toBe(500)
    expect(result.stockAnalytics.lowStockSkus).toBe(5)
    expect(result.stockAnalytics.outOfStockSkus).toBe(2)
    expect(result.stockAnalytics.avgDaysOfCover).toBe(30.5)

    expect(result.regionalData).toHaveLength(1)
    expect(result.regionalData[0].regionName).toBe('Центральный')
    expect(result.regionalData[0].orderShare).toBe(45.0)
    expect(result.regionalData[0].stockShare).toBe(40.0)

    expect(result.calculatedMetrics.turnoverRate).toBe(2.5)
    expect(result.calculatedMetrics.stockCoverageDays).toBe(30.0)
    expect(result.calculatedMetrics.ordersPerProduct).toBe(1.8)

    expect(result.funnelData.productViews).toBe(10000)
    expect(result.funnelData.cartAdds).toBe(2000)
    expect(result.funnelData.orders).toBe(100)
    expect(result.funnelData.deliveries).toBe(80)

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
        totalOrders: 50,
        deliveredOrders: 40,
        returnedOrders: 5,
        buyoutRate: 80.0,
        returnRate: 10.0,
        averageOrderValue: 2000.0,
      },
      stockAnalytics: {
        totalSkus: 20,
        totalUnits: 200,
        lowStockSkus: 2,
        outOfStockSkus: 1,
        avgDaysOfCover: 15.0,
      },
      regionalData: [{ regionName: 'Сибирь', orderShare: 20.0, stockShare: 25.0 }],
      calculatedMetrics: {
        turnoverRate: 1.5,
        stockCoverageDays: 20.0,
        ordersPerProduct: 0.9,
      },
      funnelData: {
        productViews: 5000,
        cartAdds: 1000,
        orders: 50,
        deliveries: 40,
      },
      period: { from: '2026-03-01', to: '2026-03-31' },
      generatedAt: '2026-03-31T10:00:00Z',
    }

    const result = normalizeFbsEnhancedResponse(raw)

    expect(result.orderStats.totalOrders).toBe(50)
    expect(result.orderStats.buyoutRate).toBe(80.0)
    expect(result.stockAnalytics.totalSkus).toBe(20)
    expect(result.regionalData[0].regionName).toBe('Сибирь')
    expect(result.calculatedMetrics.turnoverRate).toBe(1.5)
    expect(result.funnelData.productViews).toBe(5000)
    expect(result.generatedAt).toBe('2026-03-31T10:00:00Z')
  })
})

// ---------------------------------------------------------------------------
// Null preservation (CLAUDE.md anti-pattern #8)
// ---------------------------------------------------------------------------

describe('normalizeFbsEnhancedResponse — null preservation', () => {
  it('preserves null on all ratio/money fields', () => {
    const raw = {
      orderStats: {
        totalOrders: 0,
        deliveredOrders: 0,
        returnedOrders: 0,
        buyoutRate: null,
        returnRate: null,
        averageOrderValue: null,
      },
      stockAnalytics: {
        totalSkus: 0,
        totalUnits: 0,
        lowStockSkus: 0,
        outOfStockSkus: 0,
        avgDaysOfCover: null,
      },
      regionalData: [{ regionName: 'Тест', orderShare: null, stockShare: null }],
      calculatedMetrics: {
        turnoverRate: null,
        stockCoverageDays: null,
        ordersPerProduct: null,
      },
      funnelData: { productViews: 0, cartAdds: 0, orders: 0, deliveries: 0 },
      period: { from: '', to: '' },
      generatedAt: '',
    }

    const result = normalizeFbsEnhancedResponse(raw)

    expect(result.orderStats.buyoutRate).toBeNull()
    expect(result.orderStats.returnRate).toBeNull()
    expect(result.orderStats.averageOrderValue).toBeNull()
    expect(result.stockAnalytics.avgDaysOfCover).toBeNull()
    expect(result.regionalData[0].orderShare).toBeNull()
    expect(result.regionalData[0].stockShare).toBeNull()
    expect(result.calculatedMetrics.turnoverRate).toBeNull()
    expect(result.calculatedMetrics.stockCoverageDays).toBeNull()
    expect(result.calculatedMetrics.ordersPerProduct).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Safety / edge cases
// ---------------------------------------------------------------------------

describe('normalizeFbsEnhancedResponse — edge cases', () => {
  it('null/undefined input produces safe empty shape', () => {
    const result = normalizeFbsEnhancedResponse(null)

    expect(result.orderStats.totalOrders).toBe(0)
    expect(result.orderStats.buyoutRate).toBeNull()
    expect(result.stockAnalytics.totalSkus).toBe(0)
    expect(result.regionalData).toEqual([])
    expect(result.calculatedMetrics.turnoverRate).toBeNull()
    expect(result.funnelData.productViews).toBe(0)
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
// H-1 fix: ratio unit-contract lock — percent-points (0-100) NOT divided (Story 96.13)
// ---------------------------------------------------------------------------

describe('normalizeFbsEnhancedResponse — ratio unit-contract (H-1 fix)', () => {
  it('preserves buyoutRate 80.0 as 80.0 — NOT divided by 100 (percent-points contract)', () => {
    // Contract per request-backend/169 § 1.2: backend sends percent-points (0-100).
    // Normalizer must preserve the value as-is; formatPercentage() in the UI divides by 100
    // for display only. This test locks the scale so future refactors cannot silently
    // change the representation without breaking this assertion.
    const raw = {
      orderStats: {
        totalOrders: 10,
        deliveredOrders: 8,
        returnedOrders: 1,
        buyoutRate: 80.0,
        returnRate: 10.0,
        averageOrderValue: 1000.0,
      },
      stockAnalytics: {
        totalSkus: 1,
        totalUnits: 1,
        lowStockSkus: 0,
        outOfStockSkus: 0,
        avgDaysOfCover: null,
      },
      regionalData: [{ regionName: 'Тест', orderShare: 60.0, stockShare: 40.0 }],
      calculatedMetrics: { turnoverRate: 2.0, stockCoverageDays: 15.0, ordersPerProduct: 1.0 },
      funnelData: { productViews: 100, cartAdds: 50, orders: 10, deliveries: 8 },
      period: { from: '2026-04-01', to: '2026-04-30' },
      generatedAt: '2026-04-30T12:00:00Z',
    }

    const result = normalizeFbsEnhancedResponse(raw)

    // All three assertions confirm 80.0 is NOT 0.8 — percent-points contract preserved
    expect(result.orderStats.buyoutRate).toBe(80.0)
    expect(result.orderStats.returnRate).toBe(10.0)
    expect(result.regionalData[0].orderShare).toBe(60.0)
    expect(result.regionalData[0].stockShare).toBe(40.0)
    expect(result.calculatedMetrics.turnoverRate).toBe(2.0)
  })
})

// ---------------------------------------------------------------------------
// Pattern 3 fixture wiring proof (AC-5 requirement)
// ---------------------------------------------------------------------------

describe('fbs-enhanced-empty fixtures — Pattern 3 wiring', () => {
  it('emptyFbsEnhancedResponse satisfies FbsEnhancedResponse shape', () => {
    const empty = emptyFbsEnhancedResponse()

    // Counts are 0 (not null)
    expect(empty.orderStats.totalOrders).toBe(0)
    expect(empty.stockAnalytics.totalSkus).toBe(0)
    expect(empty.funnelData.productViews).toBe(0)

    // Ratios/money are null per anti-pattern #8
    expect(empty.orderStats.buyoutRate).toBeNull()
    expect(empty.orderStats.averageOrderValue).toBeNull()
    expect(empty.stockAnalytics.avgDaysOfCover).toBeNull()
    expect(empty.calculatedMetrics.turnoverRate).toBeNull()

    // Collections are empty arrays
    expect(empty.regionalData).toEqual([])

    // Strings are empty
    expect(empty.period.from).toBe('')
    expect(empty.generatedAt).toBe('')
  })
})
