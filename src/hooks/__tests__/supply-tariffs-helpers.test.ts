/**
 * Unit tests for supply-tariffs-helpers (Story 44 SUPPLY tariffs) — coverage added iter-165.
 *
 * Pure helpers extracted from useSupplyTariffs: AcceptanceCoefficient → SupplyDateTariffs transform,
 * warehouse extraction (prefer Boxes/boxTypeId 2, ru-sorted), date/name lookups (fuzzy), box-type grouping.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import type { AcceptanceCoefficient } from '@/types/tariffs'
import {
  toSupplyDateTariffs,
  normalizeWarehouseName,
  extractSupplyWarehouses,
  findTariffsForDateFromCoefficients,
  findTariffsByNameFromCoefficients,
  getTariffsByBoxTypeFromCoefficients,
} from '@/hooks/supply-tariffs-helpers'

const coeff = (over: Record<string, unknown> = {}): AcceptanceCoefficient =>
  ({
    date: '2026-01-05T00:00:00',
    warehouseId: 507,
    warehouseName: 'Коледино',
    coefficient: 1.65,
    isAvailable: true,
    allowUnload: true,
    boxTypeId: 2,
    boxTypeName: 'Короба',
    delivery: { coefficient: 1.65, baseLiterRub: 75.9, additionalLiterRub: 23.1 },
    storage: { coefficient: 1.5, baseLiterRub: 0.07, additionalLiterRub: 0.05 },
    isSortingCenter: false,
    ...over,
  }) as unknown as AcceptanceCoefficient

afterEach(() => {
  vi.restoreAllMocks()
})

describe('normalizeWarehouseName', () => {
  it('trims and lowercases', () => {
    expect(normalizeWarehouseName('  Коледино  ')).toBe('коледино')
    expect(normalizeWarehouseName('WAREHOUSE')).toBe('warehouse')
  })
})

describe('toSupplyDateTariffs', () => {
  it('maps a coefficient, normalizing date to YYYY-MM-DD', () => {
    const t = toSupplyDateTariffs(coeff())
    expect(t.date).toBe('2026-01-05')
    expect(t.warehouseId).toBe(507)
    expect(t.coefficient).toBe(1.65)
    expect(t.boxTypeId).toBe(2)
    expect(t.delivery).toEqual({ coefficient: 1.65, baseLiterRub: 75.9, additionalLiterRub: 23.1 })
    expect(t.storage.baseLiterRub).toBe(0.07)
  })
})

describe('extractSupplyWarehouses', () => {
  it('returns [] for no coefficients', () => {
    expect(extractSupplyWarehouses([])).toEqual([])
  })
  it('dedupes by warehouseId, prefers boxTypeId 2, and ru-sorts by name', () => {
    const result = extractSupplyWarehouses([
      coeff({ warehouseId: 1, warehouseName: 'Брянск', boxTypeId: 5 }),
      coeff({ warehouseId: 1, warehouseName: 'Брянск', boxTypeId: 2 }), // preferred for wh 1
      coeff({ warehouseId: 2, warehouseName: 'Астрахань', boxTypeId: 2 }),
    ])
    expect(result.map(w => w.name)).toEqual(['Астрахань', 'Брянск']) // ru-sorted
    const bryansk = result.find(w => w.id === 1)!
    expect(bryansk.tariffs.deliveryBaseLiterRub).toBe(75.9)
    expect(bryansk.tariffs.logisticsCoefficient).toBe(1.0) // pre-multiplied → calc coeff 1.0
    expect(bryansk.tariffs.displayLogisticsCoefficient).toBe(1.65)
  })
})

describe('findTariffsForDateFromCoefficients', () => {
  it('returns null + warns for empty coefficients', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(findTariffsForDateFromCoefficients([], 507, '2026-01-05')).toBeNull()
    expect(warn).toHaveBeenCalled()
  })
  it('matches warehouseId + date + boxTypeId 2', () => {
    const t = findTariffsForDateFromCoefficients([coeff()], 507, '2026-01-05')
    expect(t?.warehouseId).toBe(507)
  })
  it('falls back to any box type when no boxTypeId 2 match', () => {
    const t = findTariffsForDateFromCoefficients([coeff({ boxTypeId: 5 })], 507, '2026-01-05')
    expect(t?.boxTypeId).toBe(5)
  })
  it('returns null when nothing matches', () => {
    expect(findTariffsForDateFromCoefficients([coeff()], 999, '2026-01-05')).toBeNull()
  })
})

describe('findTariffsByNameFromCoefficients (fuzzy)', () => {
  it('returns null for empty name/coefficients', () => {
    expect(findTariffsByNameFromCoefficients([], 'Коледино', '2026-01-05')).toBeNull()
    expect(findTariffsByNameFromCoefficients([coeff()], '', '2026-01-05')).toBeNull()
  })
  it('matches exact, startsWith, and includes (case-insensitive)', () => {
    const list = [coeff()]
    expect(findTariffsByNameFromCoefficients(list, 'коледино', '2026-01-05')?.warehouseId).toBe(507)
    expect(findTariffsByNameFromCoefficients(list, 'Колед', '2026-01-05')?.warehouseId).toBe(507)
    expect(findTariffsByNameFromCoefficients(list, 'олед', '2026-01-05')?.warehouseId).toBe(507)
    expect(findTariffsByNameFromCoefficients(list, 'Нетакого', '2026-01-05')).toBeNull()
  })
})

describe('getTariffsByBoxTypeFromCoefficients', () => {
  it('returns [] for no coefficients', () => {
    expect(getTariffsByBoxTypeFromCoefficients([], 507)).toEqual([])
  })
  it('groups by box type (first per type) for the warehouse', () => {
    const result = getTariffsByBoxTypeFromCoefficients(
      [
        coeff({ boxTypeId: 2 }),
        coeff({ boxTypeId: 5, boxTypeName: 'Монопаллеты' }),
        coeff({ warehouseId: 999, boxTypeId: 2 }),
      ],
      507
    )
    expect(result.map(b => b.boxTypeId).sort()).toEqual([2, 5])
  })
})
