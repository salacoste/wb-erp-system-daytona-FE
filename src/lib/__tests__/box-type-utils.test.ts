/**
 * Unit Tests for Box Type Utilities
 * Story 44.42-FE: Box Type Selection Support
 * Epic 44: Price Calculator UI (Frontend)
 *
 * TDD Red Phase: These tests should FAIL initially until implementation.
 *
 * @see docs/stories/epic-44/story-44.42-fe-box-type-support.md
 */

import { describe, it, expect } from 'vitest'
import {
  BOX_TYPES,
  getBoxTypeInfo,
  isBoxTypeAvailable,
  getAvailableBoxTypes,
  DEFAULT_BOX_TYPE_ID,
  type BoxTypeId,
  type BoxTypeInfo,
} from '../box-type-utils'

// ============================================================================
// Test Data (from story specification)
// ============================================================================

/** Mock coefficients array simulating API response */
const mockCoefficientsAllTypes = [
  { warehouseId: 130744, boxTypeId: 2, isAvailable: true },
  { warehouseId: 130744, boxTypeId: 5, isAvailable: true },
  { warehouseId: 130744, boxTypeId: 6, isAvailable: true },
]

const mockCoefficientsBoxesOnly = [
  { warehouseId: 130744, boxTypeId: 2, isAvailable: true },
  { warehouseId: 130744, boxTypeId: 5, isAvailable: false },
  { warehouseId: 130744, boxTypeId: 6, isAvailable: false },
]

const mockCoefficientsBoxesAndPallets = [
  { warehouseId: 130744, boxTypeId: 2, isAvailable: true },
  { warehouseId: 130744, boxTypeId: 5, isAvailable: true },
  { warehouseId: 130744, boxTypeId: 6, isAvailable: false },
]

const mockCoefficientsMultipleWarehouses = [
  { warehouseId: 130744, boxTypeId: 2, isAvailable: true },
  { warehouseId: 130744, boxTypeId: 5, isAvailable: true },
  { warehouseId: 206348, boxTypeId: 2, isAvailable: true },
  { warehouseId: 206348, boxTypeId: 6, isAvailable: true },
]

// ============================================================================
// BOX_TYPES Constant Tests
// ============================================================================

describe('BOX_TYPES constant', () => {
  it('should define all three box types', () => {
    expect(BOX_TYPES).toBeDefined()
    expect(Object.keys(BOX_TYPES)).toHaveLength(3)
    expect(BOX_TYPES[2]).toBeDefined()
    expect(BOX_TYPES[5]).toBeDefined()
    expect(BOX_TYPES[6]).toBeDefined()
  })

  describe('Boxes (boxTypeId: 2)', () => {
    it('should have correct structure', () => {
      const boxes = BOX_TYPES[2]

      expect(boxes.id).toBe(2)
      expect(boxes.name).toBe('Boxes')
      expect(boxes.nameRu).toBe('Коробки')
      expect(boxes.storageFormula).toBe('standard')
    })

    it('should have an icon', () => {
      expect(BOX_TYPES[2].icon).toBe('📦')
    })

    it('should have a description in Russian', () => {
      expect(BOX_TYPES[2].description).toContain('коробк')
    })
  })

  describe('Pallets (boxTypeId: 5)', () => {
    it('should have correct structure', () => {
      const pallets = BOX_TYPES[5]

      expect(pallets.id).toBe(5)
      expect(pallets.name).toBe('Pallets')
      expect(pallets.nameRu).toBe('Монопаллеты')
      expect(pallets.storageFormula).toBe('fixed')
    })

    it('should have an icon', () => {
      expect(BOX_TYPES[5].icon).toBe('🔲')
    })

    it('should have fixed storage formula', () => {
      // CRITICAL: Pallets use fixed rate storage (volume-independent)
      expect(BOX_TYPES[5].storageFormula).toBe('fixed')
    })

    it('should have a description mentioning fixed rate', () => {
      expect(BOX_TYPES[5].description).toContain('фикс')
    })
  })

  describe('Supersafe (boxTypeId: 6)', () => {
    it('should have correct structure', () => {
      const supersafe = BOX_TYPES[6]

      expect(supersafe.id).toBe(6)
      expect(supersafe.name).toBe('Supersafe')
      expect(supersafe.nameRu).toBe('Суперсейф')
      expect(supersafe.storageFormula).toBe('standard')
    })

    it('should have an icon', () => {
      expect(BOX_TYPES[6].icon).toBe('🔒')
    })

    it('should use standard storage formula', () => {
      expect(BOX_TYPES[6].storageFormula).toBe('standard')
    })
  })

  it('should export default box type ID as 2 (Boxes)', () => {
    expect(DEFAULT_BOX_TYPE_ID).toBe(2)
  })

  it('should have type-safe BoxTypeId type', () => {
    // Type assertions - these should compile
    const validIds: BoxTypeId[] = [2, 5, 6]
    expect(validIds).toHaveLength(3)

    // Each valid ID should be in BOX_TYPES
    validIds.forEach((id) => {
      expect(BOX_TYPES[id]).toBeDefined()
    })
  })
})

