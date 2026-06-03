/**
 * liquidity-summary-mapper — distribution pct/turnover derivation (iter-60)
 *
 * The live backend `liquidity_breakdown` ships only {count, capital} per category — no `pct`,
 * no `avg_turnover_days`. The old `?? 0` made every distribution card render a "0 %" headline
 * (and skewed benchmark status). These tests pin that pct is derived as share-of-CAPITAL (matching
 * the `pct` type doc, the makeDefault branch and the computeBenchmarks thresholds — all
 * capital-share), and avg_turnover_days from the category's items.
 */
import { describe, it, expect } from 'vitest'
import { mapBackendResponse } from './liquidity-summary-mapper'

// Backend-shaped (NOT already-mapped) response. Capital is intentionally NOT proportional to
// count, so a count-share derivation (4/45=8.9%) would diverge from the capital-share we expect
// (200000/2000000=10%) — pinning the chosen semantic.
const backendShaped = {
  meta: { cabinet_id: 'cab-1', analysis_period_days: 30 },
  summary: {
    total_skus: 45,
    total_frozen_capital: 2000000,
    avg_turnover_days: 0,
    liquidity_breakdown: {
      highly_liquid: { count: 4, capital: 200000 },
      medium: { count: 0, capital: 0 },
      low: { count: 0, capital: 0 },
      illiquid: { count: 41, capital: 1800000 },
    },
  },
  data: [
    { sku_id: '1', liquidity_status: 'highly_liquid', turnover_days: 10, frozen_capital: 100000 },
    { sku_id: '2', liquidity_status: 'highly_liquid', turnover_days: 20, frozen_capital: 100000 },
    { sku_id: '3', liquidity_status: 'illiquid', turnover_days: 900, frozen_capital: 900000 },
    { sku_id: '4', liquidity_status: 'illiquid', turnover_days: 998, frozen_capital: 900000 },
  ],
}

describe('mapBackendResponse — distribution pct derived from capital (iter-60)', () => {
  it('derives pct as share-of-CAPITAL (NOT 0, NOT count-share) when backend omits pct', () => {
    const { distribution } = mapBackendResponse(backendShaped).summary
    // capital-share 200000/2000000 = 10% (count-share would be 8.888% → must NOT match)
    expect(distribution.highly_liquid.pct).toBeCloseTo(10, 5)
    expect(distribution.highly_liquid.pct).not.toBeCloseTo((4 / 45) * 100, 3)
    // illiquid 1800000/2000000 = 90%
    expect(distribution.illiquid.pct).toBeCloseTo(90, 5)
    expect(distribution.medium.pct).toBe(0) // 0 capital → genuinely 0
  })

  it('keeps backend-authoritative count and capital (value)', () => {
    const { distribution } = mapBackendResponse(backendShaped).summary
    expect(distribution.highly_liquid.count).toBe(4)
    expect(distribution.illiquid.count).toBe(41)
    expect(distribution.illiquid.value).toBe(1800000)
  })

  it('derives avg_turnover_days per category from its items (backend omits it)', () => {
    const { distribution } = mapBackendResponse(backendShaped).summary
    expect(distribution.highly_liquid.avg_turnover_days).toBe(15) // (10+20)/2
    expect(distribution.illiquid.avg_turnover_days).toBe(949) // round((900+998)/2)
  })

  it('flips benchmark status to critical when illiquid dominates capital (was wrong "warning" at 0%)', () => {
    const { benchmarks } = mapBackendResponse(backendShaped).summary
    expect(benchmarks.illiquid_pct).toBeCloseTo(90, 5)
    expect(benchmarks.overall_status).toBe('critical')
  })

  it('guards divide-by-zero when total capital is 0 (empty/zero-capital cabinet)', () => {
    const zero = {
      ...backendShaped,
      summary: {
        ...backendShaped.summary,
        liquidity_breakdown: {
          highly_liquid: { count: 0, capital: 0 },
          medium: { count: 0, capital: 0 },
          low: { count: 0, capital: 0 },
          illiquid: { count: 0, capital: 0 },
        },
      },
      data: [],
    }
    const { distribution } = mapBackendResponse(zero).summary
    expect(distribution.highly_liquid.pct).toBe(0)
    expect(Number.isNaN(distribution.illiquid.pct)).toBe(false)
  })

  it('treats summary avg_turnover_days: 0 (no-sales cabinet) as missing → item-derived avg, NOT 0', () => {
    // Backend sends 0 for a no-sales cabinet where every item is turnover_days: 999 ("Нет продаж").
    // The old `raw.avg_turnover_days ?? ...` kept 0 → "< 1 дня" (false instant-turnover). The fix
    // falls back to the item-derived avg (all-999 → 999 → "Нет продаж", correct).
    const noSales = {
      ...backendShaped,
      data: [
        { sku_id: '1', liquidity_status: 'illiquid', turnover_days: 999, frozen_capital: 100000 },
        { sku_id: '2', liquidity_status: 'illiquid', turnover_days: 999, frozen_capital: 100000 },
      ],
    }
    const { summary } = mapBackendResponse(noSales)
    expect(summary.avg_turnover_days).toBe(999)
    expect(summary.avg_turnover_days).not.toBe(0)
  })

  it('prefers an explicit backend pct/avg_turnover when present', () => {
    const withPct = {
      ...backendShaped,
      summary: {
        ...backendShaped.summary,
        liquidity_breakdown: {
          ...backendShaped.summary.liquidity_breakdown,
          highly_liquid: { count: 4, capital: 200000, pct: 12.3, avg_turnover_days: 7 },
        },
      },
    }
    const { distribution } = mapBackendResponse(withPct).summary
    expect(distribution.highly_liquid.pct).toBe(12.3)
    expect(distribution.highly_liquid.avg_turnover_days).toBe(7)
  })
})

