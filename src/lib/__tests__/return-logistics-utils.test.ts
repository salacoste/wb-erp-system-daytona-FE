/**
 * Unit tests for return logistics calculation utilities
 * Story 44.10-FE: Return Logistics Calculation
 * Story 100.1-FE: Removed legacy function tests (calculateReturnLogisticsLegacy,
 *   getReturnLogisticsBreakdown, formatReturnLogisticsTooltip, isHighReturnRate,
 *   getReturnRateColor, ReturnLogisticsParams, LegacyReturnLogisticsResult)
 */

import { describe, it, expect } from 'vitest'
import { calculateReturnRate } from '../return-logistics-utils'

describe('calculateReturnRate', () => {
  it('should calculate return rate from buyback rate', () => {
    expect(calculateReturnRate(90)).toBe(10)
    expect(calculateReturnRate(98)).toBe(2)
    expect(calculateReturnRate(50)).toBe(50)
  })

  it('should return 0 for 100% buyback', () => {
    expect(calculateReturnRate(100)).toBe(0)
  })

  it('should return 100 for 0% buyback', () => {
    expect(calculateReturnRate(0)).toBe(100)
  })

  it('should clamp result to valid range', () => {
    expect(calculateReturnRate(150)).toBe(0)
    expect(calculateReturnRate(-20)).toBe(100)
  })
})
