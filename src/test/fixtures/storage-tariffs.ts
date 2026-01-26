/**
 * Test fixtures for Storage Tariff Extraction
 * Story 44.41-FE: Storage Tariff Zero Bug Fix
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Fixtures for testing storage tariff extraction from both
 * SUPPLY and INVENTORY tariff systems.
 *
 * @see docs/stories/epic-44/story-44.41-fe-storage-tariff-fix.md
 */

import type { AcceptanceCoefficient } from '@/types/tariffs'

// ============================================================================
// SUPPLY System Response Fixtures
// ============================================================================

/** Краснодар (Тихорецкая) Pallets - from backend docs */
export const krasnodarPalletsCoefficient: AcceptanceCoefficient = {
  warehouseId: 130744,
  warehouseName: 'Краснодар (Тихорецкая)',
  date: '2026-01-27',
  coefficient: 1.65,
  isAvailable: true,
  allowUnload: true,
  boxTypeId: 5, // Pallets
  boxTypeName: 'Палеты',
  delivery: {
    coefficient: 1.65,
    baseLiterRub: 48,
    additionalLiterRub: 5,
  },
  storage: {
    coefficient: 1.65,
    baseLiterRub: 41.25, // Non-zero! This should NOT trigger fallback
    additionalLiterRub: 0, // Valid 0 for Pallets
  },
  isSortingCenter: false,
}

/** Краснодар Boxes - standard box type */
export const krasnodarBoxesCoefficient: AcceptanceCoefficient = {
  warehouseId: 130744,
  warehouseName: 'Краснодар (Тихорецкая)',
  date: '2026-01-27',
  coefficient: 1.25,
  isAvailable: true,
  allowUnload: true,
  boxTypeId: 2, // Boxes
  boxTypeName: 'Короба',
  delivery: {
    coefficient: 1.25,
    baseLiterRub: 46,
    additionalLiterRub: 14,
  },
  storage: {
    coefficient: 1.25,
    baseLiterRub: 0.08, // Lower rate for boxes
    additionalLiterRub: 0.05,
  },
  isSortingCenter: false,
}

/** Warehouse with zero storage rates (should trigger fallback) */
export const zeroStorageCoefficient: AcceptanceCoefficient = {
  warehouseId: 507,
  warehouseName: 'Коледино',
  date: '2026-01-27',
  coefficient: 1.0,
  isAvailable: true,
  allowUnload: true,
  boxTypeId: 2,
  boxTypeName: 'Короба',
  delivery: {
    coefficient: 1.0,
    baseLiterRub: 46,
    additionalLiterRub: 14,
  },
  storage: {
    coefficient: 1.0,
    baseLiterRub: 0, // Zero - should trigger fallback
    additionalLiterRub: 0,
  },
  isSortingCenter: false,
}

/** Standard warehouse with valid storage rates */
export const standardWarehouseCoefficient: AcceptanceCoefficient = {
  warehouseId: 206236,
  warehouseName: 'Белые Столбы',
  date: '2026-01-27',
  coefficient: 1.0,
  isAvailable: true,
  allowUnload: true,
  boxTypeId: 2,
  boxTypeName: 'Короба',
  delivery: {
    coefficient: 1.0,
    baseLiterRub: 48,
    additionalLiterRub: 5,
  },
  storage: {
    coefficient: 1.0,
    baseLiterRub: 0.07,
    additionalLiterRub: 0.05,
  },
  isSortingCenter: false,
}

// ============================================================================
// Raw Storage Object Fixtures (for tariff-extraction-utils tests)
// ============================================================================

/** SUPPLY format storage object - Краснодар Pallets */
export const supplyStorageKrasnodarPallets = {
  coefficient: 1.65,
  baseLiterRub: 41.25,
  additionalLiterRub: 0,
}

/** SUPPLY format storage object - Standard */
export const supplyStorageStandard = {
  coefficient: 1.0,
  baseLiterRub: 48.0,
  additionalLiterRub: 5.0,
}

/** SUPPLY format storage object - Zero rates (triggers fallback) */
export const supplyStorageZero = {
  coefficient: 1.5,
  baseLiterRub: 0,
  additionalLiterRub: 0,
}

/** INVENTORY format storage object */
export const inventoryStorage = {
  base_per_day_rub: 0.07,
  liter_per_day_rub: 0.05,
  coefficient: 1.0,
}

/** INVENTORY format storage object - Higher rates */
export const inventoryStorageHigh = {
  base_per_day_rub: 0.12,
  liter_per_day_rub: 0.08,
  coefficient: 1.25,
}

/** Mixed format storage object (both naming conventions) */
export const mixedFormatStorage = {
  // SUPPLY format (should take precedence)
  baseLiterRub: 41.25,
  additionalLiterRub: 0,
  // INVENTORY format (fallback)
  base_per_day_rub: 0.07,
  liter_per_day_rub: 0.05,
  coefficient: 1.65,
}

// ============================================================================
// Expected Values (for assertions)
// ============================================================================

/** Default fallback storage tariffs (from backend WbTariffSettings) */
export const defaultStorageTariffs = {
  baseLiterRub: 0.11,
  additionalLiterRub: 0.11,
  coefficient: 1.0,
  source: 'fallback' as const,
}

/** Expected storage cost for Краснодар Pallets (1L) */
export const krasnodarPallets1LCost = {
  volumeLiters: 1,
  baseLiterRub: 41.25,
  coefficient: 1.65,
  // 41.25 * 1.65 = 68.0625 ≈ 68.06 ₽/день
  dailyCost: 68.06,
}

/** Expected storage cost for Краснодар Pallets (3L) */
export const krasnodarPallets3LCost = {
  volumeLiters: 3,
  baseLiterRub: 41.25,
  additionalLiterRub: 0,
  coefficient: 1.65,
  // (41.25 + 2 * 0) * 1.65 = 68.0625 ≈ 68.06 ₽/день
  dailyCost: 68.06,
}

// ============================================================================
// Mock API Response Factory
// ============================================================================

/** Create mock API response with given coefficients */
export function createMockApiResponse(coefficients: AcceptanceCoefficient[]) {
  return {
    coefficients,
    meta: {
      total: coefficients.length,
      available: coefficients.filter(c => c.isAvailable).length,
      unavailable: coefficients.filter(c => !c.isAvailable).length,
      cache_ttl_seconds: 3600,
    },
  }
}

/** Full mock API response with multiple warehouses */
export const fullMockApiResponse = createMockApiResponse([
  krasnodarPalletsCoefficient,
  krasnodarBoxesCoefficient,
  zeroStorageCoefficient,
  standardWarehouseCoefficient,
])
