/**
 * Boundary Normalizer Tests — Story 92.1-FE
 * Tests for normalizeMonitorSummaryResponse (and its helpers indirectly).
 * Pattern: describe-per-normalizer, single-focus assertions per test.
 * See src/lib/api/__tests__/normalizers.test.ts (Story 89.1) for canonical style.
 */

import { describe, it, expect } from 'vitest'
import { normalizeMonitorSummaryResponse } from '../monitor-summary-normalizer'

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function makePeriod(overrides: Record<string, unknown> = {}) {
  return {
    salesCount: 10,
    returnsCount: 2,
    revenue: 50000,
    cogs: 30000,
    expenses: 5000,
    advertisingSpend: 2000,
    margin: 13000,
    ...overrides,
  }
}

function makeFullRaw() {
  return {
    periods: {
      today: makePeriod(),
      yesterday: makePeriod({ salesCount: 5 }),
      last30Days: makePeriod({ revenue: 1500000 }),
      prev30Days: makePeriod({ revenue: 1200000 }),
    },
    kpi: {
      totalProducts: 100,
      productsWithCogs: 80,
      cogsCoveragePercent: 80.0,
      buyoutRatePercent: 65.5,
      lastSyncAt: '2026-04-21T10:00:00Z',
    },
    generatedAt: '2026-04-21T10:05:00Z',
  }
}

// ---------------------------------------------------------------------------
// normalizeMonitorSummaryResponse
// ---------------------------------------------------------------------------

describe('normalizeMonitorSummaryResponse', () => {
  it('fully-populated response normalizes to expected typed shape', () => {
    const result = normalizeMonitorSummaryResponse(makeFullRaw())
    expect(result.periods.today.salesCount).toBe(10)
    expect(result.periods.today.revenue).toBe(50000)
    expect(result.kpi.totalProducts).toBe(100)
    expect(result.kpi.buyoutRatePercent).toBe(65.5)
    expect(result.generatedAt).toBe('2026-04-21T10:05:00Z')
  })

  it('revenue: null is preserved as null (not coerced to 0)', () => {
    const raw = makeFullRaw()
    ;(raw.periods.today as Record<string, unknown>).revenue = null
    const result = normalizeMonitorSummaryResponse(raw)
    expect(result.periods.today.revenue).toBeNull()
  })

  it('cogs: null is preserved (COGS unknown — anti-pattern #8 parity)', () => {
    const raw = makeFullRaw()
    ;(raw.periods.today as Record<string, unknown>).cogs = null
    const result = normalizeMonitorSummaryResponse(raw)
    expect(result.periods.today.cogs).toBeNull()
  })

  it('buyoutRatePercent: null is preserved (no orders in window)', () => {
    const raw = makeFullRaw()
    ;(raw.kpi as Record<string, unknown>).buyoutRatePercent = null
    const result = normalizeMonitorSummaryResponse(raw)
    expect(result.kpi.buyoutRatePercent).toBeNull()
  })

  it('lastSyncAt: null is preserved', () => {
    const raw = makeFullRaw()
    ;(raw.kpi as Record<string, unknown>).lastSyncAt = null
    const result = normalizeMonitorSummaryResponse(raw)
    expect(result.kpi.lastSyncAt).toBeNull()
  })

  it('generatedAt: null is preserved (boundary-visibility for missing timestamp)', () => {
    const raw = makeFullRaw()
    ;(raw as Record<string, unknown>).generatedAt = null
    const result = normalizeMonitorSummaryResponse(raw)
    expect(result.generatedAt).toBeNull()
  })

  it('counts (salesCount, returnsCount) coerce null to 0 — legitimate zero', () => {
    const raw = makeFullRaw()
    ;(raw.periods.today as Record<string, unknown>).salesCount = null
    ;(raw.periods.today as Record<string, unknown>).returnsCount = null
    const result = normalizeMonitorSummaryResponse(raw)
    expect(result.periods.today.salesCount).toBe(0)
    expect(result.periods.today.returnsCount).toBe(0)
  })

  it('snake_case dual-lookup: sales_count maps to salesCount correctly', () => {
    const raw = {
      periods: {
        today: {
          sales_count: 7,
          returns_count: 1,
          revenue: 42000,
          cogs: 20000,
          expenses: 3000,
          advertising_spend: 1000,
          margin: 18000,
        },
        yesterday: makePeriod(),
        last_30_days: makePeriod(),
        prev_30_days: makePeriod(),
      },
      kpi: {
        total_products: 50,
        products_with_cogs: 40,
        cogs_coverage_percent: 80,
        buyout_rate_percent: 70,
        last_sync_at: '2026-04-21T09:00:00Z',
      },
      generated_at: '2026-04-21T09:05:00Z',
    }
    const result = normalizeMonitorSummaryResponse(raw)
    expect(result.periods.today.salesCount).toBe(7)
    expect(result.periods.today.returnsCount).toBe(1)
    expect(result.periods.today.advertisingSpend).toBe(1000)
    expect(result.kpi.totalProducts).toBe(50)
    expect(result.kpi.productsWithCogs).toBe(40) // products_with_cogs → productsWithCogs
    expect(result.kpi.cogsCoveragePercent).toBe(80) // cogs_coverage_percent → cogsCoveragePercent
    expect(result.kpi.buyoutRatePercent).toBe(70) // buyout_rate_percent → buyoutRatePercent
    expect(result.kpi.lastSyncAt).toBe('2026-04-21T09:00:00Z')
    expect(result.generatedAt).toBe('2026-04-21T09:05:00Z')
  })

  it('completely missing periods/kpi/everything returns safe empty shape without crash', () => {
    const result = normalizeMonitorSummaryResponse(undefined)
    // All 4 periods must be present
    expect(result.periods.today).toBeDefined()
    expect(result.periods.yesterday).toBeDefined()
    expect(result.periods.last30Days).toBeDefined()
    expect(result.periods.prev30Days).toBeDefined()
    // kpi must be present
    expect(result.kpi).toBeDefined()
    // generatedAt is null when backend omits the field — boundary-visibility discipline
    expect(result.generatedAt).toBeNull()
    // counts coerce to 0
    expect(result.periods.today.salesCount).toBe(0)
    expect(result.kpi.totalProducts).toBe(0)
    // money fields are null
    expect(result.periods.today.revenue).toBeNull()
    expect(result.kpi.buyoutRatePercent).toBeNull()
  })

  it('snake_case period keys (last_30_days, prev_30_days) are mapped correctly', () => {
    const raw = {
      periods: {
        today: makePeriod(),
        yesterday: makePeriod(),
        last_30_days: makePeriod({ revenue: 999000 }),
        prev_30_days: makePeriod({ revenue: 888000 }),
      },
      kpi: makeFullRaw().kpi,
      generatedAt: '2026-04-21T10:05:00Z',
    }
    const result = normalizeMonitorSummaryResponse(raw)
    expect(result.periods.last30Days.revenue).toBe(999000)
    expect(result.periods.prev30Days.revenue).toBe(888000)
  })

  it('NaN input for money field is normalized to null via Number.isFinite guard', () => {
    const raw = makeFullRaw()
    ;(raw.periods.today as Record<string, unknown>).revenue = NaN
    const result = normalizeMonitorSummaryResponse(raw)
    expect(result.periods.today.revenue).toBeNull()
  })

  it('string number input for count fields is coerced to number', () => {
    const raw = makeFullRaw()
    ;(raw.periods.today as Record<string, unknown>).salesCount = '15'
    const result = normalizeMonitorSummaryResponse(raw)
    expect(result.periods.today.salesCount).toBe(15)
  })
})
