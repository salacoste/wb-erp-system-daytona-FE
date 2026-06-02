/**
 * unit-economics-config — F-49 enum-drift guard tests
 *
 * profitability_status is backend-provided. An out-of-union value would make
 * PROFITABILITY_STATUS_CONFIG[status] undefined → TypeError on .color/.label/.bgClass
 * (the F-39 enum-crash class). getProfitabilityConfig must fall back to the neutral
 * UNKNOWN_PROFITABILITY_CONFIG sentinel instead — never to a real margin band.
 */

import { describe, it, expect } from 'vitest'
import {
  PROFITABILITY_STATUS_CONFIG,
  UNKNOWN_PROFITABILITY_CONFIG,
  getProfitabilityConfig,
  getProfitabilityColor,
  getProfitabilityLabel,
  getProfitabilityBadgeClasses,
  getProfitabilityBgClass,
} from '../unit-economics-config'
import type { ProfitabilityStatus } from '@/types/unit-economics'

describe('unit-economics-config — getProfitabilityConfig (F-49 guard)', () => {
  const known: ProfitabilityStatus[] = ['excellent', 'good', 'warning', 'critical', 'loss']

  it.each(known)('resolves the exact config for known status %s', status => {
    expect(getProfitabilityConfig(status)).toBe(PROFITABILITY_STATUS_CONFIG[status])
  })

  describe('backend enum-drift (out-of-union value)', () => {
    // Cast through unknown: simulating a value the ProfitabilityStatus type forbids.
    const drift = 'deprecated' as unknown as ProfitabilityStatus

    it('falls back to the neutral sentinel (NOT a real margin band) instead of returning undefined', () => {
      expect(getProfitabilityConfig(drift)).toBe(UNKNOWN_PROFITABILITY_CONFIG)
      // Regression: the sentinel must be visually distinct from the real 'warning' band so a
      // drifted value is indicated, not mislabelled (Defensive Frontend Principle, F-49).
      expect(getProfitabilityConfig(drift)).not.toBe(PROFITABILITY_STATUS_CONFIG.warning)
    })

    it('does not crash on the satellite getters', () => {
      expect(() => getProfitabilityColor(drift)).not.toThrow()
      expect(() => getProfitabilityLabel(drift)).not.toThrow()
      expect(() => getProfitabilityBadgeClasses(drift)).not.toThrow()
      expect(() => getProfitabilityBgClass(drift)).not.toThrow()
    })

    it('satellite getters return the neutral sentinel values', () => {
      const s = UNKNOWN_PROFITABILITY_CONFIG
      expect(getProfitabilityColor(drift)).toBe(s.color)
      expect(getProfitabilityLabel(drift)).toBe(s.label)
      expect(getProfitabilityBgClass(drift)).toBe(s.bgClass)
      expect(getProfitabilityBadgeClasses(drift)).toBe(`${s.bgClass} ${s.textClass}`)
    })

    it('handles empty string without throwing', () => {
      expect(() => getProfitabilityConfig('' as unknown as ProfitabilityStatus)).not.toThrow()
      expect(getProfitabilityConfig('' as unknown as ProfitabilityStatus)).toBe(
        UNKNOWN_PROFITABILITY_CONFIG
      )
    })
  })
})
