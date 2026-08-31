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
  getProfitabilityConfig,
  getProfitabilityLabel,
  getProfitabilityBadgeClasses,
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
      const result = getProfitabilityConfig(drift)
      // The sentinel must be visually distinct from the real 'warning' band so a
      // drifted value is indicated, not mislabelled (Defensive Frontend Principle, F-49).
      expect(result).not.toBe(PROFITABILITY_STATUS_CONFIG.warning)
      // Verify sentinel properties (neutral grey, not a real margin band)
      expect(result.color).toBe('var(--color-muted-foreground)')
      expect(result.label).toBe('Неизвестно')
    })

    it('does not crash on the satellite getters', () => {
      expect(() => getProfitabilityLabel(drift)).not.toThrow()
      expect(() => getProfitabilityBadgeClasses(drift)).not.toThrow()
    })

    it('satellite getters return the neutral sentinel values', () => {
      expect(getProfitabilityLabel(drift)).toBe('Неизвестно')
      expect(getProfitabilityBadgeClasses(drift)).toBe('bg-muted text-muted-foreground')
    })

    it('handles empty string without throwing', () => {
      expect(() => getProfitabilityConfig('' as unknown as ProfitabilityStatus)).not.toThrow()
      expect(getProfitabilityConfig('' as unknown as ProfitabilityStatus).color).toBe(
        'var(--color-muted-foreground)'
      )
    })
  })
})
