/**
 * Unit tests for useWarehouseCoefficients hook
 * Story 44.26a-FE: Product Search & Delivery Date Selection
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Tests the warehouse coefficient state management including:
 * - Matching warehouses by NAME (not ID) to resolve endpoint ID mismatch
 * - Auto-fill from /all acceptance coefficients endpoint
 * - Manual override and restore functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useWarehouseCoefficients } from '../useWarehouseCoefficients'
import { createQueryWrapper } from '@/test/utils/test-utils'
import type { Warehouse } from '@/types/warehouse'
import type { GroupedCoefficients } from '../useAllAcceptanceCoefficients'
import type { AcceptanceCoefficient } from '@/types/tariffs'

// Mock warehouse data from /v1/tariffs/warehouses-with-tariffs
const mockWarehouse: Warehouse = {
  id: 1733387774, // This is the tariff DB ID (different from OrdersFBW API ID!)
  name: 'Коледино',
  tariffs: {
    deliveryBaseLiterRub: 46,
    deliveryPerLiterRub: 14,
    logisticsCoefficient: 1.2,
    storageBaseLiterRub: 0.07,
    storagePerLiterRub: 0.05,
    storageCoefficient: 1.1,
  },
}

// Base coefficient factory for tests
const createCoefficient = (
  date: string,
  coefficient: number,
  isAvailable: boolean
): AcceptanceCoefficient => ({
  warehouseId: 507, // OrdersFBW API ID
  warehouseName: 'Коледино', // Matched by NAME
  date,
  coefficient,
  boxTypeId: 2,
  boxTypeName: 'Коробы',
  isAvailable,
  allowUnload: true,
  isSortingCenter: false,
  delivery: { baseLiterRub: 50, additionalLiterRub: 5, coefficient: 1.25 },
  storage: { baseLiterRub: 2, additionalLiterRub: 0.5, coefficient: 1.1 },
})

// Mock coefficients from /v1/tariffs/acceptance/coefficients/all
// Note: warehouseId here is from OrdersFBW API (507), different from tariff DB (1733387774)
const mockAllCoefficients: AcceptanceCoefficient[] = [
  createCoefficient('2026-01-22', 1.0, true),
  createCoefficient('2026-01-23', 1.25, true),
  createCoefficient('2026-01-24', 1.5, true),
  createCoefficient('2026-01-25', -1, false), // Unavailable
  createCoefficient('2026-01-26', 1.0, true),
  createCoefficient('2026-01-27', 2.0, true),
  createCoefficient('2026-01-28', 2.5, true),
]

// Create grouped coefficients (as returned by useAllAcceptanceCoefficients)
function createGroupedCoefficients(coefficients: AcceptanceCoefficient[]): GroupedCoefficients {
  const byName = new Map()
  const byId = new Map()

  for (const coeff of coefficients) {
    const name = coeff.warehouseName
    const id = coeff.warehouseId

    if (!byName.has(name)) {
      byName.set(name, { warehouseId: id, warehouseName: name, coefficients: [] })
    }
    byName.get(name)!.coefficients.push(coeff)

    if (!byId.has(id)) {
      byId.set(id, byName.get(name)!)
    }
  }

  return { byName, byId }
}

const mockUseAllAcceptanceCoefficients = vi.fn()

vi.mock('../useAllAcceptanceCoefficients', () => ({
  useAllAcceptanceCoefficients: () => mockUseAllAcceptanceCoefficients(),
  findCoefficientsByName: (grouped: GroupedCoefficients | undefined, name: string | undefined) => {
    if (!grouped || !name) return null
    return grouped.byName.get(name) ?? null
  },
}))

describe('useWarehouseCoefficients', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default mock - no data
    mockUseAllAcceptanceCoefficients.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ==========================================================================
  // Initial State Tests
  // ==========================================================================

  describe('initial state', () => {
    it('returns default values when warehouse is null', () => {
      const { result } = renderHook(() => useWarehouseCoefficients(null, null), {
        wrapper: createQueryWrapper(),
      })

      expect(result.current.logisticsCoeff.value).toBe(1.0)
      expect(result.current.logisticsCoeff.source).toBe('manual')
      expect(result.current.storageCoeff.value).toBe(1.0)
      expect(result.current.storageCoeff.source).toBe('manual')
      expect(result.current.deliveryDate.date).toBeNull()
      expect(result.current.deliveryDate.coefficient).toBe(1.0)
      expect(result.current.dailyCoefficients).toHaveLength(0)
    })

    it('shows loading state while fetching', () => {
      mockUseAllAcceptanceCoefficients.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      })

      const { result } = renderHook(() => useWarehouseCoefficients(507, mockWarehouse), {
        wrapper: createQueryWrapper(),
      })

      expect(result.current.isLoading).toBe(true)
    })
  })

  // ==========================================================================
  // Auto-fill Tests (matching by warehouse NAME)
  // ==========================================================================

  describe('auto-fill coefficients (matched by name)', () => {
    it('auto-fills logistics coefficient from embedded warehouse data', async () => {
      mockUseAllAcceptanceCoefficients.mockReturnValue({
        data: createGroupedCoefficients(mockAllCoefficients),
        isLoading: false,
        error: null,
      })

      const { result } = renderHook(
        () => useWarehouseCoefficients(mockWarehouse.id, mockWarehouse),
        { wrapper: createQueryWrapper() }
      )

      await waitFor(() => {
        // Uses embedded coefficient from warehouse.tariffs
        expect(result.current.logisticsCoeff.value).toBe(1.2)
        expect(result.current.logisticsCoeff.source).toBe('auto')
        expect(result.current.logisticsCoeff.originalValue).toBe(1.2)
      })
    })

    it('auto-fills storage coefficient from embedded warehouse data', async () => {
      mockUseAllAcceptanceCoefficients.mockReturnValue({
        data: createGroupedCoefficients(mockAllCoefficients),
        isLoading: false,
        error: null,
      })

      const { result } = renderHook(
        () => useWarehouseCoefficients(mockWarehouse.id, mockWarehouse),
        { wrapper: createQueryWrapper() }
      )

      await waitFor(() => {
        expect(result.current.storageCoeff.value).toBe(1.1)
        expect(result.current.storageCoeff.source).toBe('auto')
        expect(result.current.storageCoeff.originalValue).toBe(1.1)
      })
    })

    it('transforms dailyCoefficients from /all endpoint matched by name', async () => {
      mockUseAllAcceptanceCoefficients.mockReturnValue({
        data: createGroupedCoefficients(mockAllCoefficients),
        isLoading: false,
        error: null,
      })

      const { result } = renderHook(
        () => useWarehouseCoefficients(mockWarehouse.id, mockWarehouse),
        { wrapper: createQueryWrapper() }
      )

      await waitFor(() => {
        expect(result.current.dailyCoefficients).toHaveLength(7)
        expect(result.current.dailyCoefficients[0]).toMatchObject({
          date: '2026-01-22',
          coefficient: 1.0,
          status: 'base',
          isAvailable: true,
        })
        expect(result.current.dailyCoefficients[3]).toMatchObject({
          date: '2026-01-25',
          coefficient: 0, // Normalized from -1 to 0
          status: 'unavailable',
          isAvailable: false,
        })
      })
    })
  })

  // ==========================================================================
  // Delivery Date Tests (Story 44.26a)
  // ==========================================================================

  describe('delivery date selection', () => {
    it('auto-selects first available date when coefficients load', async () => {
      mockUseAllAcceptanceCoefficients.mockReturnValue({
        data: createGroupedCoefficients(mockAllCoefficients),
        isLoading: false,
        error: null,
      })

      const { result } = renderHook(
        () => useWarehouseCoefficients(mockWarehouse.id, mockWarehouse),
        { wrapper: createQueryWrapper() }
      )

      await waitFor(() => {
        // Should have a date selected (from embedded coefficient)
        expect(result.current.deliveryDate.date).not.toBeNull()
      })
    })

    it('allows manual delivery date selection', async () => {
      mockUseAllAcceptanceCoefficients.mockReturnValue({
        data: createGroupedCoefficients(mockAllCoefficients),
        isLoading: false,
        error: null,
      })

      const { result } = renderHook(
        () => useWarehouseCoefficients(mockWarehouse.id, mockWarehouse),
        { wrapper: createQueryWrapper() }
      )

      await waitFor(() => {
        expect(result.current.dailyCoefficients).toHaveLength(7)
      })

      act(() => {
        result.current.setDeliveryDate('2026-01-27', 2.0)
      })

      expect(result.current.deliveryDate.date).toBe('2026-01-27')
      expect(result.current.deliveryDate.coefficient).toBe(2.0)
    })
  })

  // ==========================================================================
  // Manual Override Tests
  // ==========================================================================

  describe('manual override', () => {
    it('allows manual logistics coefficient override', async () => {
      mockUseAllAcceptanceCoefficients.mockReturnValue({
        data: createGroupedCoefficients(mockAllCoefficients),
        isLoading: false,
        error: null,
      })

      const { result } = renderHook(
        () => useWarehouseCoefficients(mockWarehouse.id, mockWarehouse),
        { wrapper: createQueryWrapper() }
      )

      await waitFor(() => {
        expect(result.current.logisticsCoeff.source).toBe('auto')
      })

      act(() => {
        result.current.setLogisticsValue(1.5)
      })

      expect(result.current.logisticsCoeff.value).toBe(1.5)
      expect(result.current.logisticsCoeff.source).toBe('manual')
      expect(result.current.logisticsCoeff.originalValue).toBe(1.2)
    })

    it('allows manual storage coefficient override', async () => {
      mockUseAllAcceptanceCoefficients.mockReturnValue({
        data: createGroupedCoefficients(mockAllCoefficients),
        isLoading: false,
        error: null,
      })

      const { result } = renderHook(
        () => useWarehouseCoefficients(mockWarehouse.id, mockWarehouse),
        { wrapper: createQueryWrapper() }
      )

      await waitFor(() => {
        expect(result.current.storageCoeff.source).toBe('auto')
      })

      act(() => {
        result.current.setStorageValue(1.3)
      })

      expect(result.current.storageCoeff.value).toBe(1.3)
      expect(result.current.storageCoeff.source).toBe('manual')
      expect(result.current.storageCoeff.originalValue).toBe(1.1)
    })
  })

  // ==========================================================================
  // Restore Tests
  // ==========================================================================

  describe('restore functionality', () => {
    it('restores logistics to original value', async () => {
      mockUseAllAcceptanceCoefficients.mockReturnValue({
        data: createGroupedCoefficients(mockAllCoefficients),
        isLoading: false,
        error: null,
      })

      const { result } = renderHook(
        () => useWarehouseCoefficients(mockWarehouse.id, mockWarehouse),
        { wrapper: createQueryWrapper() }
      )

      await waitFor(() => {
        expect(result.current.logisticsCoeff.source).toBe('auto')
      })

      // Override
      act(() => {
        result.current.setLogisticsValue(2.0)
      })

      expect(result.current.logisticsCoeff.value).toBe(2.0)
      expect(result.current.logisticsCoeff.source).toBe('manual')

      // Restore
      act(() => {
        result.current.restoreLogistics()
      })

      expect(result.current.logisticsCoeff.value).toBe(1.2)
      expect(result.current.logisticsCoeff.source).toBe('auto')
    })

    it('restores storage to original value', async () => {
      mockUseAllAcceptanceCoefficients.mockReturnValue({
        data: createGroupedCoefficients(mockAllCoefficients),
        isLoading: false,
        error: null,
      })

      const { result } = renderHook(
        () => useWarehouseCoefficients(mockWarehouse.id, mockWarehouse),
        { wrapper: createQueryWrapper() }
      )

      await waitFor(() => {
        expect(result.current.storageCoeff.source).toBe('auto')
      })

      // Override
      act(() => {
        result.current.setStorageValue(1.8)
      })

      expect(result.current.storageCoeff.value).toBe(1.8)

      // Restore
      act(() => {
        result.current.restoreStorage()
      })

      expect(result.current.storageCoeff.value).toBe(1.1)
      expect(result.current.storageCoeff.source).toBe('auto')
    })
  })

  // ==========================================================================
  // Reset on Warehouse Clear Tests
  // ==========================================================================

  describe('reset on warehouse change', () => {
    it('resets all values when warehouse is cleared', async () => {
      mockUseAllAcceptanceCoefficients.mockReturnValue({
        data: createGroupedCoefficients(mockAllCoefficients),
        isLoading: false,
        error: null,
      })

      const { result, rerender } = renderHook(
        ({ warehouseId, warehouse }) => useWarehouseCoefficients(warehouseId, warehouse),
        {
          wrapper: createQueryWrapper(),
          initialProps: { warehouseId: mockWarehouse.id as number | null, warehouse: mockWarehouse as Warehouse | null },
        }
      )

      await waitFor(() => {
        expect(result.current.logisticsCoeff.value).toBe(1.2)
      })

      // Clear warehouse
      rerender({ warehouseId: null, warehouse: null })

      await waitFor(() => {
        expect(result.current.logisticsCoeff.value).toBe(1.0)
        expect(result.current.logisticsCoeff.source).toBe('manual')
        expect(result.current.storageCoeff.value).toBe(1.0)
        expect(result.current.storageCoeff.source).toBe('manual')
        expect(result.current.deliveryDate.date).toBeNull()
        expect(result.current.deliveryDate.coefficient).toBe(1.0)
      })
    })
  })

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================

  describe('error handling', () => {
    it('returns error state when API fails', () => {
      const error = new Error('Failed to fetch coefficients')
      mockUseAllAcceptanceCoefficients.mockReturnValue({
        data: undefined,
        isLoading: false,
        error,
      })

      const { result } = renderHook(
        () => useWarehouseCoefficients(mockWarehouse.id, mockWarehouse),
        { wrapper: createQueryWrapper() }
      )

      expect(result.current.error).toBe(error)
    })

    it('uses embedded warehouse coefficients when API fails', async () => {
      mockUseAllAcceptanceCoefficients.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('API error'),
      })

      const { result } = renderHook(
        () => useWarehouseCoefficients(mockWarehouse.id, mockWarehouse),
        { wrapper: createQueryWrapper() }
      )

      await waitFor(() => {
        // Should still use embedded coefficients from warehouse.tariffs
        expect(result.current.logisticsCoeff.value).toBe(1.2)
        expect(result.current.storageCoeff.value).toBe(1.1)
      })
    })

    it('handles warehouse not found in /all response gracefully', async () => {
      // Return empty grouped coefficients (warehouse name not found)
      mockUseAllAcceptanceCoefficients.mockReturnValue({
        data: { byName: new Map(), byId: new Map() },
        isLoading: false,
        error: null,
      })

      const unknownWarehouse: Warehouse = {
        id: 99999,
        name: 'Неизвестный склад',
        tariffs: {
          deliveryBaseLiterRub: 46,
          deliveryPerLiterRub: 14,
          logisticsCoefficient: 1.5,
          storageBaseLiterRub: 0.07,
          storagePerLiterRub: 0.05,
          storageCoefficient: 1.2,
        },
      }

      const { result } = renderHook(
        () => useWarehouseCoefficients(unknownWarehouse.id, unknownWarehouse),
        { wrapper: createQueryWrapper() }
      )

      await waitFor(() => {
        // Should use embedded coefficients when not found in /all
        expect(result.current.logisticsCoeff.value).toBe(1.5)
        expect(result.current.storageCoeff.value).toBe(1.2)
        // Daily coefficients should be empty
        expect(result.current.dailyCoefficients).toHaveLength(0)
      })
    })
  })
})
