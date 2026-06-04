/**
 * Unit tests for profitability-utils (Story 63.10-FE) — regression coverage added iter-129.
 *
 * Pure business logic (no React/IO): getProfitabilityStatus threshold classification +
 * getStatusConfig lookup + config/enum completeness. Tests assert the CODE contract (the actual
 * `>=` boundaries consumers rely on), with explicit boundary cases at 25 / 15 / 5 / 0.
 */

import { describe, it, expect } from 'vitest'
import {
  getProfitabilityStatus,
  getStatusConfig,
  ALL_PROFITABILITY_STATUSES,
  EXTENDED_STATUS_CONFIG,
} from '@/lib/profitability-utils'

describe('getProfitabilityStatus', () => {
  describe('unknown (no COGS / missing margin)', () => {
    it('returns "unknown" when hasCogs is false, regardless of margin', () => {
      expect(getProfitabilityStatus(99, false)).toBe('unknown')
      expect(getProfitabilityStatus(-50, false)).toBe('unknown')
    })

    it('returns "unknown" when marginPct is null or undefined (even with COGS)', () => {
      expect(getProfitabilityStatus(null, true)).toBe('unknown')
      expect(getProfitabilityStatus(undefined, true)).toBe('unknown')
    })
  })

  describe('threshold classification (hasCogs=true)', () => {
    it('classifies excellent at the >= 25 boundary and above', () => {
      expect(getProfitabilityStatus(25, true)).toBe('excellent')
      expect(getProfitabilityStatus(30.5, true)).toBe('excellent')
    })

    it('classifies good in [15, 25)', () => {
      expect(getProfitabilityStatus(24.9, true)).toBe('good')
      expect(getProfitabilityStatus(15, true)).toBe('good')
    })

    it('classifies warning in [5, 15)', () => {
      expect(getProfitabilityStatus(14.9, true)).toBe('warning')
      expect(getProfitabilityStatus(5, true)).toBe('warning')
    })

    it('classifies critical in [0, 5)', () => {
      expect(getProfitabilityStatus(4.9, true)).toBe('critical')
      expect(getProfitabilityStatus(0, true)).toBe('critical')
    })

    it('classifies loss below 0', () => {
      expect(getProfitabilityStatus(-0.1, true)).toBe('loss')
      expect(getProfitabilityStatus(-50, true)).toBe('loss')
    })
  })
})

describe('getStatusConfig', () => {
  it('returns the config object for each status', () => {
    expect(getStatusConfig('excellent').label).toBe('Отлично')
    expect(getStatusConfig('loss').label).toBe('Убыток')
    expect(getStatusConfig('unknown').label).toBe('Нет данных')
  })

  it('returns a fully-populated config (all display fields present) for every status', () => {
    for (const status of ALL_PROFITABILITY_STATUSES) {
      const cfg = getStatusConfig(status)
      expect(cfg.label).toBeTruthy()
      expect(cfg.color).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(cfg.bgClass).toBeTruthy()
      expect(cfg.textClass).toBeTruthy()
      expect(cfg.threshold).toBeTruthy()
      expect(cfg.recommendation).toBeTruthy()
    }
  })
})

describe('ALL_PROFITABILITY_STATUSES', () => {
  it('lists exactly the 6 statuses and matches the config keys', () => {
    expect(ALL_PROFITABILITY_STATUSES).toEqual([
      'excellent',
      'good',
      'warning',
      'critical',
      'loss',
      'unknown',
    ])
    expect([...ALL_PROFITABILITY_STATUSES].sort()).toEqual(
      Object.keys(EXTENDED_STATUS_CONFIG).sort()
    )
  })
})
