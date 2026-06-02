/**
 * Tests for the funnel conversion anomaly detector (Defensive Frontend Principle, #197).
 */
import { describe, it, expect } from 'vitest'
import { isFunnelConversionAnomalous, FUNNEL_CONVERSION_ANOMALY_MESSAGE } from './funnel-anomaly'

describe('isFunnelConversionAnomalous', () => {
  it('returns true when totalConversion > 100 (live summary evidence)', () => {
    expect(
      isFunnelConversionAnomalous({ totalConversion: 136.15, buyoutCount: 3141, ordersCount: 140 })
    ).toBe(true)
  })

  it('returns true for the per-SKU evidence (288.48%)', () => {
    expect(
      isFunnelConversionAnomalous({ totalConversion: 288.48, buyoutCount: 1428, ordersCount: 65 })
    ).toBe(true)
  })

  it('returns true when buyoutCount > ordersCount even if conversion ≤ 100', () => {
    expect(
      isFunnelConversionAnomalous({ totalConversion: 80, buyoutCount: 150, ordersCount: 140 })
    ).toBe(true)
  })

  it('returns false for a normal funnel (conversion ≤ 100, buyout ≤ orders)', () => {
    expect(
      isFunnelConversionAnomalous({ totalConversion: 42, buyoutCount: 90, ordersCount: 140 })
    ).toBe(false)
  })

  it('guards against divide-by-implication when ordersCount is 0', () => {
    // No orders → buyout>orders branch must NOT fire (would be a false positive
    // for an empty period). Only the >100% check can trigger here.
    expect(
      isFunnelConversionAnomalous({ totalConversion: 0, buyoutCount: 5, ordersCount: 0 })
    ).toBe(false)
  })

  it('returns false at the exactly-100% boundary with equal buyout/orders', () => {
    expect(
      isFunnelConversionAnomalous({ totalConversion: 100, buyoutCount: 140, ordersCount: 140 })
    ).toBe(false)
  })

  it('exposes a non-empty Russian anomaly message referencing ticket #197', () => {
    expect(FUNNEL_CONVERSION_ANOMALY_MESSAGE).toMatch(/#197/)
    expect(FUNNEL_CONVERSION_ANOMALY_MESSAGE.length).toBeGreaterThan(0)
  })
})
