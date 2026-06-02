/**
 * calculateDailyStorage — boxType threading regression (price-calc DEFECT-1).
 *
 * The hook used to call calculateDailyStorage(tariffs, volume) with no boxType, so storage always
 * used the Boxes (volume-dependent) formula. Pallets (boxType=5) must use the VOLUME-INDEPENDENT
 * fixed formula (base × coefficient). These lock the boxType into the cost calc.
 */
import { describe, it, expect } from 'vitest'
import { calculateDailyStorage } from '../warehouse-form-calculations'
import { DEFAULT_TARIFFS } from '@/lib/tariff-system-types'
import type { BoxTypeId } from '@/lib/box-type-utils'

const BOXES: BoxTypeId = 2
const PALLETS: BoxTypeId = 5

const tariff = {
  ...DEFAULT_TARIFFS,
  storageBaseLiterRub: 10,
  storagePerLiterRub: 2,
  storageCoefficient: 1.5,
}

describe('calculateDailyStorage — boxType threading (DEFECT-1)', () => {
  it('Boxes (2): volume-dependent (base + (vol-1)*per_liter)*coeff', () => {
    // (10 + (5-1)*2) * 1.5 = 27
    expect(calculateDailyStorage(tariff, 5, BOXES)).toBeCloseTo(27, 4)
  })

  it('Pallets (5): VOLUME-INDEPENDENT fixed base*coeff (the bug: was using volume formula)', () => {
    // 10 * 1.5 = 15, regardless of volume
    expect(calculateDailyStorage(tariff, 5, PALLETS)).toBeCloseTo(15, 4)
    expect(calculateDailyStorage(tariff, 20, PALLETS)).toBeCloseTo(15, 4)
  })

  it('regression: Pallet storage differs from Boxes for the same > 1 L volume', () => {
    const pallet = calculateDailyStorage(tariff, 5, PALLETS)
    const boxes = calculateDailyStorage(tariff, 5, BOXES)
    expect(pallet).not.toBeCloseTo(boxes, 4)
    expect(pallet).toBeLessThan(boxes) // pallet (15) < boxes (27) for this >1 L product
  })
})
