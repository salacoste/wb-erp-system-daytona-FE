/**
 * Unit tests for tariff-extraction-utils.ts
 * Story 44.41-FE: Storage Tariff Zero Bug Fix
 * Epic 44: Price Calculator UI (Frontend)
 *
 * TDD Red Phase: These tests are written BEFORE implementation.
 * All tests should FAIL initially until the utility is implemented.
 *
 * Tests cover:
 * - SUPPLY format extraction (baseLiterRub, additionalLiterRub)
 * - INVENTORY format extraction (base_per_day_rub, liter_per_day_rub)
 * - Fallback logic when baseLiterRub = 0
 * - Null/undefined storage object handling
 * - Pallets edge case (additionalLiterRub = 0 is valid)
 * - Coefficient extraction and normalization
 *
 * @see docs/stories/epic-44/story-44.41-fe-storage-tariff-fix.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Import the utility to be created
// NOTE: This import will fail until the utility is implemented (TDD Red Phase)
import {
  extractStorageTariffs,
  DEFAULT_STORAGE_TARIFFS,
  type NormalizedStorageTariffs,
  type StorageTariffExtraction,
} from '../tariff-extraction-utils'

// ============================================================================
// Test Data Fixtures (from Story 44.41 specification)
// ============================================================================

/** SUPPLY format response - Краснодар Pallets example from backend docs */
const SUPPLY_RESPONSE_KRASNODAR_PALLETS = {
  coefficient: 1.65,
  baseLiterRub: 41.25,
  additionalLiterRub: 0, // Valid 0 for Pallets - NOT a fallback trigger
}

/** SUPPLY format response - Standard Boxes */
const SUPPLY_RESPONSE_STANDARD_BOXES = {
  coefficient: 1.0,
  baseLiterRub: 48.0,
  additionalLiterRub: 5.0,
}

/** SUPPLY format response - Zero rates (triggers fallback) */
const SUPPLY_RESPONSE_ZERO_RATES = {
  coefficient: 1.5,
  baseLiterRub: 0,
  additionalLiterRub: 0,
}

/** INVENTORY format response */
const INVENTORY_RESPONSE = {
  base_per_day_rub: 0.07,
  liter_per_day_rub: 0.05,
  coefficient: 1.0,
}

/** INVENTORY format response with non-standard values */
const INVENTORY_RESPONSE_HIGH_RATES = {
  base_per_day_rub: 0.12,
  liter_per_day_rub: 0.08,
  coefficient: 1.25,
}

/** Mixed format response (both naming conventions present) */
const MIXED_FORMAT_RESPONSE = {
  // SUPPLY format (should take precedence)
  baseLiterRub: 41.25,
  additionalLiterRub: 0,
  // INVENTORY format (fallback)
  base_per_day_rub: 0.07,
  liter_per_day_rub: 0.05,
  coefficient: 1.65,
}

/** Expected fallback tariffs from Story 44.41 */
const EXPECTED_FALLBACK_TARIFFS = {
  baseLiterRub: 0.11,
  additionalLiterRub: 0.11,
  coefficient: 1.0,
  source: 'fallback' as const,
}

// ============================================================================
// extractStorageTariffs Tests
// ============================================================================

