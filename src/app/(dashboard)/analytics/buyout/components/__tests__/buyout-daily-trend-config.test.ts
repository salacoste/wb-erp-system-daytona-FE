/**
 * Unit tests for buyout daily trend config — Epic 169.4 token pins
 *
 * Negative pins: series colors must reference chart CSS variables (valence semantics),
 * NOT raw RGB hex (dark-mode regression guard).
 */
import { describe, it, expect } from 'vitest'
import { BUYOUT_TREND_COLORS, BUYOUT_TREND_SERIES } from '../buyout-daily-trend-config'

describe('BUYOUT_TREND_COLORS (Epic 169.4 token migration)', () => {
  it('buyoutRate uses valence positive chart token', () => {
    expect(BUYOUT_TREND_COLORS.buyoutRate).toBe('var(--color-chart-positive)')
  })

  it('returnRate uses valence negative chart token', () => {
    expect(BUYOUT_TREND_COLORS.returnRate).toBe('var(--color-chart-negative)')
  })

  it('ordersCount uses categorical chart-1 token', () => {
    expect(BUYOUT_TREND_COLORS.ordersCount).toBe('var(--color-chart-1)')
  })

  it('no series color is a raw hex literal (dark-mode regression guard)', () => {
    for (const color of Object.values(BUYOUT_TREND_COLORS)) {
      expect(color).not.toMatch(/^#/)
    }
  })
})

describe('BUYOUT_TREND_SERIES (Epic 169.4)', () => {
  it('every series reads its color from the token config (single source of truth)', () => {
    for (const series of BUYOUT_TREND_SERIES) {
      expect(series.color).toBe(BUYOUT_TREND_COLORS[series.key])
    }
  })
})
