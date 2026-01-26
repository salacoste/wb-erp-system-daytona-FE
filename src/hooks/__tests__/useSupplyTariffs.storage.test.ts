/**
 * Integration tests for useSupplyTariffs hook - Storage Tariff Extraction
 * Story 44.41-FE: Storage Tariff Zero Bug Fix
 * Epic 44: Price Calculator UI (Frontend)
 *
 * TDD Red Phase: These tests are written BEFORE implementation changes.
 * Tests should FAIL initially until the hook is updated.
 *
 * Tests cover:
 * - Storage tariff extraction from SUPPLY API response
 * - Fallback indicator when using default tariffs
 * - Integration with extractStorageTariffs utility
 * - Краснодар Pallets scenario (baseLiterRub: 41.25)
 *
 * @see docs/stories/epic-44/story-44.41-fe-storage-tariff-fix.md
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createQueryWrapper } from '@/test/utils/test-utils'

// Import hook under test
import { useSupplyTariffs } from '../useSupplyTariffs'

// Import API module to mock
import * as tariffsApi from '@/lib/api/tariffs'

// Import types
import type { AcceptanceCoefficient } from '@/types/tariffs'

// ============================================================================
// Mock Setup
// ============================================================================

vi.mock('@/lib/api/tariffs', () => ({
  getAllAcceptanceCoefficients: vi.fn(),
}))

const mockGetAllAcceptanceCoefficients = vi.mocked(tariffsApi.getAllAcceptanceCoefficients)

// ============================================================================
// Test Data Fixtures
// ============================================================================

/** Краснодар (Тихорецкая) Pallets - from backend docs */
const KRASNODAR_PALLETS_COEFFICIENT = {
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
const KRASNODAR_BOXES_COEFFICIENT = {
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
const ZERO_STORAGE_COEFFICIENT = {
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
const STANDARD_WAREHOUSE_COEFFICIENT = {
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

/** API response with multiple warehouses */
const MOCK_API_RESPONSE = {
  coefficients: [
    KRASNODAR_PALLETS_COEFFICIENT,
    KRASNODAR_BOXES_COEFFICIENT,
    ZERO_STORAGE_COEFFICIENT,
    STANDARD_WAREHOUSE_COEFFICIENT,
  ],
  meta: {
    total: 4,
    available: 4,
    unavailable: 0,
    cache_ttl_seconds: 3600,
  },
}

// ============================================================================
// Test Setup
// ============================================================================

describe('useSupplyTariffs - Storage Tariff Extraction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAllAcceptanceCoefficients.mockResolvedValue(MOCK_API_RESPONSE)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // -------------------------------------------------------------------------
  // Basic Hook Functionality
  // -------------------------------------------------------------------------
  describe('basic hook functionality', () => {
    it('should load coefficients from API', async () => {
      const { result } = renderHook(() => useSupplyTariffs(), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.coefficients).toHaveLength(4)
    })

    it('should extract unique warehouses', async () => {
      const { result } = renderHook(() => useSupplyTariffs(), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should have 3 unique warehouses (Краснодар has 2 entries but same ID)
      expect(result.current.warehouses).toHaveLength(3)
    })
  })

  // -------------------------------------------------------------------------
  // Storage Tariff Extraction from findTariffsForDate
  // -------------------------------------------------------------------------
  describe('findTariffsForDate - storage extraction', () => {
    it('should return storage tariffs from SUPPLY response', async () => {
      const { result } = renderHook(() => useSupplyTariffs(), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const tariffs = result.current.findTariffsForDate(206236, '2026-01-27')

      expect(tariffs).not.toBeNull()
      expect(tariffs?.storage.baseLiterRub).toBe(0.07)
      expect(tariffs?.storage.additionalLiterRub).toBe(0.05)
      expect(tariffs?.storage.coefficient).toBe(1.0)
    })

    it('should extract Краснодар Pallets storage (baseLiterRub: 41.25)', async () => {
      // Modify mock to only return Pallets entry
      mockGetAllAcceptanceCoefficients.mockResolvedValue({
        coefficients: [KRASNODAR_PALLETS_COEFFICIENT],
        meta: { total: 1, available: 1, unavailable: 0, cache_ttl_seconds: 3600 },
      })

      const { result } = renderHook(() => useSupplyTariffs(), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const tariffs = result.current.findTariffsForDate(130744, '2026-01-27')

      // Critical assertion: baseLiterRub should be 41.25, NOT 0 and NOT fallback
      expect(tariffs).not.toBeNull()
      expect(tariffs?.storage.baseLiterRub).toBe(41.25)
      expect(tariffs?.storage.additionalLiterRub).toBe(0) // Valid 0 for Pallets
      expect(tariffs?.storage.coefficient).toBe(1.65)
    })

    it('should prefer boxTypeId: 2 (Boxes) when available', async () => {
      const { result } = renderHook(() => useSupplyTariffs(), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Краснодар has both Boxes and Pallets entries
      // Should return Boxes entry (boxTypeId: 2)
      const tariffs = result.current.findTariffsForDate(130744, '2026-01-27')

      expect(tariffs).not.toBeNull()
      expect(tariffs?.boxTypeId).toBe(2) // Boxes preferred
    })
  })

  // -------------------------------------------------------------------------
  // Storage Tariff Fallback Tests
  // -------------------------------------------------------------------------
  describe('storage tariff fallback', () => {
    it('should indicate fallback when storage.baseLiterRub is 0', async () => {
      mockGetAllAcceptanceCoefficients.mockResolvedValue({
        coefficients: [ZERO_STORAGE_COEFFICIENT],
        meta: { total: 1, available: 1, unavailable: 0, cache_ttl_seconds: 3600 },
      })

      const { result } = renderHook(() => useSupplyTariffs(), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // The warehouse list should use fallback storage rates
      const warehouse = result.current.warehouses.find(w => w.id === 507)

      expect(warehouse).toBeDefined()
      // Should apply fallback storage rates (0.11, not 0)
      expect(warehouse?.tariffs.storageBaseLiterRub).toBe(0.11)
      expect(warehouse?.tariffs.storagePerLiterRub).toBe(0.11)
    })

    it('should NOT apply fallback for Pallets with additionalLiterRub = 0', async () => {
      mockGetAllAcceptanceCoefficients.mockResolvedValue({
        coefficients: [KRASNODAR_PALLETS_COEFFICIENT],
        meta: { total: 1, available: 1, unavailable: 0, cache_ttl_seconds: 3600 },
      })

      const { result } = renderHook(() => useSupplyTariffs(), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const warehouse = result.current.warehouses.find(w => w.id === 130744)

      expect(warehouse).toBeDefined()
      // Should NOT use fallback - additionalLiterRub = 0 is valid for Pallets
      // baseLiterRub should still be 41.25
      expect(warehouse?.tariffs.storageBaseLiterRub).toBe(41.25)
      expect(warehouse?.tariffs.storagePerLiterRub).toBe(0) // Valid 0
    })
  })

  // -------------------------------------------------------------------------
  // SupplyWarehouse Type Validation
  // -------------------------------------------------------------------------
  describe('SupplyWarehouse storage tariffs structure', () => {
    it('should include storageBaseLiterRub in warehouse tariffs', async () => {
      const { result } = renderHook(() => useSupplyTariffs(), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const warehouse = result.current.warehouses[0]

      expect(warehouse?.tariffs).toHaveProperty('storageBaseLiterRub')
      expect(typeof warehouse?.tariffs.storageBaseLiterRub).toBe('number')
    })

    it('should include storagePerLiterRub in warehouse tariffs', async () => {
      const { result } = renderHook(() => useSupplyTariffs(), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const warehouse = result.current.warehouses[0]

      expect(warehouse?.tariffs).toHaveProperty('storagePerLiterRub')
      expect(typeof warehouse?.tariffs.storagePerLiterRub).toBe('number')
    })

    it('should include storageCoefficient in warehouse tariffs', async () => {
      const { result } = renderHook(() => useSupplyTariffs(), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const warehouse = result.current.warehouses[0]

      expect(warehouse?.tariffs).toHaveProperty('storageCoefficient')
      expect(typeof warehouse?.tariffs.storageCoefficient).toBe('number')
    })
  })

  // -------------------------------------------------------------------------
  // findTariffsByNameAndDate Storage Extraction
  // -------------------------------------------------------------------------
  describe('findTariffsByNameAndDate - storage extraction', () => {
    it('should extract storage tariffs when finding by name', async () => {
      const { result } = renderHook(() => useSupplyTariffs(), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const tariffs = result.current.findTariffsByNameAndDate('Белые Столбы', '2026-01-27')

      expect(tariffs).not.toBeNull()
      expect(tariffs?.storage.baseLiterRub).toBe(0.07)
    })

    it('should extract Краснодар storage by fuzzy name match', async () => {
      const { result } = renderHook(() => useSupplyTariffs(), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Using partial name match
      const tariffs = result.current.findTariffsByNameAndDate('Краснодар', '2026-01-27')

      expect(tariffs).not.toBeNull()
      // Should match Краснодар (Тихорецкая) and return storage data
      expect(tariffs?.storage).toBeDefined()
      expect(typeof tariffs?.storage.baseLiterRub).toBe('number')
    })
  })

  // -------------------------------------------------------------------------
  // Real-World Bug Scenario Tests
  // -------------------------------------------------------------------------
  describe('bug fix scenario: storage displays 0.00 ₽/день', () => {
    it('should NOT display 0 storage when API returns valid baseLiterRub', async () => {
      const { result } = renderHook(() => useSupplyTariffs(), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // For any warehouse with valid storage rates
      const tariffs = result.current.findTariffsForDate(206236, '2026-01-27')

      expect(tariffs?.storage.baseLiterRub).toBeGreaterThan(0)
    })

    it('should calculate correct daily storage cost for Краснодар Pallets', async () => {
      mockGetAllAcceptanceCoefficients.mockResolvedValue({
        coefficients: [KRASNODAR_PALLETS_COEFFICIENT],
        meta: { total: 1, available: 1, unavailable: 0, cache_ttl_seconds: 3600 },
      })

      const { result } = renderHook(() => useSupplyTariffs(), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const tariffs = result.current.findTariffsForDate(130744, '2026-01-27')

      // Storage cost for 1L: baseLiterRub * coefficient
      // 41.25 * 1.65 = 68.0625 ≈ 68.06 ₽/день
      const dailyStorageCost = (tariffs?.storage.baseLiterRub ?? 0) * (tariffs?.storage.coefficient ?? 1)

      expect(dailyStorageCost).toBeCloseTo(68.06, 1)
      expect(dailyStorageCost).not.toBe(0) // Critical: must NOT be 0
    })

    it('should calculate correct storage cost for 3 liters (Pallets formula)', async () => {
      mockGetAllAcceptanceCoefficients.mockResolvedValue({
        coefficients: [KRASNODAR_PALLETS_COEFFICIENT],
        meta: { total: 1, available: 1, unavailable: 0, cache_ttl_seconds: 3600 },
      })

      const { result } = renderHook(() => useSupplyTariffs(), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const tariffs = result.current.findTariffsForDate(130744, '2026-01-27')

      if (!tariffs) throw new Error('Tariffs should not be null')

      // Storage formula: (baseLiterRub + (volume-1) * additionalLiterRub) * coefficient
      // For Pallets with additionalLiterRub = 0:
      // (41.25 + 2 * 0) * 1.65 = 41.25 * 1.65 = 68.0625 ≈ 68.06 ₽/день
      const volume = 3
      const storageCost =
        (tariffs.storage.baseLiterRub + (volume - 1) * tariffs.storage.additionalLiterRub) *
        tariffs.storage.coefficient

      expect(storageCost).toBeCloseTo(68.06, 1)
    })
  })

  // -------------------------------------------------------------------------
  // Error Handling
  // -------------------------------------------------------------------------
  describe('error handling', () => {
    it('should handle API error gracefully', async () => {
      mockGetAllAcceptanceCoefficients.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useSupplyTariffs(), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBeDefined()
      expect(result.current.coefficients).toHaveLength(0)
    })

    it('should return null for findTariffsForDate when no data', async () => {
      mockGetAllAcceptanceCoefficients.mockResolvedValue({
        coefficients: [],
        meta: { total: 0, available: 0, unavailable: 0, cache_ttl_seconds: 3600 },
      })

      const { result } = renderHook(() => useSupplyTariffs(), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const tariffs = result.current.findTariffsForDate(130744, '2026-01-27')

      expect(tariffs).toBeNull()
    })

    it('should handle missing storage object in API response', async () => {
      const coefficientWithoutStorage = {
        ...STANDARD_WAREHOUSE_COEFFICIENT,
        storage: undefined,
      } as unknown as AcceptanceCoefficient

      mockGetAllAcceptanceCoefficients.mockResolvedValue({
        coefficients: [coefficientWithoutStorage],
        meta: { total: 1, available: 1, unavailable: 0, cache_ttl_seconds: 3600 },
      })

      const { result } = renderHook(() => useSupplyTariffs(), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should not crash - should use fallback
      expect(result.current.warehouses).toHaveLength(1)
      const warehouse = result.current.warehouses[0]

      // Should use fallback storage rates
      expect(warehouse?.tariffs.storageBaseLiterRub).toBe(0.11)
    })
  })
})

// ============================================================================
// Fallback Indicator Tests (New Feature from Story 44.41)
// ============================================================================

describe('useSupplyTariffs - Fallback Indicator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should expose usingStorageFallback flag when storage rates are 0', async () => {
    mockGetAllAcceptanceCoefficients.mockResolvedValue({
      coefficients: [ZERO_STORAGE_COEFFICIENT],
      meta: { total: 1, available: 1, unavailable: 0, cache_ttl_seconds: 3600 },
    })

    const { result } = renderHook(() => useSupplyTariffs(), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Hook should indicate that fallback was used
    // This requires the hook to be updated to track this
    const warehouse = result.current.warehouses.find(w => w.id === 507)

    // New feature: tariffs should include usingFallback indicator
    // This test will fail until the feature is implemented
    expect((warehouse?.tariffs as { usingStorageFallback?: boolean })?.usingStorageFallback).toBe(true)
  })

  it('should NOT set usingStorageFallback when storage rates are valid', async () => {
    mockGetAllAcceptanceCoefficients.mockResolvedValue({
      coefficients: [STANDARD_WAREHOUSE_COEFFICIENT],
      meta: { total: 1, available: 1, unavailable: 0, cache_ttl_seconds: 3600 },
    })

    const { result } = renderHook(() => useSupplyTariffs(), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const warehouse = result.current.warehouses.find(w => w.id === 206236)

    // Should NOT use fallback for valid rates
    expect((warehouse?.tariffs as { usingStorageFallback?: boolean })?.usingStorageFallback).toBeFalsy()
  })
})
