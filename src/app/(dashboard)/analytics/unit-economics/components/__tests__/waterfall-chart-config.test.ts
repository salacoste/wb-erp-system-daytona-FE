import { describe, it, expect } from 'vitest'
import { WATERFALL_COLORS, COST_CATEGORIES, COST_CATEGORY_BY_KEY } from '../waterfall-chart-config'

// C5 wave-4 token migration (owner decision (a)): every WATERFALL_COLORS value is a
// full-form `var(--color-*)` token. Story 168.11's tier-collapse concern survives via
// distance offsets (valence-2 / valence-4 for the chart-4/chart-8 byte-twin colliders);
// this suite enforces canon form, exact role mapping, sign-token separation, and
// pairwise distinctness of all 13 series.
describe('WATERFALL_COLORS — C5 wave-4 token migration', () => {
  it('profit uses the chart-positive token', () => {
    expect(WATERFALL_COLORS.profit).toBe('var(--color-chart-positive)')
  })

  it('loss uses the chart-negative token', () => {
    expect(WATERFALL_COLORS.loss).toBe('var(--color-chart-negative)')
  })

  it('every value is a full-form var(--color-*) token (canon form)', () => {
    const entries = Object.entries(WATERFALL_COLORS)
    expect(entries).toHaveLength(13)
    for (const [key, value] of entries) {
      expect(value, key).toMatch(/^var\(--color-[a-z0-9-]+\)$/)
    }
  })

  it('maps each series to its assigned role token (exact pins)', () => {
    expect(WATERFALL_COLORS.revenue).toBe('var(--color-chart-9)')
    expect(WATERFALL_COLORS.cogs).toBe('var(--color-chart-1)')
    expect(WATERFALL_COLORS.commission).toBe('var(--color-chart-2)')
    expect(WATERFALL_COLORS.logistics_delivery).toBe('var(--color-chart-3)')
    expect(WATERFALL_COLORS.logistics_return).toBe('var(--color-valence-2)')
    expect(WATERFALL_COLORS.storage).toBe('var(--color-chart-5)')
    expect(WATERFALL_COLORS.delivery_to_warehouse).toBe('var(--color-chart-6)')
    expect(WATERFALL_COLORS.paid_acceptance).toBe('var(--color-chart-7)')
    expect(WATERFALL_COLORS.penalties).toBe('var(--color-valence-4)')
    expect(WATERFALL_COLORS.other_deductions).toBe('var(--color-valence-neutral)')
    expect(WATERFALL_COLORS.advertising).toBe('var(--color-chart-10)')
  })

  it('no categorical series maps to sign tokens or their byte-twin roles (168.11 tier-collapse heir)', () => {
    const forbidden = new Set([
      'var(--color-chart-positive)',
      'var(--color-chart-negative)',
      'var(--color-chart-4)',
      'var(--color-chart-8)',
    ])
    for (const [key, value] of Object.entries(WATERFALL_COLORS)) {
      if (key === 'profit' || key === 'loss') continue
      expect(forbidden.has(value), key).toBe(false)
    }
  })

  it('all 13 values are pairwise distinct (covers revenue≠other_deductions on chart-9)', () => {
    const values = Object.values(WATERFALL_COLORS)
    expect(values).toHaveLength(13)
    expect(new Set(values).size).toBe(13)
  })

  it('COST_CATEGORIES colors derive from WATERFALL_COLORS and BY_KEY lookup works', () => {
    expect(COST_CATEGORIES.find(c => c.key === 'cogs')?.color).toBe(WATERFALL_COLORS.cogs)
    expect(COST_CATEGORIES.find(c => c.key === 'penalties')?.color).toBe(WATERFALL_COLORS.penalties)
    expect(COST_CATEGORIES.find(c => c.key === 'advertising')?.color).toBe(
      WATERFALL_COLORS.advertising
    )
    expect(COST_CATEGORY_BY_KEY['logistics_return']).toEqual({
      label: 'Возвраты',
      color: WATERFALL_COLORS.logistics_return,
    })
    expect(COST_CATEGORY_BY_KEY['storage']).toEqual({
      label: 'Хранение',
      color: WATERFALL_COLORS.storage,
    })
  })
})
