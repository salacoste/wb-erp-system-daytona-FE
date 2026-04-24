/**
 * Tests for server-client discrepancy telemetry — Story 93.2-FE
 *
 * Logger tests that observe console.warn use `vi.stubEnv('VITEST_EXPECT_LOG', '1')`
 * to bypass the test-env gate in logDiscrepancy. Tests that verify suppression do NOT
 * set this env var (default NODE_ENV=test behaviour kicks in).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  compareServerClientProfit,
  logDiscrepancy,
  DISCREPANCY_THRESHOLDS,
} from '../server-client-discrepancy'
import type { Discrepancy } from '../server-client-discrepancy'

// ---------------------------------------------------------------------------
// AC-5: Comparator tests (5 tests)
// ---------------------------------------------------------------------------

describe('compareServerClientProfit — threshold matrix', () => {
  it('returns beyondThreshold=false when values match exactly', () => {
    const d = compareServerClientProfit('2026-04-24', 1000, 1000)
    expect(d.absDiff).toBe(0)
    expect(d.relDiff).toBe(0)
    expect(d.beyondThreshold).toBe(false)
  })

  it('returns beyondThreshold=true when both abs and rel thresholds are exceeded', () => {
    // absDiff=500 >= 1 ₽, relDiff=0.05 >= 0.01
    const d = compareServerClientProfit('2026-04-24', 10000, 10500)
    expect(d.absDiff).toBe(500)
    expect(d.relDiff).toBeCloseTo(0.05)
    expect(d.beyondThreshold).toBe(true)
  })

  it('returns beyondThreshold=false when abs threshold met but rel is tiny', () => {
    // absDiff=50 >= 1 ₽, but relDiff=0.00005 < 0.01 — noise, not worth logging
    const d = compareServerClientProfit('2026-04-24', 1000000, 1000050)
    expect(d.absDiff).toBe(50)
    expect(d.relDiff).toBeCloseTo(0.00005)
    expect(d.beyondThreshold).toBe(false)
  })

  it('returns beyondThreshold=false when rel threshold met but abs is sub-ruble', () => {
    // absDiff=0.5 < 1 ₽ — sub-ruble diff ignored even at 100% relative
    const d = compareServerClientProfit('2026-04-24', 0.5, 1)
    expect(d.absDiff).toBeCloseTo(0.5)
    expect(d.beyondThreshold).toBe(false)
  })

  it('sets relDiff=null when serverValue is 0 (div-by-zero undefined, not zero)', () => {
    // absDiff=50 >= 1 ₽, relDiff=null — null condition allows beyondThreshold to fire
    const d = compareServerClientProfit('2026-04-24', 0, 50)
    expect(d.relDiff).toBeNull()
    expect(d.absDiff).toBe(50)
    expect(d.beyondThreshold).toBe(true)
  })

  it('returns correct date and values on the Discrepancy object', () => {
    const d = compareServerClientProfit('2026-01-15', 12345, 12500)
    expect(d.date).toBe('2026-01-15')
    expect(d.serverValue).toBe(12345)
    expect(d.clientValue).toBe(12500)
  })

  it('exposes DISCREPANCY_THRESHOLDS with expected values', () => {
    expect(DISCREPANCY_THRESHOLDS.absoluteRub).toBe(1)
    expect(DISCREPANCY_THRESHOLDS.relative).toBe(0.01)
  })
})

// ---------------------------------------------------------------------------
// AC-6: Logger tests (3 tests)
// ---------------------------------------------------------------------------

describe('logDiscrepancy — structured console.warn behaviour', () => {
  const beyondDiscrepancy: Discrepancy = {
    date: '2026-04-24',
    serverValue: 12345.67,
    clientValue: 12500.0,
    absDiff: 154.33,
    relDiff: 0.0125,
    beyondThreshold: true,
  }

  const belowDiscrepancy: Discrepancy = {
    date: '2026-04-24',
    serverValue: 1000,
    clientValue: 1000,
    absDiff: 0,
    relDiff: 0,
    beyondThreshold: false,
  }

  describe('when VITEST_EXPECT_LOG=1 (escape hatch active)', () => {
    beforeEach(() => {
      vi.stubEnv('VITEST_EXPECT_LOG', '1')
    })
    afterEach(() => {
      vi.restoreAllMocks()
      vi.unstubAllEnvs()
    })

    it('writes console.warn with [NetProfitDiscrepancy] prefix when beyondThreshold=true', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      logDiscrepancy(beyondDiscrepancy)
      expect(warnSpy).toHaveBeenCalledTimes(1)
      const msg = warnSpy.mock.calls[0][0] as string
      expect(msg).toContain('[NetProfitDiscrepancy]')
      expect(msg).toContain('2026-04-24')
      expect(msg).toContain('12345.67')
      expect(msg).toContain('12500.00')
    })

    it('does NOT write console.warn when beyondThreshold=false', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      logDiscrepancy(belowDiscrepancy)
      expect(warnSpy).not.toHaveBeenCalled()
    })

    it("renders 'relDiff=n/a' when serverValue=0 causes null relDiff", () => {
      // compareServerClientProfit('2026-04-24', 0, 50) → relDiff=null → format as 'n/a'
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const d = compareServerClientProfit('2026-04-24', 0, 50)
      logDiscrepancy(d)
      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(warnSpy.mock.calls[0][0] as string).toContain('relDiff=n/a')
    })
  })

  describe('when VITEST_EXPECT_LOG is unset (test-env gate active)', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('muffles console.warn even when beyondThreshold=true', () => {
      // NODE_ENV=test + no VITEST_EXPECT_LOG → gate suppresses output
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      logDiscrepancy(beyondDiscrepancy)
      expect(warnSpy).not.toHaveBeenCalled()
    })
  })
})
