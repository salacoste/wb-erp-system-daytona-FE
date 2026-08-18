import { describe, it, expect } from 'vitest'
import { WATERFALL_COLORS } from '../waterfall-chart-config'

// 168.11 token migration: profit/loss use chart sign tokens; the 10 categorical cost
// colors intentionally stay hex (tier-collapse guard: 13 series on 11 tokens would
// force profit↔advertising / loss↔penalties collisions).
describe('WATERFALL_COLORS — 168.11 token migration', () => {
  it('profit uses the chart-positive token', () => {
    expect(WATERFALL_COLORS.profit).toBe('var(--color-chart-positive)')
  })

  it('loss uses the chart-negative token', () => {
    expect(WATERFALL_COLORS.loss).toBe('var(--color-chart-negative)')
  })

  it('categorical cost colors remain distinct hex (anti tier-collapse guard)', () => {
    // At least one legacy hex must remain — proves the categorical set was NOT collapsed.
    expect(WATERFALL_COLORS.revenue).toMatch(/^#[0-9A-Fa-f]{6}$/)
    expect(WATERFALL_COLORS.advertising).toMatch(/^#[0-9A-Fa-f]{6}$/)
    expect(WATERFALL_COLORS.penalties).toMatch(/^#[0-9A-Fa-f]{6}$/)
    // Sign tokens must not collide with any categorical color value.
    const categorical = Object.entries(WATERFALL_COLORS)
      .filter(([k]) => k !== 'profit' && k !== 'loss')
      .map(([, v]) => v)
    expect(categorical).not.toContain(WATERFALL_COLORS.profit)
    expect(categorical).not.toContain(WATERFALL_COLORS.loss)
  })
})