describe('mapBackendResponse — avgTurnoverDays excludes the "never sells" (>=999) sentinel (iter-124)', () => {
  // Averaging the ∞-sentinel with real day-counts produced a misleading midpoint that hid dead
  // stock and inflated the headline turnover. Average only items that actually turn over.
  const mixed = {
    meta: { cabinet_id: 'cab-2', analysis_period_days: 30 },
    summary: {
      total_skus: 3,
      total_frozen_capital: 300000,
      avg_turnover_days: 0, // forces item-derived avg (no-breakdown → makeDefault category path)
    },
    data: [
      { sku_id: '1', liquidity_status: 'highly_liquid', turnover_days: 20, frozen_capital: 100000 },
      { sku_id: '2', liquidity_status: 'illiquid', turnover_days: 120, frozen_capital: 100000 },
      { sku_id: '3', liquidity_status: 'illiquid', turnover_days: 999, frozen_capital: 100000 },
    ],
  }

  it('excludes 999 from the OVERALL summary avg (mean of sellers, not pulled toward 999)', () => {
    const { summary } = mapBackendResponse(mixed)
    // sellers 20+120 = 140/2 = 70; including 999 would give round((20+120+999)/3)=380
    expect(summary.avg_turnover_days).toBe(70)
    expect(summary.avg_turnover_days).not.toBe(380)
    // the benchmark "your_avg_turnover" uses the same helper → also sentinel-free
    expect(summary.benchmarks.your_avg_turnover).toBe(70)
  })

  it('excludes 999 from the ILLIQUID category card avg (only category that holds 999s)', () => {
    const { distribution } = mapBackendResponse(mixed).summary
    // illiquid sellers: just 120 (999 excluded); including 999 → round((120+999)/2)=560
    expect(distribution.illiquid.avg_turnover_days).toBe(120)
    expect(distribution.illiquid.avg_turnover_days).not.toBe(560)
  })

  it('still returns 999 ("Нет продаж") when EVERY item in scope is a no-sales sentinel', () => {
    const allDead = {
      ...mixed,
      data: [
        { sku_id: '1', liquidity_status: 'illiquid', turnover_days: 999, frozen_capital: 100000 },
        { sku_id: '2', liquidity_status: 'illiquid', turnover_days: 999, frozen_capital: 100000 },
      ],
    }
    const { summary } = mapBackendResponse(allDead)
    expect(summary.avg_turnover_days).toBe(999)
    expect(summary.distribution.illiquid.avg_turnover_days).toBe(999)
    expect(summary.benchmarks.your_avg_turnover).toBe(999)
  })
})
