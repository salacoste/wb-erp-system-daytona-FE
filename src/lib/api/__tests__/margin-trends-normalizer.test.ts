/**
 * margin-trends boundary normalizer — Validation F-30.
 * Pins: unwrapped-array (prod) AND `{ data: [...] }` wrapper shapes both normalize;
 * money/ratio fields preserve null (anti-pattern #8); counts coerce to 0.
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeMarginTrendsResponse,
  normalizeMarginTrendPoint,
} from '../margin-trends-normalizer'

const rawPoint = {
  week: '2026-W11',
  week_start_date: '2026-03-08',
  week_end_date: '2026-03-14',
  margin_pct: 6.2,
  revenue_net: 415775.61,
  cogs: 390000,
  profit: 25775.61,
  qty: 780,
  sku_count: 27,
  missing_cogs_count: 0,
}

describe('normalizeMarginTrendsResponse', () => {
  it('normalizes the apiClient-unwrapped bare array (real prod shape)', () => {
    const res = normalizeMarginTrendsResponse([rawPoint])
    expect(res).toHaveLength(1)
    expect(res[0]).toMatchObject({ week: '2026-W11', margin_pct: 6.2, qty: 780 })
  })

  it('also accepts the defensive `{ data: [...] }` wrapper shape', () => {
    const res = normalizeMarginTrendsResponse({ data: [rawPoint] })
    expect(res).toHaveLength(1)
    expect(res[0].week).toBe('2026-W11')
  })

  it('drops points with a missing/blank week (un-chartable backend anomaly)', () => {
    const res = normalizeMarginTrendsResponse([
      rawPoint,
      { ...rawPoint, week: undefined },
      'bad',
      null,
    ])
    expect(res).toHaveLength(1)
    expect(res[0].week).toBe('2026-W11')
  })

  it('returns [] for null / undefined / non-array input', () => {
    expect(normalizeMarginTrendsResponse(null)).toEqual([])
    expect(normalizeMarginTrendsResponse(undefined)).toEqual([])
    expect(normalizeMarginTrendsResponse({})).toEqual([])
    expect(normalizeMarginTrendsResponse({ data: 'nope' })).toEqual([])
  })
})

describe('normalizeMarginTrendPoint — null-aware money/ratio (anti-pattern #8)', () => {
  it('preserves null for margin_pct / cogs / profit (does NOT coerce to 0)', () => {
    const p = normalizeMarginTrendPoint({
      week: '2026-W12',
      week_start_date: '2026-03-15',
      week_end_date: '2026-03-21',
      margin_pct: null,
      revenue_net: 1000,
      cogs: null,
      profit: null,
      qty: 10,
      sku_count: 2,
      missing_cogs_count: 2,
    })
    expect(p.margin_pct).toBeNull()
    expect(p.cogs).toBeNull()
    expect(p.profit).toBeNull()
  })

  it('coerces missing counts + revenue_net to 0, missing money to null', () => {
    const p = normalizeMarginTrendPoint({ week: '2026-W13' })
    expect(p.qty).toBe(0)
    expect(p.sku_count).toBe(0)
    expect(p.missing_cogs_count).toBe(0)
    expect(p.revenue_net).toBe(0)
    expect(p.margin_pct).toBeNull()
    expect(p.cogs).toBeNull()
    expect(p.profit).toBeNull()
  })
})
