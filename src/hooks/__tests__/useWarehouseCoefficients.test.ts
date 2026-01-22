/**
 * Unit tests for useWarehouseCoefficients hook
 * Story 44.26a-FE: Product Search & Delivery Date Selection
 * Epic 44: Price Calculator UI (Frontend)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useWarehouseCoefficients } from '../useWarehouseCoefficients'
import { createQueryWrapper } from '@/test/utils/test-utils'

// Mock useAcceptanceCoefficients hook
const mockCoefficientsData = {
  warehouseId: 507,
  warehouseName: 'Коледино',
  todayCoefficient: 1.25,
  averageCoefficient: 1.15,
  dailyCoefficients: [
    { date: '2026-01-22', coefficient: 1.0, isAvailable: true },
    { date: '2026-01-23', coefficient: 1.25, isAvailable: true },
    { date: '2026-01-24', coefficient: 1.5, isAvailable: true },
    { date: '2026-01-25', coefficient: -1, isAvailable: false },
    { date: '2026-01-26', coefficient: 1.0, isAvailable: true },
    { date: '2026-01-27', coefficient: 2.0, isAvailable: true },
    { date: '2026-01-28', coefficient: 2.5, isAvailable: true },
  ],
  delivery: {
    baseLiterRub: 50,
    additionalLiterRub: 5,
    coefficient: 1.25,
  },
  storage: {
    baseLiterRub: 2,
    additionalLiterRub: 0.5,
    coefficient: 1.1,
  },
}

const mockUseAcceptanceCoefficients = vi.fn()

vi.mock('../useAcceptanceCoefficients', () => ({
  useAcceptanceCoefficients: () => mockUseAcceptanceCoefficients(),
}))

describe('useWarehouseCoefficients', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default mock - no data
    mockUseAcceptanceCoefficients.mockReturnValue({
      data: null,
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
      const { result } = renderHook(() => useWarehouseCoefficients(null), {
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
      mockUseAcceptanceCoefficients.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      })

      const { result } = renderHook(() => useWarehouseCoefficients(507), {
        wrapper: createQueryWrapper(),
      })

      expect(result.current.isLoading).toBe(true)
    })
  })

  // ==========================================================================
  // Auto-fill Tests
  // ==========================================================================

  describe('auto-fill coefficients', () => {
    it('auto-fills logistics coefficient from API', async () => {
      mockUseAcceptanceCoefficients.mockReturnValue({
        data: mockCoefficientsData,
        isLoading: false,
        error: null,
      })

      const { result } = renderHook(() => useWarehouseCoefficients(507), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => {
        expect(result.current.logisticsCoeff.value).toBe(1.25)
        expect(result.current.logisticsCoeff.source).toBe('auto')
        expect(result.current.logisticsCoeff.originalValue).toBe(1.25)
      })
    })

    it('auto-fills storage coefficient from API', async () => {
      mockUseAcceptanceCoefficients.mockReturnValue({
        data: mockCoefficientsData,
        isLoading: false,
        error: null,
      })

      const { result } = renderHook(() => useWarehouseCoefficients(507), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => {
        expect(result.current.storageCoeff.value).toBe(1.1)
        expect(result.current.storageCoeff.source).toBe('auto')
        expect(result.current.storageCoeff.originalValue).toBe(1.1)
      })
    })

    it('transforms dailyCoefficients to NormalizedCoefficient format', async () => {
      mockUseAcceptanceCoefficients.mockReturnValue({
        data: mockCoefficientsData,
        isLoading: false,
        error: null,
      })

      const { result } = renderHook(() => useWarehouseCoefficients(507), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => {
        expect(result.current.dailyCoefficients).toHaveLength(7)
        expect(result.current.dailyCoefficients[0]).toEqual({
          date: '2026-01-22',
          coefficient: 1.0,
          status: 'base',
          isAvailable: true,
        })
        expect(result.current.dailyCoefficients[3]).toEqual({
          date: '2026-01-25',
          coefficient: -1,
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
      mockUseAcceptanceCoefficients.mockReturnValue({
        data: mockCoefficientsData,
        isLoading: false,
        error: null,
      })

      const { result } = renderHook(() => useWarehouseCoefficients(507), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => {
        // Should select first available date
        expect(result.current.deliveryDate.date).not.toBeNull()
        expect(result.current.deliveryDate.coefficient).toBeGreaterThan(0)
      })
    })

    it('allows manual delivery date selection', async () => {
      mockUseAcceptanceCoefficients.mockReturnValue({
        data: mockCoefficientsData,
        isLoading: false,
        error: null,
      })

      const { result } = renderHook(() => useWarehouseCoefficients(507), {
        wrapper: createQueryWrapper(),
      })

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
      mockUseAcceptanceCoefficients.mockReturnValue({
        data: mockCoefficientsData,
        isLoading: false,
        error: null,
      })

      const { result } = renderHook(() => useWarehouseCoefficients(507), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => {
        expect(result.current.logisticsCoeff.source).toBe('auto')
      })

      act(() => {
        result.current.setLogisticsValue(1.5)
      })

      expect(result.current.logisticsCoeff.value).toBe(1.5)
      expect(result.current.logisticsCoeff.source).toBe('manual')
      expect(result.current.logisticsCoeff.originalValue).toBe(1.25)
    })

    it('allows manual storage coefficient override', async () => {
      mockUseAcceptanceCoefficients.mockReturnValue({
        data: mockCoefficientsData,
        isLoading: false,
        error: null,
      })

      const { result } = renderHook(() => useWarehouseCoefficients(507), {
        wrapper: createQueryWrapper(),
      })

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
      mockUseAcceptanceCoefficients.mockReturnValue({
        data: mockCoefficientsData,
        isLoading: false,
        error: null,
      })

      const { result } = renderHook(() => useWarehouseCoefficients(507), {
        wrapper: createQueryWrapper(),
      })

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

      expect(result.current.logisticsCoeff.value).toBe(1.25)
      expect(result.current.logisticsCoeff.source).toBe('auto')
    })

    it('restores storage to original value', async () => {
      mockUseAcceptanceCoefficients.mockReturnValue({
        data: mockCoefficientsData,
        isLoading: false,
        error: null,
      })

      const { result } = renderHook(() => useWarehouseCoefficients(507), {
        wrapper: createQueryWrapper(),
      })

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
      mockUseAcceptanceCoefficients.mockReturnValue({
        data: mockCoefficientsData,
        isLoading: false,
        error: null,
      })

      const { result, rerender } = renderHook(
        ({ warehouseId }) => useWarehouseCoefficients(warehouseId),
        {
          wrapper: createQueryWrapper(),
          initialProps: { warehouseId: 507 as number | null },
        }
      )

      await waitFor(() => {
        expect(result.current.logisticsCoeff.value).toBe(1.25)
      })

      // Clear warehouse
      mockUseAcceptanceCoefficients.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      })
      rerender({ warehouseId: null })

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
      mockUseAcceptanceCoefficients.mockReturnValue({
        data: null,
        isLoading: false,
        error,
      })

      const { result } = renderHook(() => useWarehouseCoefficients(507), {
        wrapper: createQueryWrapper(),
      })

      expect(result.current.error).toBe(error)
    })

    it('maintains default values on error', () => {
      mockUseAcceptanceCoefficients.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('API error'),
      })

      const { result } = renderHook(() => useWarehouseCoefficients(507), {
        wrapper: createQueryWrapper(),
      })

      expect(result.current.logisticsCoeff.value).toBe(1.0)
      expect(result.current.storageCoeff.value).toBe(1.0)
    })
  })
})
