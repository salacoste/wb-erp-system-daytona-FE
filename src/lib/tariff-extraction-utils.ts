/**
 * Tariff Extraction Utilities
 * Story 44.41-FE: Storage Tariff Zero Bug Fix
 * Epic 44: Price Calculator UI (Frontend)
 *
 * STUB FILE - TDD Red Phase
 * This file contains minimal type definitions and placeholder functions.
 * Implementation will be added to make tests pass (Green Phase).
 *
 * @see docs/stories/epic-44/story-44.41-fe-storage-tariff-fix.md
 */

// ============================================================================
// Types
// ============================================================================

/** Source of tariff data */
export type TariffSource = 'inventory' | 'supply' | 'fallback'

/** Normalized storage tariffs (works with both INVENTORY and SUPPLY) */
export interface NormalizedStorageTariffs {
  baseLiterRub: number
  additionalLiterRub: number
  coefficient: number
  source: TariffSource
}

/** Storage tariff extraction result */
export interface StorageTariffExtraction {
  tariffs: NormalizedStorageTariffs
  usingFallback: boolean
  rawResponse: unknown
}

// ============================================================================
// Constants
// ============================================================================

/** Default storage tariffs when no data available (from WbTariffSettings) */
export const DEFAULT_STORAGE_TARIFFS: NormalizedStorageTariffs = {
  baseLiterRub: 0.11,
  additionalLiterRub: 0.11,
  coefficient: 1.0,
  source: 'fallback',
}

// ============================================================================
// Functions (STUB - to be implemented)
// ============================================================================

/**
 * Extract storage tariffs from API response with fallback
 * Handles both INVENTORY and SUPPLY naming conventions
 *
 * Logic:
 * - SUPPLY format: baseLiterRub, additionalLiterRub, coefficient
 * - INVENTORY format: base_per_day_rub, liter_per_day_rub, coefficient
 * - Fallback triggers when baseLiterRub === 0 (NOT when additionalLiterRub === 0)
 * - Pallets have valid additionalLiterRub = 0 (not a fallback trigger)
 *
 * @param storageResponse - Raw storage object from API
 * @param source - Source system ('inventory' | 'supply')
 * @returns Extraction result with normalized tariffs
 */
export function extractStorageTariffs(
  storageResponse: unknown,
  source: 'inventory' | 'supply'
): StorageTariffExtraction {
  // Handle null/undefined/non-object responses
  if (!storageResponse || typeof storageResponse !== 'object' || Array.isArray(storageResponse)) {
    console.warn('[StorageTariffs] Empty or invalid response, using fallback')
    return {
      tariffs: { ...DEFAULT_STORAGE_TARIFFS },
      usingFallback: true,
      rawResponse: storageResponse,
    }
  }

  const storage = storageResponse as Record<string, unknown>

  // Extract baseLiterRub: SUPPLY format takes precedence over INVENTORY format
  const baseLiterRub =
    typeof storage.baseLiterRub === 'number'
      ? storage.baseLiterRub
      : typeof storage.base_per_day_rub === 'number'
        ? storage.base_per_day_rub
        : 0

  // Extract additionalLiterRub: SUPPLY format takes precedence over INVENTORY format
  const additionalLiterRub =
    typeof storage.additionalLiterRub === 'number'
      ? storage.additionalLiterRub
      : typeof storage.liter_per_day_rub === 'number'
        ? storage.liter_per_day_rub
        : 0

  // Extract coefficient: default to 1.0 if missing or 0
  const rawCoefficient =
    typeof storage.coefficient === 'number' ? storage.coefficient : 1.0
  // Zero coefficient treated as 1.0 (shouldn't zero out the rate)
  // Negative coefficients (-1 means unavailable) are valid
  const coefficient = rawCoefficient === 0 ? 1.0 : rawCoefficient

  // Apply fallback ONLY when baseLiterRub is 0
  // NOTE: additionalLiterRub = 0 is VALID for Pallets, not a fallback trigger
  if (baseLiterRub === 0) {
    console.warn('[StorageTariffs] baseLiterRub=0, applying fallback')
    return {
      tariffs: {
        baseLiterRub: DEFAULT_STORAGE_TARIFFS.baseLiterRub,
        additionalLiterRub: DEFAULT_STORAGE_TARIFFS.additionalLiterRub,
        coefficient, // Preserve actual coefficient even with fallback
        source: 'fallback',
      },
      usingFallback: true,
      rawResponse: storageResponse,
    }
  }

  // Valid storage tariffs extracted
  return {
    tariffs: {
      baseLiterRub,
      additionalLiterRub,
      coefficient,
      source,
    },
    usingFallback: false,
    rawResponse: storageResponse,
  }
}
