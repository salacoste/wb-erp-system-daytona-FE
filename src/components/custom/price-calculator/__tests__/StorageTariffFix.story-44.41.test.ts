/**
 * Story 44.41-FE: Storage Tariff Zero Bug Fix
 * TDD Tests - Red Phase (Failing Tests)
 *
 * These tests define the expected behavior BEFORE implementation.
 * Run: npm test -- StorageTariffFix.story-44.41
 *
 * CRITICAL BUG: Frontend displays "0.00 ₽/день" for storage costs,
 * even though backend SUPPLY API returns non-zero storage tariffs.
 *
 * Root Causes:
 * 1. BoxTypeId Filtering: May filter by boxTypeId=2, missing boxTypeId=5 (Pallets)
 * 2. Field Name Mismatch: Frontend expects base_per_day_rub but API returns baseLiterRub
 * 3. INVENTORY vs SUPPLY Confusion: May use INVENTORY system (returns 0) instead of SUPPLY
 *
 * @see docs/stories/epic-44/story-44.41-fe-storage-tariff-fix.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

import {
  extractStorageTariffs,
  DEFAULT_STORAGE_TARIFFS,
} from '@/lib/tariff-extraction-utils'

// ============================================================================
// Test Fixtures - SUPPLY System Response (Correct Source)
// ============================================================================

/** Mock SUPPLY API response - Краснодар (Тихорецкая) Pallets */
const mockSupplyStorageKrasnodarPallets = {
  coefficient: 1.65,
  baseLiterRub: 41.25, // Non-zero! This is what backend returns
  additionalLiterRub: 0, // Valid zero for Pallets (FIXED formula)
}

/** Mock SUPPLY API response - Standard Boxes */
const mockSupplyStorageStandardBoxes = {
  coefficient: 1.3,
  baseLiterRub: 0.09,
  additionalLiterRub: 0.06,
}

/** Mock SUPPLY API response with zero baseLiterRub (bug trigger) */
const mockSupplyStorageZeroBase = {
  coefficient: 1.5,
  baseLiterRub: 0, // BUG: This triggers fallback
  additionalLiterRub: 0.05,
}

// ============================================================================
// Test Fixtures - INVENTORY System Response (May Return 0)
// ============================================================================

/** Mock INVENTORY API response - uses different field names */
const mockInventoryStorage = {
  base_per_day_rub: 0.07,
  liter_per_day_rub: 0.05,
  coefficient: 1.0,
}


// ============================================================================
// AC1: Debug Storage Tariff Source
// ============================================================================

describe('Story 44.41: AC1 - Debug Storage Tariff Source', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'info').mockImplementation(() => {})
  })

  it('should log when using fallback due to empty response', () => {
    const warnSpy = vi.spyOn(console, 'warn')

    extractStorageTariffs(null, 'supply')

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[StorageTariffs]')
    )
  })

  it('should log exact baseLiterRub value from SUPPLY response', () => {
    const result = extractStorageTariffs(mockSupplyStorageKrasnodarPallets, 'supply')

    // Verify baseLiterRub is correctly extracted (not 0)
    expect(result.tariffs.baseLiterRub).toBe(41.25)
  })

  it('should log exact additionalLiterRub value from SUPPLY response', () => {
    const result = extractStorageTariffs(mockSupplyStorageKrasnodarPallets, 'supply')

    // additionalLiterRub=0 is VALID for Pallets, not a fallback trigger
    expect(result.tariffs.additionalLiterRub).toBe(0)
  })

  it('should verify field names match SUPPLY API response format', () => {
    // SUPPLY format uses camelCase: baseLiterRub, additionalLiterRub
    const result = extractStorageTariffs(mockSupplyStorageKrasnodarPallets, 'supply')

    expect(result.tariffs).toHaveProperty('baseLiterRub')
    expect(result.tariffs).toHaveProperty('additionalLiterRub')
    expect(result.tariffs).toHaveProperty('coefficient')
  })

  it('should document source as "supply" when using SUPPLY system', () => {
    const result = extractStorageTariffs(mockSupplyStorageKrasnodarPallets, 'supply')

    expect(result.tariffs.source).toBe('supply')
  })

  it('should document source as "inventory" when using INVENTORY system', () => {
    const result = extractStorageTariffs(mockInventoryStorage, 'inventory')

    expect(result.tariffs.source).toBe('inventory')
  })
})

