/**
 * Liquidity Trends Boundary Normalizer Tests
 */

import { describe, it, expect } from 'vitest'
import { normalizeLiquidityTrendsResponse } from '../liquidity-normalizer'

describe('normalizeLiquidityTrendsResponse', () => {
  it('normalizes a fully-populated response', () => {
    const raw = {
      meta: {
        cabinet_id: 'cab-1',
        period_days: 30,
        generated_at: '2026-01-15T12:00:00Z',
      },
      trends: [
        {
          date: '2026-01-15',
          distribution: {
            highly_liquid_pct: 40,
            medium_pct: 30,
            low_pct: 20,
            illiquid_pct: 10,
          },
          frozen_capital: 500000,
          avg_turnover_days: 14,
        },
      ],
      insights: [
        { type: 'warning', message: 'Stock aging detected' },
        { type: 'opportunity', message: 'Price adjustment recommended' },
      ],
    }
    const result = normalizeLiquidityTrendsResponse(raw)
    expect(result.meta.cabinet_id).toBe('cab-1')
    expect(result.meta.period_days).toBe(30)
    expect(result.meta.generated_at).toBe('2026-01-15T12:00:00Z')
    expect(result.trends).toHaveLength(1)
    expect(result.trends[0].date).toBe('2026-01-15')
    expect(result.trends[0].distribution.highly_liquid_pct).toBe(40)
    expect(result.trends[0].distribution.medium_pct).toBe(30)
    expect(result.trends[0].distribution.low_pct).toBe(20)
    expect(result.trends[0].distribution.illiquid_pct).toBe(10)
    expect(result.trends[0].frozen_capital).toBe(500000)
    expect(result.trends[0].avg_turnover_days).toBe(14)
    expect(result.insights).toHaveLength(2)
    expect(result.insights[0].type).toBe('warning')
    expect(result.insights[0].message).toBe('Stock aging detected')
    expect(result.insights[1].type).toBe('opportunity')
  })

  it('defaults trends and insights to empty arrays when missing', () => {
    const result = normalizeLiquidityTrendsResponse({})
    expect(result.trends).toEqual([])
    expect(result.insights).toEqual([])
  })

  it('defaults meta fields when missing', () => {
    const result = normalizeLiquidityTrendsResponse({})
    expect(result.meta.cabinet_id).toBe('')
    expect(result.meta.period_days).toBe(0)
    expect(result.meta.generated_at).toBe('')
  })

  it('defaults distribution fields to 0 when missing', () => {
    const raw = { trends: [{ distribution: {} }] }
    const result = normalizeLiquidityTrendsResponse(raw)
    expect(result.trends[0].distribution.highly_liquid_pct).toBe(0)
    expect(result.trends[0].distribution.medium_pct).toBe(0)
    expect(result.trends[0].distribution.low_pct).toBe(0)
    expect(result.trends[0].distribution.illiquid_pct).toBe(0)
  })

  it('defaults trend data fields to 0 when missing', () => {
    const raw = { trends: [{}] }
    const result = normalizeLiquidityTrendsResponse(raw)
    expect(result.trends[0].date).toBe('')
    expect(result.trends[0].frozen_capital).toBe(0)
    expect(result.trends[0].avg_turnover_days).toBe(0)
  })

  it('handles null input', () => {
    const result = normalizeLiquidityTrendsResponse(null)
    expect(result.trends).toEqual([])
    expect(result.insights).toEqual([])
    expect(result.meta.cabinet_id).toBe('')
  })

  it('handles null distribution', () => {
    const raw = { trends: [{ distribution: null }] }
    const result = normalizeLiquidityTrendsResponse(raw)
    expect(result.trends[0].distribution.highly_liquid_pct).toBe(0)
  })

  it('handles non-array trends', () => {
    const raw = { trends: 'not-an-array' }
    const result = normalizeLiquidityTrendsResponse(raw)
    expect(result.trends).toEqual([])
  })
})
