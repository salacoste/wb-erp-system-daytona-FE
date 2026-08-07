/**
 * Tariff Extraction Utilities
 * Story 44.41-FE: Storage Tariff Zero Bug Fix
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Extracts normalized storage tariffs from a raw API response, applying a
 * deterministic fallback when the base rate is missing/zero. Implemented and
 * shipped (see tests in src/lib/__tests__/tariff-extraction-utils.test.ts).
 *
 * Fallback rules (current behavior, not aspirational):
 * - SUPPLY shape:   baseLiterRub / additionalLiterRub / coefficient
 * - INVENTORY shape: base_per_day_rub / liter_per_day_rub / coefficient
 * - SUPPLY field names take precedence when both are present.
 * - Fallback triggers ONLY on baseLiterRub === 0 (or non-numeric / null /
 *   non-object response). additionalLiterRub === 0 is VALID for Pallets and
 *   is NOT a fallback trigger.
 * - On fallback: baseLiterRub/additionalLiterRub revert to DEFAULT_STORAGE_TARIFFS,
 *   but the real `coefficient` from the response is PRESERVED (incl. -1 = unavailable).
 * - Warning emission: a direct per-call `logger.warn` fires by default. Callers
 *   that aggregate many rows (e.g. supply-tariffs-lookup) pass `{ warn: false }`
 *   and emit one summary diagnostic via TariffFallbackDiagnostics instead (AC#4).
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

/**
 * Storage tariff extraction result.
 * `fallbackReason` is a stable, non-sensitive code describing which fallback
 * branch fired ('empty-response' | 'base-zero'); present only when
 * `usingFallback === true`. Aggregate callers use it to dedup diagnostics.
 */
export interface StorageTariffExtraction {
  tariffs: NormalizedStorageTariffs
  usingFallback: boolean
  fallbackReason?: 'empty-response' | 'base-zero'
  rawResponse: unknown
}

interface ExtractStorageTariffsOptions {
  warn?: boolean
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

import { logger } from '@/lib/logger'

// ============================================================================
// Functions
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
  source: 'inventory' | 'supply',
  options: ExtractStorageTariffsOptions = {}
): StorageTariffExtraction {
  // Handle null/undefined/non-object responses
  if (!storageResponse || typeof storageResponse !== 'object' || Array.isArray(storageResponse)) {
    if (options.warn !== false) {
      logger.warn('[StorageTariffs] Empty or invalid response, using fallback')
    }
    return {
      tariffs: { ...DEFAULT_STORAGE_TARIFFS },
      usingFallback: true,
      fallbackReason: 'empty-response',
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
  const rawCoefficient = typeof storage.coefficient === 'number' ? storage.coefficient : 1.0
  // Zero coefficient treated as 1.0 (shouldn't zero out the rate)
  // Negative coefficients (-1 means unavailable) are valid
  const coefficient = rawCoefficient === 0 ? 1.0 : rawCoefficient

  // Apply fallback ONLY when baseLiterRub is 0
  // NOTE: additionalLiterRub = 0 is VALID for Pallets, not a fallback trigger
  if (baseLiterRub === 0) {
    if (options.warn !== false) {
      logger.warn('[StorageTariffs] baseLiterRub=0, applying fallback')
    }
    return {
      tariffs: {
        baseLiterRub: DEFAULT_STORAGE_TARIFFS.baseLiterRub,
        additionalLiterRub: DEFAULT_STORAGE_TARIFFS.additionalLiterRub,
        coefficient, // Preserve actual coefficient even with fallback
        source: 'fallback',
      },
      usingFallback: true,
      fallbackReason: 'base-zero',
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