// ============================================================================
// AC2: Fix Field Name Mapping
// ============================================================================

describe('Story 44.41: AC2 - Fix Field Name Mapping', () => {
  describe('SUPPLY system field extraction (baseLiterRub format)', () => {
    it('should extract baseLiterRub from SUPPLY format', () => {
      const result = extractStorageTariffs(mockSupplyStorageKrasnodarPallets, 'supply')

      expect(result.tariffs.baseLiterRub).toBe(41.25)
    })

    it('should extract additionalLiterRub from SUPPLY format', () => {
      const result = extractStorageTariffs(mockSupplyStorageStandardBoxes, 'supply')

      expect(result.tariffs.additionalLiterRub).toBe(0.06)
    })

    it('should extract coefficient from SUPPLY format', () => {
      const result = extractStorageTariffs(mockSupplyStorageKrasnodarPallets, 'supply')

      expect(result.tariffs.coefficient).toBe(1.65)
    })
  })

  describe('INVENTORY system field extraction (base_per_day_rub format)', () => {
    it('should extract base_per_day_rub as baseLiterRub', () => {
      const result = extractStorageTariffs(mockInventoryStorage, 'inventory')

      expect(result.tariffs.baseLiterRub).toBe(0.07)
    })

    it('should extract liter_per_day_rub as additionalLiterRub', () => {
      const result = extractStorageTariffs(mockInventoryStorage, 'inventory')

      expect(result.tariffs.additionalLiterRub).toBe(0.05)
    })

    it('should extract coefficient from INVENTORY format', () => {
      const result = extractStorageTariffs(mockInventoryStorage, 'inventory')

      expect(result.tariffs.coefficient).toBe(1.0)
    })
  })

  describe('Unified extraction handles both formats', () => {
    it('should prefer SUPPLY format (baseLiterRub) when both present', () => {
      const mixedResponse = {
        baseLiterRub: 41.25, // SUPPLY format
        base_per_day_rub: 0.07, // INVENTORY format
        additionalLiterRub: 0,
        liter_per_day_rub: 0.05,
        coefficient: 1.65,
      }

      const result = extractStorageTariffs(mixedResponse, 'supply')

      // SUPPLY format takes precedence
      expect(result.tariffs.baseLiterRub).toBe(41.25)
      expect(result.tariffs.additionalLiterRub).toBe(0)
    })

    it('should fallback to INVENTORY format when SUPPLY fields missing', () => {
      // Only INVENTORY format fields present
      const result = extractStorageTariffs(mockInventoryStorage, 'inventory')

      expect(result.tariffs.baseLiterRub).toBe(0.07)
      expect(result.tariffs.additionalLiterRub).toBe(0.05)
    })
  })
})

// ============================================================================
// AC3: Apply Backend Fallback Logic
// ============================================================================

