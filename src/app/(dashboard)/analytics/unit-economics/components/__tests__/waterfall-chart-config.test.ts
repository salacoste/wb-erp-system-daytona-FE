import { describe, it, expect } from 'vitest'

import { COST_CATEGORIES as LIB_COST_CATEGORIES } from '@/lib/unit-economics-config'
import { declarationsFor, hslTripletToHex, parseGlobals } from '@/styles/__tests__/token-test-utils'

import { WATERFALL_COLORS, COST_CATEGORIES, COST_CATEGORY_BY_KEY } from '../waterfall-chart-config'

// C5 wave-4 token migration (owner decision (a)): every WATERFALL_COLORS value is a
// full-form `var(--color-*)` token. Story 168.11's tier-collapse concern survives via
// distance offsets (valence-2 / valence-4 for the chart-4/chart-8 byte-twin colliders);
// this suite enforces canon form, exact role mapping, sign-token separation, and
// pairwise distinctness of all 13 series.
describe('WATERFALL_COLORS — C5 wave-4 token migration', () => {
  const globals = parseGlobals()

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

  it.each([':root', '.dark'])('%s all 13 mapped roles resolve to distinct RGB values', selector => {
    const tokens = declarationsFor(globals, selector)
    const resolvedColors = Object.entries(WATERFALL_COLORS).map(([key, value]) => {
      const role = value.match(/^var\(--color-([a-z0-9-]+)\)$/)?.[1]
      expect(role, `${key} token role`).toBeDefined()

      const triplet = tokens.get(`--${role}`)
      expect(triplet, `${selector} ${key}/${role}`).toBeDefined()
      return hslTripletToHex(triplet ?? '')
    })

    expect(resolvedColors).toHaveLength(13)
    expect(new Set(resolvedColors).size).toBe(13)
  })

  it('stays order-aligned with the lib categories and diverges only at owner-approved colors', () => {
    expect(COST_CATEGORIES.map(category => category.key)).toEqual(
      LIB_COST_CATEGORIES.map(category => category.key)
    )

    expect(
      COST_CATEGORIES.map((category, index) => ({
        key: category.key,
        componentLabel: category.label,
        libLabel: LIB_COST_CATEGORIES[index]?.label,
      }))
    ).toEqual([
      { key: 'cogs', componentLabel: 'COGS', libLabel: 'Себестоимость' },
      { key: 'commission', componentLabel: 'Комиссия', libLabel: 'Комиссия WB' },
      { key: 'logistics_delivery', componentLabel: 'Доставка', libLabel: 'Доставка' },
      { key: 'logistics_return', componentLabel: 'Возвраты', libLabel: 'Возвраты' },
      { key: 'storage', componentLabel: 'Хранение', libLabel: 'Хранение' },
      {
        key: 'delivery_to_warehouse',
        componentLabel: 'Доставка на склад',
        libLabel: 'Доставка на склад',
      },
      { key: 'paid_acceptance', componentLabel: 'Приёмка', libLabel: 'Приёмка' },
      { key: 'penalties', componentLabel: 'Штрафы', libLabel: 'Штрафы' },
      { key: 'other_deductions', componentLabel: 'Прочее', libLabel: 'Прочие' },
      { key: 'advertising', componentLabel: 'Реклама', libLabel: 'Реклама' },
    ])

    const libColors = new Map<string, string>(
      LIB_COST_CATEGORIES.map(category => [category.key, category.color])
    )
    expect(
      COST_CATEGORIES.flatMap(category => {
        const libColor = libColors.get(category.key)
        return category.color === libColor
          ? []
          : [{ key: category.key, componentColor: category.color, libColor }]
      })
    ).toEqual([
      {
        key: 'logistics_return',
        componentColor: 'var(--color-valence-2)',
        libColor: 'var(--color-chart-4)',
      },
      {
        key: 'penalties',
        componentColor: 'var(--color-valence-4)',
        libColor: 'var(--color-chart-8)',
      },
      {
        key: 'other_deductions',
        componentColor: 'var(--color-valence-neutral)',
        libColor: 'var(--color-chart-9)',
      },
    ])
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
