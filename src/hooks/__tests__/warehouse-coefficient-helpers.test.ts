/**
 * Unit tests for warehouse-coefficient-helpers (Story 44.13-FE) — coverage added iter-163.
 *
 * Pure coefficient-normalization helpers extracted from useWarehouseCoefficients. getBoxTypeKey +
 * normalizeCoefficient (WB integer→decimal with clamp) + buildNormalizedCoefficients (group/average).
 */

import { describe, it, expect } from 'vitest'
import type { AcceptanceCoefficient } from '@/types/tariffs'
import {
  getBoxTypeKey,
  normalizeCoefficient,
  buildNormalizedCoefficients,
} from '@/hooks/warehouse-coefficient-helpers'

describe('getBoxTypeKey', () => {
  it('maps box-type ids to keys (2/5/6), default boxes', () => {
    expect(getBoxTypeKey(2)).toBe('boxes')
    expect(getBoxTypeKey(5)).toBe('pallets')
    expect(getBoxTypeKey(6)).toBe('supersafe')
    expect(getBoxTypeKey(99)).toBe('boxes') // unknown → default
  })
})

describe('normalizeCoefficient (WB int→decimal, clamp)', () => {
  it('divides values > 10 by 100 (integer-percent form)', () => {
    expect(normalizeCoefficient(100)).toBe(1)
    expect(normalizeCoefficient(125)).toBe(1.25)
    expect(normalizeCoefficient(200)).toBe(2)
  })
  it('leaves values <= 10 as-is (already decimal)', () => {
    expect(normalizeCoefficient(1.5)).toBe(1.5)
    expect(normalizeCoefficient(10)).toBe(10)
  })
  it('clamps negatives to 0', () => {
    expect(normalizeCoefficient(-5)).toBe(0)
    expect(normalizeCoefficient(0)).toBe(0)
  })
})

describe('buildNormalizedCoefficients', () => {
  // Build the fields the function reads (anti-pattern #4 cast for the complex AcceptanceCoefficient).
  const tariff = { baseLiterRub: 46, additionalLiterRub: 14, coefficient: 100 }
  const coeffs = [
    {
      boxTypeId: 2,
      date: '2026-01-01T00:00:00',
      coefficient: 100,
      isAvailable: true,
      delivery: tariff,
      storage: tariff,
    },
    {
      boxTypeId: 2,
      date: '2026-01-02T00:00:00',
      coefficient: 200,
      isAvailable: true,
      delivery: tariff,
      storage: tariff,
    },
  ] as unknown as AcceptanceCoefficient[]

  it('groups boxes, averages available coefficients, normalizes delivery/storage', () => {
    const result = buildNormalizedCoefficients({
      warehouseId: 507,
      warehouseName: 'Коледино',
      coefficients: coeffs,
    })
    expect(result.warehouseId).toBe(507)
    expect(result.todayCoefficient).toBe(1) // first boxes coeff: normalize(100)=1
    expect(result.averageCoefficient).toBe(1.5) // (1 + 2) / 2
    expect(result.dailyCoefficients).toHaveLength(2)
    expect(result.byBoxType).toHaveLength(1)
    expect(result.byBoxType[0].boxType).toBe('boxes')
    expect(result.delivery.coefficient).toBe(1) // normalize(100)
    expect(result.storage.coefficient).toBe(1)
  })
})