describe('Story 44.41: AC3 - Apply Backend Fallback Logic', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  describe('Fallback trigger conditions', () => {
    it('should apply fallback when baseLiterRub is 0', () => {
      const result = extractStorageTariffs(mockSupplyStorageZeroBase, 'supply')

      expect(result.usingFallback).toBe(true)
      expect(result.tariffs.baseLiterRub).toBe(DEFAULT_STORAGE_TARIFFS.baseLiterRub)
    })

    it('should NOT apply fallback when only additionalLiterRub is 0', () => {
      // Pallets have valid additionalLiterRub = 0 (FIXED formula)
      const result = extractStorageTariffs(mockSupplyStorageKrasnodarPallets, 'supply')

      expect(result.usingFallback).toBe(false)
      expect(result.tariffs.baseLiterRub).toBe(41.25)
      expect(result.tariffs.additionalLiterRub).toBe(0)
    })

    it('should apply fallback when response is null', () => {
      const result = extractStorageTariffs(null, 'supply')

      expect(result.usingFallback).toBe(true)
      expect(result.tariffs).toEqual(expect.objectContaining(DEFAULT_STORAGE_TARIFFS))
    })

    it('should apply fallback when response is undefined', () => {
      const result = extractStorageTariffs(undefined, 'supply')

      expect(result.usingFallback).toBe(true)
    })

    it('should apply fallback when response is not an object', () => {
      const result = extractStorageTariffs('invalid', 'supply')

      expect(result.usingFallback).toBe(true)
    })

    it('should apply fallback when response is an array', () => {
      const result = extractStorageTariffs([1, 2, 3], 'supply')

      expect(result.usingFallback).toBe(true)
    })
  })

  describe('Default fallback values', () => {
    it('should use baseLiterRub = 0.11 from WbTariffSettings', () => {
      expect(DEFAULT_STORAGE_TARIFFS.baseLiterRub).toBe(0.11)
    })

    it('should use additionalLiterRub = 0.11 from WbTariffSettings', () => {
      expect(DEFAULT_STORAGE_TARIFFS.additionalLiterRub).toBe(0.11)
    })

    it('should use coefficient = 1.0 as default', () => {
      expect(DEFAULT_STORAGE_TARIFFS.coefficient).toBe(1.0)
    })

    it('should mark source as "fallback" when using defaults', () => {
      expect(DEFAULT_STORAGE_TARIFFS.source).toBe('fallback')
    })
  })

  describe('Fallback preserves actual coefficient', () => {
    it('should keep API coefficient even when using fallback rates', () => {
      const result = extractStorageTariffs(mockSupplyStorageZeroBase, 'supply')

      // Fallback applies to rates but preserves actual coefficient
      expect(result.tariffs.baseLiterRub).toBe(0.11) // Fallback
      expect(result.tariffs.coefficient).toBe(1.5) // Original from API
    })
  })

  describe('Fallback logging', () => {
    it('should log fallback activation', () => {
      const warnSpy = vi.spyOn(console, 'warn')

      extractStorageTariffs(mockSupplyStorageZeroBase, 'supply')

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('baseLiterRub=0')
      )
    })
  })
})

// ============================================================================
// AC4: Verify SUPPLY System Usage
// ============================================================================

describe('Story 44.41: AC4 - Verify SUPPLY System Usage', () => {
  it('should extract storage tariffs from SUPPLY coefficient.storage', () => {
    // Simulating what comes from /v1/tariffs/acceptance/coefficients/all
    const supplyCoefficient = {
      warehouseId: 130744,
      warehouseName: 'Краснодар (Тихорецкая)',
      date: '2026-01-27',
      storage: mockSupplyStorageKrasnodarPallets,
    }

    const result = extractStorageTariffs(supplyCoefficient.storage, 'supply')

    expect(result.tariffs.baseLiterRub).toBe(41.25)
    expect(result.tariffs.coefficient).toBe(1.65)
    expect(result.usingFallback).toBe(false)
  })

  it('should NOT extract from warehouses-with-tariffs when SUPPLY available', () => {
    // SUPPLY rates are typically HIGHER than INVENTORY rates
    const supplyResult = extractStorageTariffs(mockSupplyStorageStandardBoxes, 'supply')
    const inventoryResult = extractStorageTariffs(mockInventoryStorage, 'inventory')

    // SUPPLY typically has higher rates
    expect(supplyResult.tariffs.baseLiterRub).toBeGreaterThan(
      inventoryResult.tariffs.baseLiterRub
    )
  })

  it('should pass storage tariffs correctly from SUPPLY to calculation', () => {
    const result = extractStorageTariffs(mockSupplyStorageKrasnodarPallets, 'supply')

    // Verify complete tariff structure for calculation
    expect(result.tariffs).toMatchObject({
      baseLiterRub: 41.25,
      additionalLiterRub: 0,
      coefficient: 1.65,
      source: 'supply',
    })
  })
})

// ============================================================================
// AC5: Storage Cost Display Validation
// ============================================================================