// ============================================================================
// getBoxTypeInfo Tests
// ============================================================================

describe('getBoxTypeInfo', () => {
  it('should return info for Boxes (id: 2)', () => {
    const info = getBoxTypeInfo(2)

    expect(info).toBeDefined()
    expect(info.id).toBe(2)
    expect(info.name).toBe('Boxes')
    expect(info.nameRu).toBe('Коробки')
    expect(info.storageFormula).toBe('standard')
  })

  it('should return info for Pallets (id: 5)', () => {
    const info = getBoxTypeInfo(5)

    expect(info).toBeDefined()
    expect(info.id).toBe(5)
    expect(info.name).toBe('Pallets')
    expect(info.nameRu).toBe('Монопаллеты')
    expect(info.storageFormula).toBe('fixed')
  })

  it('should return info for Supersafe (id: 6)', () => {
    const info = getBoxTypeInfo(6)

    expect(info).toBeDefined()
    expect(info.id).toBe(6)
    expect(info.name).toBe('Supersafe')
    expect(info.nameRu).toBe('Суперсейф')
    expect(info.storageFormula).toBe('standard')
  })

  it('should return default (Boxes) for invalid ID', () => {
    // @ts-expect-error Testing runtime behavior with invalid input
    const info = getBoxTypeInfo(99)

    expect(info).toBeDefined()
    expect(info.id).toBe(2) // Default to Boxes
  })

  it('should return default for undefined', () => {
    // @ts-expect-error Testing runtime behavior with undefined
    const info = getBoxTypeInfo(undefined)

    expect(info).toBeDefined()
    expect(info.id).toBe(2)
  })

  it('should have all required BoxTypeInfo fields', () => {
    const info = getBoxTypeInfo(2)

    expect(info).toHaveProperty('id')
    expect(info).toHaveProperty('name')
    expect(info).toHaveProperty('nameRu')
    expect(info).toHaveProperty('icon')
    expect(info).toHaveProperty('description')
    expect(info).toHaveProperty('storageFormula')
  })

  it('should return immutable reference (not copy)', () => {
    const info1 = getBoxTypeInfo(2)
    const info2 = getBoxTypeInfo(2)

    // Should return same reference for efficiency
    expect(info1).toBe(info2)
  })
})

// ============================================================================
// isBoxTypeAvailable Tests
// ============================================================================

describe('isBoxTypeAvailable', () => {
  it('should return true when box type is available at warehouse', () => {
    const result = isBoxTypeAvailable(2, mockCoefficientsAllTypes, 130744)
    expect(result).toBe(true)
  })

  it('should return false when box type is not available', () => {
    const result = isBoxTypeAvailable(6, mockCoefficientsBoxesOnly, 130744)
    expect(result).toBe(false)
  })

  it('should return false when isAvailable flag is false', () => {
    const result = isBoxTypeAvailable(5, mockCoefficientsBoxesOnly, 130744)
    expect(result).toBe(false)
  })

  it('should filter by warehouse ID correctly', () => {
    // Warehouse 130744 has Boxes and Pallets
    expect(isBoxTypeAvailable(2, mockCoefficientsMultipleWarehouses, 130744)).toBe(true)
    expect(isBoxTypeAvailable(5, mockCoefficientsMultipleWarehouses, 130744)).toBe(true)
    expect(isBoxTypeAvailable(6, mockCoefficientsMultipleWarehouses, 130744)).toBe(false)

    // Warehouse 206348 has Boxes and Supersafe
    expect(isBoxTypeAvailable(2, mockCoefficientsMultipleWarehouses, 206348)).toBe(true)
    expect(isBoxTypeAvailable(5, mockCoefficientsMultipleWarehouses, 206348)).toBe(false)
    expect(isBoxTypeAvailable(6, mockCoefficientsMultipleWarehouses, 206348)).toBe(true)
  })

  it('should return false for empty coefficients array', () => {
    const result = isBoxTypeAvailable(2, [], 130744)
    expect(result).toBe(false)
  })

  it('should return false when warehouse not found', () => {
    const result = isBoxTypeAvailable(2, mockCoefficientsAllTypes, 999999)
    expect(result).toBe(false)
  })

  it('should handle undefined warehouse ID', () => {
    // @ts-expect-error Testing runtime behavior
    const result = isBoxTypeAvailable(2, mockCoefficientsAllTypes, undefined)
    expect(result).toBe(false)
  })
})

// ============================================================================
// getAvailableBoxTypes Tests
// ============================================================================