describe('extractStorageTariffs', () => {
  // Spy on console.warn to verify logging
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  // -------------------------------------------------------------------------
  // SUPPLY Format Extraction Tests
  // -------------------------------------------------------------------------
  describe('SUPPLY format extraction', () => {
    it('should extract baseLiterRub from SUPPLY response', () => {
      const result = extractStorageTariffs(SUPPLY_RESPONSE_STANDARD_BOXES, 'supply')

      expect(result.tariffs.baseLiterRub).toBe(48.0)
    })

    it('should extract additionalLiterRub from SUPPLY response', () => {
      const result = extractStorageTariffs(SUPPLY_RESPONSE_STANDARD_BOXES, 'supply')

      expect(result.tariffs.additionalLiterRub).toBe(5.0)
    })

    it('should extract coefficient from SUPPLY response', () => {
      const result = extractStorageTariffs(SUPPLY_RESPONSE_STANDARD_BOXES, 'supply')

      expect(result.tariffs.coefficient).toBe(1.0)
    })

    it('should set source to "supply" for SUPPLY format', () => {
      const result = extractStorageTariffs(SUPPLY_RESPONSE_STANDARD_BOXES, 'supply')

      expect(result.tariffs.source).toBe('supply')
    })

    it('should set usingFallback to false for valid SUPPLY data', () => {
      const result = extractStorageTariffs(SUPPLY_RESPONSE_STANDARD_BOXES, 'supply')

      expect(result.usingFallback).toBe(false)
    })

    it('should preserve rawResponse for debugging', () => {
      const result = extractStorageTariffs(SUPPLY_RESPONSE_STANDARD_BOXES, 'supply')

      expect(result.rawResponse).toBe(SUPPLY_RESPONSE_STANDARD_BOXES)
    })

    it('should handle Краснодар Pallets (baseLiterRub: 41.25, coefficient: 1.65)', () => {
      const result = extractStorageTariffs(SUPPLY_RESPONSE_KRASNODAR_PALLETS, 'supply')

      expect(result.tariffs.baseLiterRub).toBe(41.25)
      expect(result.tariffs.additionalLiterRub).toBe(0)
      expect(result.tariffs.coefficient).toBe(1.65)
      expect(result.usingFallback).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // INVENTORY Format Extraction Tests
  // -------------------------------------------------------------------------
  describe('INVENTORY format extraction', () => {
    it('should extract base_per_day_rub as baseLiterRub', () => {
      const result = extractStorageTariffs(INVENTORY_RESPONSE, 'inventory')

      expect(result.tariffs.baseLiterRub).toBe(0.07)
    })

    it('should extract liter_per_day_rub as additionalLiterRub', () => {
      const result = extractStorageTariffs(INVENTORY_RESPONSE, 'inventory')

      expect(result.tariffs.additionalLiterRub).toBe(0.05)
    })

    it('should extract coefficient from INVENTORY response', () => {
      const result = extractStorageTariffs(INVENTORY_RESPONSE, 'inventory')

      expect(result.tariffs.coefficient).toBe(1.0)
    })

    it('should set source to "inventory" for INVENTORY format', () => {
      const result = extractStorageTariffs(INVENTORY_RESPONSE, 'inventory')

      expect(result.tariffs.source).toBe('inventory')
    })

    it('should set usingFallback to false for valid INVENTORY data', () => {
      const result = extractStorageTariffs(INVENTORY_RESPONSE, 'inventory')

      expect(result.usingFallback).toBe(false)
    })

    it('should handle higher INVENTORY rates', () => {
      const result = extractStorageTariffs(INVENTORY_RESPONSE_HIGH_RATES, 'inventory')

      expect(result.tariffs.baseLiterRub).toBe(0.12)
      expect(result.tariffs.additionalLiterRub).toBe(0.08)
      expect(result.tariffs.coefficient).toBe(1.25)
    })
  })

  // -------------------------------------------------------------------------
  // Fallback Logic Tests
  // -------------------------------------------------------------------------
  describe('fallback logic', () => {
    it('should apply fallback when baseLiterRub is 0', () => {
      const result = extractStorageTariffs(SUPPLY_RESPONSE_ZERO_RATES, 'supply')

      expect(result.usingFallback).toBe(true)
      expect(result.tariffs.baseLiterRub).toBe(0.11)
      expect(result.tariffs.additionalLiterRub).toBe(0.11)
    })

    it('should preserve coefficient when applying fallback', () => {
      // Coefficient 1.5 from response should be preserved even with fallback
      const result = extractStorageTariffs(SUPPLY_RESPONSE_ZERO_RATES, 'supply')

      expect(result.tariffs.coefficient).toBe(1.5)
    })

    it('should set source to "fallback" when using defaults', () => {
      const result = extractStorageTariffs(SUPPLY_RESPONSE_ZERO_RATES, 'supply')

      expect(result.tariffs.source).toBe('fallback')
    })

    it('should apply fallback when storage object is null', () => {
      const result = extractStorageTariffs(null, 'supply')

      expect(result.usingFallback).toBe(true)
      expect(result.tariffs).toEqual(EXPECTED_FALLBACK_TARIFFS)
    })

    it('should apply fallback when storage object is undefined', () => {
      const result = extractStorageTariffs(undefined, 'supply')

      expect(result.usingFallback).toBe(true)
      expect(result.tariffs).toEqual(EXPECTED_FALLBACK_TARIFFS)
    })

    it('should apply fallback when storage object is empty', () => {
      const result = extractStorageTariffs({}, 'supply')

      expect(result.usingFallback).toBe(true)
      expect(result.tariffs.baseLiterRub).toBe(0.11)
    })

    it('should log warning when fallback is applied', () => {
      extractStorageTariffs(null, 'supply')

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[StorageTariffs]')
      )
    })

    it('should NOT apply fallback for Pallets with additionalLiterRub = 0', () => {
      // Critical test: additionalLiterRub = 0 is VALID for Pallets
      // Only baseLiterRub = 0 should trigger fallback
      const result = extractStorageTariffs(SUPPLY_RESPONSE_KRASNODAR_PALLETS, 'supply')

      expect(result.usingFallback).toBe(false)
      expect(result.tariffs.baseLiterRub).toBe(41.25) // NOT 0.11 (fallback)
      expect(result.tariffs.additionalLiterRub).toBe(0) // Valid 0
    })

    it('should NOT apply fallback when only additionalLiterRub is 0', () => {
      const palletStyle = {
        baseLiterRub: 50.0,
        additionalLiterRub: 0,
        coefficient: 1.0,
      }
      const result = extractStorageTariffs(palletStyle, 'supply')

      expect(result.usingFallback).toBe(false)
      expect(result.tariffs.additionalLiterRub).toBe(0)
    })
  })

  // -------------------------------------------------------------------------
  // Mixed Format and Priority Tests
  // -------------------------------------------------------------------------
  describe('mixed format handling', () => {
    it('should prefer SUPPLY format (baseLiterRub) over INVENTORY format', () => {
      const result = extractStorageTariffs(MIXED_FORMAT_RESPONSE, 'supply')

      // Should use baseLiterRub (41.25), not base_per_day_rub (0.07)
      expect(result.tariffs.baseLiterRub).toBe(41.25)
    })

    it('should fallback to INVENTORY format when SUPPLY fields are missing', () => {
      const inventoryOnly = {
        base_per_day_rub: 0.15,
        liter_per_day_rub: 0.10,
        coefficient: 1.2,
      }
      const result = extractStorageTariffs(inventoryOnly, 'supply')

      expect(result.tariffs.baseLiterRub).toBe(0.15)
      expect(result.tariffs.additionalLiterRub).toBe(0.10)
    })
  })

  // -------------------------------------------------------------------------
  // Coefficient Edge Cases
  // -------------------------------------------------------------------------
  describe('coefficient handling', () => {
    it('should default coefficient to 1.0 when not provided', () => {
      const noCoefficient = {
        baseLiterRub: 48.0,
        additionalLiterRub: 5.0,
      }
      const result = extractStorageTariffs(noCoefficient, 'supply')

      expect(result.tariffs.coefficient).toBe(1.0)
    })

    it('should default coefficient to 1.0 when coefficient is 0', () => {
      const zeroCoefficient = {
        baseLiterRub: 48.0,
        additionalLiterRub: 5.0,
        coefficient: 0,
      }
      const result = extractStorageTariffs(zeroCoefficient, 'supply')

      // Zero coefficient should be treated as 1.0 (no coefficient shouldn't zero out rate)
      expect(result.tariffs.coefficient).toBe(1.0)
    })

    it('should accept negative coefficient (-1 means unavailable)', () => {
      const unavailable = {
        baseLiterRub: 48.0,
        additionalLiterRub: 5.0,
        coefficient: -1,
      }
      const result = extractStorageTariffs(unavailable, 'supply')

      // -1 is a valid value (means unavailable), should preserve it
      expect(result.tariffs.coefficient).toBe(-1)
    })

    it('should handle high coefficient values', () => {
      const highCoeff = {
        baseLiterRub: 48.0,
        additionalLiterRub: 5.0,
        coefficient: 2.5,
      }
      const result = extractStorageTariffs(highCoeff, 'supply')

      expect(result.tariffs.coefficient).toBe(2.5)
    })
  })

  // -------------------------------------------------------------------------
  // Type Validation Tests
  // -------------------------------------------------------------------------
  describe('type validation', () => {
    it('should handle non-numeric baseLiterRub gracefully', () => {
      const badData = {
        baseLiterRub: 'invalid' as unknown as number,
        additionalLiterRub: 5.0,
        coefficient: 1.0,
      }
      const result = extractStorageTariffs(badData, 'supply')

      // Should fallback since baseLiterRub is not a valid number
      expect(result.usingFallback).toBe(true)
    })

    it('should handle non-object input gracefully', () => {
      const result = extractStorageTariffs('invalid' as unknown, 'supply')

      expect(result.usingFallback).toBe(true)
      expect(result.tariffs).toEqual(EXPECTED_FALLBACK_TARIFFS)
    })

    it('should handle array input gracefully', () => {
      const result = extractStorageTariffs([] as unknown, 'supply')

      expect(result.usingFallback).toBe(true)
    })
  })
})

// ============================================================================
// DEFAULT_STORAGE_TARIFFS Tests
// ============================================================================

describe('DEFAULT_STORAGE_TARIFFS', () => {
  it('should have correct default baseLiterRub (0.11)', () => {
    expect(DEFAULT_STORAGE_TARIFFS.baseLiterRub).toBe(0.11)
  })

  it('should have correct default additionalLiterRub (0.11)', () => {
    expect(DEFAULT_STORAGE_TARIFFS.additionalLiterRub).toBe(0.11)
  })

  it('should have correct default coefficient (1.0)', () => {
    expect(DEFAULT_STORAGE_TARIFFS.coefficient).toBe(1.0)
  })

  it('should have source set to "fallback"', () => {
    expect(DEFAULT_STORAGE_TARIFFS.source).toBe('fallback')
  })
})

// ============================================================================
// Type Safety Tests (compile-time checks documented as runtime assertions)
// ============================================================================

describe('type exports', () => {
  it('should export NormalizedStorageTariffs type with correct shape', () => {
    // This test documents the expected type structure
    const tariffs: NormalizedStorageTariffs = {
      baseLiterRub: 41.25,
      additionalLiterRub: 0,
      coefficient: 1.65,
      source: 'supply',
    }

    expect(tariffs.baseLiterRub).toBeDefined()
    expect(tariffs.additionalLiterRub).toBeDefined()
    expect(tariffs.coefficient).toBeDefined()
    expect(tariffs.source).toBeDefined()
  })

  it('should export StorageTariffExtraction type with correct shape', () => {
    // This test documents the expected extraction result structure
    const extraction: StorageTariffExtraction = {
      tariffs: {
        baseLiterRub: 41.25,
        additionalLiterRub: 0,
        coefficient: 1.65,
        source: 'supply',
      },
      usingFallback: false,
      rawResponse: { baseLiterRub: 41.25 },
    }

    expect(extraction.tariffs).toBeDefined()
    expect(extraction.usingFallback).toBeDefined()
    expect(extraction.rawResponse).toBeDefined()
  })
})

// ============================================================================
// Integration Scenario Tests
// ============================================================================

describe('real-world scenarios', () => {
  it('should correctly extract Краснодар Pallets from backend docs example', () => {
    // From docs/request-backend/98-warehouses-tariffs-BACKEND-RESPONSE.md
    const backendResponse = {
      coefficient: 1.65,
      baseLiterRub: 41.25,
      additionalLiterRub: 0,
    }

    const result = extractStorageTariffs(backendResponse, 'supply')

    // Expected: Non-zero storage tariffs, NOT fallback
    expect(result.usingFallback).toBe(false)
    expect(result.tariffs.baseLiterRub).toBe(41.25)
    expect(result.tariffs.coefficient).toBe(1.65)

    // Storage cost for 1L: 41.25 * 1.65 = 68.0625 ≈ 68.06 ₽/день
    const storageCost1L = result.tariffs.baseLiterRub * result.tariffs.coefficient
    expect(storageCost1L).toBeCloseTo(68.06, 1)
  })

  it('should handle typical INVENTORY warehouse response', () => {
    // Typical INVENTORY rates are lower than SUPPLY
    const inventoryResponse = {
      base_per_day_rub: 0.07,
      liter_per_day_rub: 0.05,
      coefficient: 1.0,
    }

    const result = extractStorageTariffs(inventoryResponse, 'inventory')

    expect(result.usingFallback).toBe(false)
    expect(result.tariffs.baseLiterRub).toBe(0.07)
    expect(result.tariffs.source).toBe('inventory')
  })

  it('should handle API returning zero storage (current bug scenario)', () => {
    // This is the bug scenario: API returns 0, frontend should apply fallback
    const buggyResponse = {
      coefficient: 1.65,
      baseLiterRub: 0, // Bug: returns 0 instead of actual rate
      additionalLiterRub: 0,
    }

    const result = extractStorageTariffs(buggyResponse, 'supply')

    // Should apply fallback and indicate it
    expect(result.usingFallback).toBe(true)
    expect(result.tariffs.baseLiterRub).toBe(0.11) // Fallback rate
    expect(result.tariffs.coefficient).toBe(1.65) // Preserve actual coefficient
  })
})