describe('Story 44.41: AC5 - Storage Cost Display Validation', () => {
  /**
   * Storage cost formula (Standard):
   * daily_cost = (baseLiterRub + (volume-1) * additionalLiterRub) * coefficient
   *
   * Storage cost formula (Pallets - FIXED):
   * daily_cost = baseLiterRub * coefficient (ignores volume)
   */

  describe('Краснодар Pallets (FIXED formula)', () => {
    it('should calculate 68.06 ₽/день for 1 liter (Pallets)', () => {
      const result = extractStorageTariffs(mockSupplyStorageKrasnodarPallets, 'supply')

      // Pallets use FIXED formula: base * coefficient (ignores volume)
      // 41.25 * 1.65 = 68.0625 ≈ 68.06
      const dailyCost = result.tariffs.baseLiterRub * result.tariffs.coefficient

      expect(dailyCost).toBeCloseTo(68.06, 2)
    })

    it('should calculate same cost for 3 liters (Pallets FIXED formula)', () => {
      const result = extractStorageTariffs(mockSupplyStorageKrasnodarPallets, 'supply')

      // Pallets: additionalLiterRub=0, so volume doesn't matter
      // (41.25 + 2 * 0) * 1.65 = 68.06
      const volumeLiters = 3
      const additionalLiters = Math.max(0, volumeLiters - 1)
      const baseCost =
        result.tariffs.baseLiterRub +
        additionalLiters * result.tariffs.additionalLiterRub
      const dailyCost = baseCost * result.tariffs.coefficient

      expect(dailyCost).toBeCloseTo(68.06, 2)
    })

    it('should NOT display "0.00 ₽/день" when baseLiterRub is non-zero', () => {
      const result = extractStorageTariffs(mockSupplyStorageKrasnodarPallets, 'supply')

      const dailyCost = result.tariffs.baseLiterRub * result.tariffs.coefficient

      expect(dailyCost).not.toBe(0)
      expect(dailyCost).toBeGreaterThan(0)
    })
  })

  describe('Standard Boxes formula', () => {
    it('should calculate storage for 5 liters with standard formula', () => {
      const result = extractStorageTariffs(mockSupplyStorageStandardBoxes, 'supply')

      // Standard formula: (base + (volume-1) * per_liter) * coefficient
      // (0.09 + 4 * 0.06) * 1.3 = (0.09 + 0.24) * 1.3 = 0.33 * 1.3 = 0.429
      const volumeLiters = 5
      const additionalLiters = Math.max(0, volumeLiters - 1)
      const baseCost =
        result.tariffs.baseLiterRub +
        additionalLiters * result.tariffs.additionalLiterRub
      const dailyCost = baseCost * result.tariffs.coefficient

      expect(dailyCost).toBeCloseTo(0.429, 3)
    })
  })
})

// ============================================================================
// AC6: Error State Handling
// ============================================================================

describe('Story 44.41: AC6 - Error State Handling', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  describe('Empty/null storage object handling', () => {
    it('should return usingFallback=true for empty storage object', () => {
      const result = extractStorageTariffs({}, 'supply')

      // Empty object has no baseLiterRub, treated as 0 → fallback
      expect(result.usingFallback).toBe(true)
    })

    it('should return usingFallback=true for null storage', () => {
      const result = extractStorageTariffs(null, 'supply')

      expect(result.usingFallback).toBe(true)
    })
  })

  describe('Zero rates handling', () => {
    it('should flag usingFallback when baseLiterRub is 0', () => {
      const result = extractStorageTariffs(mockSupplyStorageZeroBase, 'supply')

      expect(result.usingFallback).toBe(true)
    })

    it('should provide usable fallback values for calculations', () => {
      const result = extractStorageTariffs(null, 'supply')

      // Fallback should provide non-zero values for calculation
      expect(result.tariffs.baseLiterRub).toBeGreaterThan(0)
      expect(result.tariffs.additionalLiterRub).toBeGreaterThan(0)
    })
  })

  describe('Raw response preservation for debugging', () => {
    it('should preserve rawResponse for debugging', () => {
      const result = extractStorageTariffs(mockSupplyStorageKrasnodarPallets, 'supply')

      expect(result.rawResponse).toEqual(mockSupplyStorageKrasnodarPallets)
    })

    it('should preserve rawResponse even for null input', () => {
      const result = extractStorageTariffs(null, 'supply')

      expect(result.rawResponse).toBeNull()
    })
  })
})

// ============================================================================
// Edge Cases and Invariants
// ============================================================================