describe('getAvailableBoxTypes', () => {
  it('should return all box types when all are available', () => {
    const result = getAvailableBoxTypes(mockCoefficientsAllTypes, 130744)

    expect(result).toHaveLength(3)
    expect(result).toContain(2)
    expect(result).toContain(5)
    expect(result).toContain(6)
  })

  it('should return only available box types', () => {
    const result = getAvailableBoxTypes(mockCoefficientsBoxesAndPallets, 130744)

    expect(result).toHaveLength(2)
    expect(result).toContain(2)
    expect(result).toContain(5)
    expect(result).not.toContain(6)
  })

  it('should return only Boxes when others unavailable', () => {
    const result = getAvailableBoxTypes(mockCoefficientsBoxesOnly, 130744)

    expect(result).toHaveLength(1)
    expect(result).toContain(2)
  })

  it('should return empty array when no coefficients match warehouse', () => {
    const result = getAvailableBoxTypes(mockCoefficientsAllTypes, 999999)
    expect(result).toHaveLength(0)
  })

  it('should return empty array for empty coefficients', () => {
    const result = getAvailableBoxTypes([], 130744)
    expect(result).toHaveLength(0)
  })

  it('should filter by specific warehouse in multi-warehouse data', () => {
    // Warehouse 130744 should have [2, 5]
    const result130744 = getAvailableBoxTypes(mockCoefficientsMultipleWarehouses, 130744)
    expect(result130744).toEqual([2, 5])

    // Warehouse 206348 should have [2, 6]
    const result206348 = getAvailableBoxTypes(mockCoefficientsMultipleWarehouses, 206348)
    expect(result206348).toEqual([2, 6])
  })

  it('should return unique box types (no duplicates)', () => {
    // Add duplicate entries
    const coefficientsWithDuplicates = [
      { warehouseId: 130744, boxTypeId: 2, isAvailable: true },
      { warehouseId: 130744, boxTypeId: 2, isAvailable: true }, // Duplicate
      { warehouseId: 130744, boxTypeId: 5, isAvailable: true },
    ]

    const result = getAvailableBoxTypes(coefficientsWithDuplicates, 130744)
    expect(result).toHaveLength(2) // Should be [2, 5], not [2, 2, 5]
  })

  it('should return sorted box type IDs', () => {
    // Even if API returns in different order
    const unorderedCoefficients = [
      { warehouseId: 130744, boxTypeId: 6, isAvailable: true },
      { warehouseId: 130744, boxTypeId: 2, isAvailable: true },
      { warehouseId: 130744, boxTypeId: 5, isAvailable: true },
    ]

    const result = getAvailableBoxTypes(unorderedCoefficients, 130744)
    expect(result).toEqual([2, 5, 6]) // Sorted
  })
})

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge Cases', () => {
  it('should handle coefficients with missing isAvailable flag as unavailable', () => {
    const coefficientsNoFlag = [
      { warehouseId: 130744, boxTypeId: 2 }, // No isAvailable (optional field)
    ]

    // isAvailable is optional in AcceptanceCoefficient, so undefined = unavailable
    const result = getAvailableBoxTypes(coefficientsNoFlag, 130744)
    expect(result).toHaveLength(0)
  })

  it('should handle isAvailable: false explicitly', () => {
    const coefficientsExplicitFalse = [
      { warehouseId: 130744, boxTypeId: 2, isAvailable: false },
    ]

    const result = getAvailableBoxTypes(coefficientsExplicitFalse, 130744)
    expect(result).toHaveLength(0)
  })

  it('should handle null/undefined in coefficients array gracefully', () => {
    const coefficientsWithNull = [
      { warehouseId: 130744, boxTypeId: 2, isAvailable: true },
      null,
      undefined,
    ]

    // @ts-expect-error Testing malformed data
    const result = getAvailableBoxTypes(coefficientsWithNull, 130744)
    expect(result).toHaveLength(1)
  })
})

// ============================================================================
// Type Safety Tests
// ============================================================================

describe('Type Safety', () => {
  it('should enforce BoxTypeId type (2 | 5 | 6)', () => {
    // These should be valid
    const validTypes: BoxTypeId[] = [2, 5, 6]

    validTypes.forEach((typeId) => {
      const info = getBoxTypeInfo(typeId)
      expect(info.id).toBe(typeId)
    })
  })

  it('should enforce BoxTypeInfo interface shape', () => {
    const info: BoxTypeInfo = getBoxTypeInfo(2)

    // TypeScript compilation validates these fields exist
    expect(typeof info.id).toBe('number')
    expect(typeof info.name).toBe('string')
    expect(typeof info.nameRu).toBe('string')
    expect(typeof info.icon).toBe('string')
    expect(typeof info.description).toBe('string')
    expect(['standard', 'fixed']).toContain(info.storageFormula)
  })

  it('should enforce storageFormula as "standard" | "fixed"', () => {
    Object.values(BOX_TYPES).forEach((boxType) => {
      expect(['standard', 'fixed']).toContain(boxType.storageFormula)
    })
  })
})
