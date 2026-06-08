/**
 * Tests for useAcceptanceCoefficients-utils.ts
 * Pure-function coverage: transformCoefficients, coefficientsQueryKeys, BOX_TYPE_CONFIG
 */

import { describe, it, expect } from 'vitest'
import type { AcceptanceCoefficient } from '@/types/tariffs'
import {
  transformCoefficients,
  coefficientsQueryKeys,
  BOX_TYPE_CONFIG,
} from '../useAcceptanceCoefficients-utils'
import type { BoxType } from '../useAcceptanceCoefficients-utils'

// ---------------------------------------------------------------------------
// coefficientsQueryKeys
// ---------------------------------------------------------------------------

describe('coefficientsQueryKeys', () => {
  it('all returns base key', () => {
    expect(coefficientsQueryKeys.all).toEqual(['coefficients'])
  })

  it('byWarehouse appends warehouse id', () => {
    expect(coefficientsQueryKeys.byWarehouse(507)).toEqual(['coefficients', 'warehouse', 507])
  })
})

// ---------------------------------------------------------------------------
// BOX_TYPE_CONFIG
// ---------------------------------------------------------------------------

describe('BOX_TYPE_CONFIG', () => {
  it('has all three box types with correct ids', () => {
    const types = Object.keys(BOX_TYPE_CONFIG) as BoxType[]
    expect(types).toHaveLength(3)
    expect(BOX_TYPE_CONFIG.boxes.id).toBe(2)
    expect(BOX_TYPE_CONFIG.pallets.id).toBe(5)
    expect(BOX_TYPE_CONFIG.supersafe.id).toBe(6)
  })

  it('each entry has label and labelShort', () => {
    for (const cfg of Object.values(BOX_TYPE_CONFIG)) {
      expect(typeof cfg.label).toBe('string')
      expect(cfg.label.length).toBeGreaterThan(0)
      expect(typeof cfg.labelShort).toBe('string')
      expect(cfg.labelShort.length).toBeGreaterThan(0)
    }
  })
})

// ---------------------------------------------------------------------------
// transformCoefficients
// ---------------------------------------------------------------------------

function makeCoefficient(overrides: Partial<AcceptanceCoefficient> = {}): AcceptanceCoefficient {
  return {
    warehouseId: 507,
    warehouseName: 'Коледино',
    date: '2026-01-20T00:00:00',
    coefficient: 1.0,
    isAvailable: true,
    allowUnload: true,
    boxTypeId: 2,
    boxTypeName: 'Короб',
    delivery: { coefficient: 1.0, baseLiterRub: 46, additionalLiterRub: 14 },
    storage: { coefficient: 1.0, baseLiterRub: 1, additionalLiterRub: 1 },
    isSortingCenter: false,
    ...overrides,
  }
}

describe('transformCoefficients', () => {
  it('returns null for empty array', () => {
    expect(transformCoefficients([])).toBeNull()
  })

  it('returns null for null/undefined input', () => {
    expect(transformCoefficients(null as unknown as AcceptanceCoefficient[])).toBeNull()
    expect(transformCoefficients(undefined as unknown as AcceptanceCoefficient[])).toBeNull()
  })

  it('transforms a single coefficient for boxes', () => {
    const result = transformCoefficients([makeCoefficient()])!
    expect(result.warehouseId).toBe(507)
    expect(result.warehouseName).toBe('Коледино')
    expect(result.todayCoefficient).toBe(1.0)
    expect(result.dailyCoefficients).toHaveLength(1)
    expect(result.dailyCoefficients[0].date).toBe('2026-01-20')
  })

  it('normalizes integer coefficients (>10) by dividing by 100', () => {
    const result = transformCoefficients([makeCoefficient({ coefficient: 150 })])!
    expect(result.todayCoefficient).toBe(1.5)
  })

  it('normalizes negative coefficients to 0', () => {
    const result = transformCoefficients([makeCoefficient({ coefficient: -1 })])!
    expect(result.todayCoefficient).toBe(0)
  })

  it('groups coefficients by box type and sorts by date', () => {
    const coeffs = [
      makeCoefficient({ date: '2026-01-22T00:00:00', boxTypeId: 2 }),
      makeCoefficient({ date: '2026-01-20T00:00:00', boxTypeId: 2 }),
      makeCoefficient({ date: '2026-01-21T00:00:00', boxTypeId: 5 }),
    ]
    const result = transformCoefficients(coeffs)!

    expect(result.byBoxType).toHaveLength(2)
    // boxes (id=2) sorted first, then pallets (id=5)
    expect(result.byBoxType[0].boxType).toBe('boxes')
    expect(result.byBoxType[0].dailyCoefficients[0].date).toBe('2026-01-20')
    expect(result.byBoxType[0].dailyCoefficients[1].date).toBe('2026-01-22')
    expect(result.byBoxType[1].boxType).toBe('pallets')
  })

  it('computes averageCoefficient from available boxes coefficients', () => {
    const coeffs = [
      makeCoefficient({ coefficient: 2.0, isAvailable: true }),
      makeCoefficient({ coefficient: 4.0, isAvailable: true }),
      makeCoefficient({ coefficient: -1, isAvailable: false }),
    ]
    const result = transformCoefficients(coeffs)!
    // average of 2.0 and 4.0 (negative excluded)
    expect(result.averageCoefficient).toBe(3.0)
  })

  it('defaults averageCoefficient to 1.0 when no available coefficients', () => {
    const coeffs = [makeCoefficient({ coefficient: -1, isAvailable: false })]
    const result = transformCoefficients(coeffs)!
    expect(result.averageCoefficient).toBe(1.0)
  })

  it('defaults todayCoefficient to 1.0 when no boxes coefficients', () => {
    // Only pallets, no boxes
    const result = transformCoefficients([makeCoefficient({ boxTypeId: 5 })])!
    expect(result.todayCoefficient).toBe(1.0)
  })

  it('normalizes delivery and storage coefficients', () => {
    const result = transformCoefficients([
      makeCoefficient({
        delivery: { coefficient: 200, baseLiterRub: 46, additionalLiterRub: 14 },
        storage: { coefficient: -1, baseLiterRub: 1, additionalLiterRub: 1 },
      }),
    ])!
    expect(result.delivery.coefficient).toBe(2.0) // 200 / 100
    expect(result.storage.coefficient).toBe(0) // negative → 0
    expect(result.delivery.baseLiterRub).toBe(46)
    expect(result.storage.baseLiterRub).toBe(1)
  })
})
