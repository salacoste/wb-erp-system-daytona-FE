/**
 * Tests for liquidity-summary-mapper.ts
 * Covers: mapBackendResponse (the main exported normalizer).
 */

import { describe, it, expect } from 'vitest'
import { mapBackendResponse } from '../liquidity-summary-mapper'
import type { RawLiquidityResponse } from '../liquidity-raw-types'

// ---------------------------------------------------------------------------
// mapBackendResponse
// ---------------------------------------------------------------------------

describe('mapBackendResponse', () => {
  it('happy path: normalizes full backend response', () => {
    const raw: RawLiquidityResponse = {
      meta: {
        cabinet_id: 'cab-001',
        analysis_period_days: 30,
        generated_at: '2026-06-01T00:00:00Z',
        stock_data_updated_at: '2026-06-01T12:00:00Z',
      },
      summary: {
        total_skus: 50,
        total_inventory_value: 1000000,
        frozen_capital: 50000,
        avg_turnover_days: 35,
        liquidity_breakdown: {
          highly_liquid: { count: 20, capital: 600000 },
          medium: { count: 15, capital: 250000 },
          low: { count: 10, capital: 100000 },
          illiquid: { count: 5, capital: 50000 },
        },
      },
      data: [
        {
          sku_id: 111,
          nm_id: 222,
          product_name: 'Product A',
          category: 'Electronics',
          brand: 'Brand X',
          current_stock: 10,
          units_sold_30d: 30,
          avg_daily_sales: 1,
          turnover_days: 10,
          liquidity_category: 'highly_liquid',
          current_price: 1000,
          unit_cost: 500,
          frozen_capital: 5000,
        },
      ],
    }
    const result = mapBackendResponse(raw)

    // Meta
    expect(result.meta.cabinet_id).toBe('cab-001')
    expect(result.meta.analysis_period_days).toBe(30)
    expect(result.meta.generated_at).toBe('2026-06-01T00:00:00Z')
    expect(result.meta.stock_data_updated_at).toBe('2026-06-01T12:00:00Z')

    // Items
    expect(result.data).toHaveLength(1)
    expect(result.data[0].sku_id).toBe('111')
    expect(result.data[0].product_name).toBe('Product A')
    expect(result.data[0].liquidity_category).toBe('highly_liquid')

    // Summary
    expect(result.summary.total_sku_count).toBe(50)
    expect(result.summary.total_inventory_value).toBe(1000000)
    expect(result.summary.frozen_capital).toBe(50000)
    expect(result.summary.avg_turnover_days).toBe(35)

    // Distribution derived from breakdown
    expect(result.summary.distribution.highly_liquid.count).toBe(20)
    expect(result.summary.distribution.highly_liquid.value).toBe(600000)

    // Benchmarks
    expect(result.summary.benchmarks.target_avg_turnover).toBe(45)
    expect(result.summary.benchmarks.industry_avg_turnover).toBe(52)
  })

  it('passes through already-mapped frontend response', () => {
    const alreadyMapped = {
      meta: {
        cabinet_id: 'cab-002',
        analysis_period_days: 30,
        generated_at: '2026-06-01T00:00:00Z',
        stock_data_updated_at: '2026-06-01T12:00:00Z',
      },
      summary: {
        total_sku_count: 10,
        total_inventory_value: 500000,
        frozen_capital: 25000,
        frozen_capital_pct: 5,
        avg_turnover_days: 40,
        distribution: {
          highly_liquid: {
            count: 5,
            value: 300000,
            pct: 60,
            avg_turnover_days: 20,
            no_sales_count: 0,
          },
          medium: { count: 3, value: 150000, pct: 30, avg_turnover_days: 45, no_sales_count: 0 },
          low: { count: 1, value: 25000, pct: 5, avg_turnover_days: 75, no_sales_count: 0 },
          illiquid: { count: 1, value: 25000, pct: 5, avg_turnover_days: 120, no_sales_count: 0 },
        },
        benchmarks: {
          your_avg_turnover: 40,
          target_avg_turnover: 45,
          industry_avg_turnover: 52,
          highly_liquid_pct: 60,
          target_highly_liquid_pct: 50,
          illiquid_pct: 5,
          target_illiquid_pct: 5,
          overall_status: 'excellent',
        },
      },
      data: [],
    }
    const result = mapBackendResponse(alreadyMapped)
    expect(result).toEqual(alreadyMapped)
  })

  it('handles missing meta gracefully (defaults)', () => {
    const raw = { data: [] }
    const result = mapBackendResponse(raw)
    expect(result.meta.cabinet_id).toBe('')
    expect(result.meta.analysis_period_days).toBe(30)
    // generated_at and stock_data_updated_at are ISO strings (not empty)
    expect(typeof result.meta.generated_at).toBe('string')
    expect(typeof result.meta.stock_data_updated_at).toBe('string')
  })

  it('derives analysis_period_days from turnover_weeks when analysis_period_days missing', () => {
    const raw: RawLiquidityResponse = {
      meta: { turnover_weeks: 6 },
      data: [],
    }
    const result = mapBackendResponse(raw)
    expect(result.meta.analysis_period_days).toBe(42) // 6 * 7
  })

  it('falls back to stocks_updated_at for stock_data_updated_at', () => {
    const raw: RawLiquidityResponse = {
      meta: { stocks_updated_at: '2026-05-01T10:00:00Z' },
      data: [],
    }
    const result = mapBackendResponse(raw)
    expect(result.meta.stock_data_updated_at).toBe('2026-05-01T10:00:00Z')
  })

  it('handles missing summary by deriving from items', () => {
    const raw: RawLiquidityResponse = {
      data: [
        {
          sku_id: 1,
          liquidity_category: 'illiquid',
          frozen_capital: 5000,
          turnover_days: 999,
        },
      ],
    }
    const result = mapBackendResponse(raw)
    expect(result.summary.total_sku_count).toBe(1)
    // frozen capital from illiquid items
    expect(result.summary.frozen_capital).toBe(5000)
    // all items are 999 sentinel → avg = 999
    expect(result.summary.avg_turnover_days).toBe(999)
  })

  it('prefers item-derived avg_turnover_days when backend sends 0', () => {
    const raw: RawLiquidityResponse = {
      summary: {
        avg_turnover_days: 0, // backend sends 0 for no-sales cabinets
      },
      data: [{ sku_id: 1, turnover_days: 15, liquidity_category: 'highly_liquid' }],
    }
    const result = mapBackendResponse(raw)
    // 0 is non-positive → falls back to avgTurnoverDays(items) = 15
    expect(result.summary.avg_turnover_days).toBe(15)
  })

  it('handles empty object input', () => {
    const result = mapBackendResponse({})
    expect(result.data).toEqual([])
    expect(result.meta.cabinet_id).toBe('')
  })

  it('handles non-array data', () => {
    const result = mapBackendResponse({ data: 'not-an-array' })
    expect(result.data).toEqual([])
  })

  it('handles summary with frozen_capital field (not total_frozen_capital)', () => {
    const raw: RawLiquidityResponse = {
      summary: {
        frozen_capital: 15000,
        total_inventory_value: 200000,
      },
      data: [],
    }
    const result = mapBackendResponse(raw)
    expect(result.summary.frozen_capital).toBe(15000)
    expect(result.summary.total_inventory_value).toBe(200000)
    // frozen_pct = 15000/200000 * 100 = 7.5
    expect(result.summary.frozen_capital_pct).toBeCloseTo(7.5)
  })

  it('computes frozen_capital_pct as 0 when total inventory is 0', () => {
    const raw: RawLiquidityResponse = {
      summary: {
        total_inventory_value: 0,
        frozen_capital: 0,
      },
      data: [],
    }
    const result = mapBackendResponse(raw)
    expect(result.summary.frozen_capital_pct).toBe(0)
  })

  it('uses backend benchmarks when provided', () => {
    const customBenchmarks = {
      your_avg_turnover: 30,
      target_avg_turnover: 45,
      industry_avg_turnover: 52,
      highly_liquid_pct: 60,
      target_highly_liquid_pct: 50,
      illiquid_pct: 5,
      target_illiquid_pct: 5,
      overall_status: 'excellent',
    }
    const raw: RawLiquidityResponse = {
      summary: {
        total_skus: 10,
        total_inventory_value: 100000,
        frozen_capital: 5000,
        avg_turnover_days: 30,
        benchmarks: customBenchmarks,
      },
      data: [],
    }
    const result = mapBackendResponse(raw)
    expect(result.summary.benchmarks.overall_status).toBe('excellent')
    expect(result.summary.benchmarks.your_avg_turnover).toBe(30)
  })
})