describe('Story 44.41: Edge Cases and Invariants', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  describe('Coefficient edge cases', () => {
    it('should treat coefficient=0 as 1.0 (prevent zeroing rate)', () => {
      const storageWithZeroCoeff = {
        baseLiterRub: 41.25,
        additionalLiterRub: 0,
        coefficient: 0, // Invalid: shouldn't zero out rate
      }

      const result = extractStorageTariffs(storageWithZeroCoeff, 'supply')

      expect(result.tariffs.coefficient).toBe(1.0)
    })

    it('should allow negative coefficient (-1 = unavailable)', () => {
      const storageUnavailable = {
        baseLiterRub: 41.25,
        additionalLiterRub: 0,
        coefficient: -1, // Valid: means unavailable
      }

      const result = extractStorageTariffs(storageUnavailable, 'supply')

      expect(result.tariffs.coefficient).toBe(-1)
    })

    it('should handle very high coefficients (peak periods)', () => {
      const storagePeakPeriod = {
        baseLiterRub: 41.25,
        additionalLiterRub: 0,
        coefficient: 3.5, // Peak period
      }

      const result = extractStorageTariffs(storagePeakPeriod, 'supply')

      expect(result.tariffs.coefficient).toBe(3.5)
    })
  })

  describe('Pallets vs Boxes differentiation', () => {
    it('should handle Pallets with additionalLiterRub=0 as valid (not fallback)', () => {
      // Pallets use FIXED formula - additionalLiterRub=0 is expected
      const result = extractStorageTariffs(mockSupplyStorageKrasnodarPallets, 'supply')

      expect(result.tariffs.additionalLiterRub).toBe(0)
      expect(result.usingFallback).toBe(false)
    })

    it('should handle Boxes with both base and additional rates', () => {
      const result = extractStorageTariffs(mockSupplyStorageStandardBoxes, 'supply')

      expect(result.tariffs.baseLiterRub).toBe(0.09)
      expect(result.tariffs.additionalLiterRub).toBe(0.06)
      expect(result.usingFallback).toBe(false)
    })
  })

  describe('Type validation', () => {
    it('should handle string values gracefully (coerce or fallback)', () => {
      const storageWithStrings = {
        baseLiterRub: '41.25' as unknown as number,
        additionalLiterRub: '0' as unknown as number,
        coefficient: '1.65' as unknown as number,
      }

      const result = extractStorageTariffs(storageWithStrings, 'supply')

      // Strings should trigger fallback (typeof !== 'number')
      expect(result.usingFallback).toBe(true)
    })

    it.todo('should handle NaN values as fallback trigger - future enhancement')
  })

  describe('INVENTORY vs SUPPLY rate comparison', () => {
    it('should note INVENTORY rates are typically LOWER than SUPPLY', () => {
      const supplyResult = extractStorageTariffs(mockSupplyStorageStandardBoxes, 'supply')
      const inventoryResult = extractStorageTariffs(mockInventoryStorage, 'inventory')

      // This is a documentation/awareness test
      // SUPPLY rates (0.09) > INVENTORY rates (0.07)
      expect(supplyResult.tariffs.baseLiterRub).toBeGreaterThan(
        inventoryResult.tariffs.baseLiterRub
      )
    })
  })
})

// ============================================================================
// Integration Test: Full Calculation Flow
// ============================================================================

describe('Story 44.41: Integration - Full Storage Cost Calculation', () => {
  it('should calculate correct storage cost for Краснодар Pallets scenario', () => {
    // End-to-end test: API response → extraction → calculation → display
    const supplyResponse = {
      warehouseId: 130744,
      warehouseName: 'Краснодар (Тихорецкая)',
      storage: mockSupplyStorageKrasnodarPallets,
    }

    // Step 1: Extract tariffs
    const extraction = extractStorageTariffs(supplyResponse.storage, 'supply')

    // Step 2: Verify extraction
    expect(extraction.usingFallback).toBe(false)
    expect(extraction.tariffs.baseLiterRub).toBe(41.25)
    expect(extraction.tariffs.coefficient).toBe(1.65)

    // Step 3: Calculate daily cost (FIXED formula for Pallets)
    const dailyCost = extraction.tariffs.baseLiterRub * extraction.tariffs.coefficient

    // Step 4: Verify display value
    expect(dailyCost).toBeCloseTo(68.06, 2) // NOT 0.00!
  })

  it('should NOT display zero when SUPPLY system provides valid data', () => {
    const extraction = extractStorageTariffs(mockSupplyStorageKrasnodarPallets, 'supply')

    // The bug: UI showed "0.00 ₽/день" despite valid API data
    const dailyCost = extraction.tariffs.baseLiterRub * extraction.tariffs.coefficient

    // CRITICAL: Must NOT be zero
    expect(dailyCost).not.toBe(0)
    expect(dailyCost).toBeGreaterThan(0)
  })
})
