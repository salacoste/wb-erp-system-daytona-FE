/**
 * Unit tests for useCommissions hook
 * Story 44.16-FE: Category Selection with Search
 * Epic 44: Price Calculator UI (Frontend)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useCommissions, tariffsQueryKeys } from '../useCommissions'
import { createQueryWrapper } from '@/test/utils/test-utils'
import type { CommissionsResponse } from '@/types/tariffs'

// Mock the API client
vi.mock('@/lib/api/tariffs', () => ({
  getCommissions: vi.fn(),
}))

import { getCommissions } from '@/lib/api/tariffs'
const mockGetCommissions = vi.mocked(getCommissions)

// Sample response data
const mockResponse: CommissionsResponse = {
  commissions: [
    {
      parentID: 1,
      parentName: 'Одежда',
      subjectID: 101,
      subjectName: 'Платья',
      paidStorageKgvp: 25,
      kgvpMarketplace: 28,
      kgvpSupplier: 10,
      kgvpSupplierExpress: 5,
    },
    {
      parentID: 2,
      parentName: 'Электроника',
      subjectID: 201,
      subjectName: 'Смартфоны',
      paidStorageKgvp: 15,
      kgvpMarketplace: 18,
      kgvpSupplier: 8,
      kgvpSupplierExpress: 4,
    },
  ],
  meta: {
    total: 2,
    cached: true,
    cache_ttl_seconds: 86400,
    fetched_at: '2026-01-21T12:00:00Z',
  },
}

describe('useCommissions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Query Keys', () => {
    it('should have correct query key structure', () => {
      expect(tariffsQueryKeys.all).toEqual(['tariffs'])
      expect(tariffsQueryKeys.commissions()).toEqual(['tariffs', 'commissions'])
      expect(tariffsQueryKeys.warehouses()).toEqual(['tariffs', 'warehouses'])
      expect(tariffsQueryKeys.settings()).toEqual(['tariffs', 'settings'])
      expect(tariffsQueryKeys.acceptanceByWarehouse(123)).toEqual([
        'tariffs',
        'acceptance',
        123,
      ])
    })
  })

  describe('Data Fetching', () => {
    it('should fetch commissions on mount', async () => {
      mockGetCommissions.mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => useCommissions(), {
        wrapper: createQueryWrapper(),
      })

      // Initially loading
      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockGetCommissions).toHaveBeenCalledTimes(1)
      expect(result.current.data).toEqual(mockResponse)
    })

    it('should return commissions array', async () => {
      mockGetCommissions.mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => useCommissions(), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data?.commissions).toHaveLength(2)
      expect(result.current.data?.commissions[0].parentName).toBe('Одежда')
      expect(result.current.data?.commissions[1].parentName).toBe('Электроника')
    })

    it('should return meta information', async () => {
      mockGetCommissions.mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => useCommissions(), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data?.meta.total).toBe(2)
      expect(result.current.data?.meta.cached).toBe(true)
      expect(result.current.data?.meta.cache_ttl_seconds).toBe(86400)
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors', async () => {
      const error = new Error('Network error')
      mockGetCommissions.mockRejectedValueOnce(error)

      const { result } = renderHook(() => useCommissions(), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBeTruthy()
      expect(result.current.data).toBeUndefined()
    })
  })

  describe('Enabled Option', () => {
    it('should not fetch when enabled is false', async () => {
      mockGetCommissions.mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => useCommissions({ enabled: false }), {
        wrapper: createQueryWrapper(),
      })

      // Should not be loading and should not have fetched
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isFetching).toBe(false)
      expect(mockGetCommissions).not.toHaveBeenCalled()
    })

    it('should fetch when enabled changes to true', async () => {
      mockGetCommissions.mockResolvedValueOnce(mockResponse)

      const { result, rerender } = renderHook(
        ({ enabled }: { enabled: boolean }) => useCommissions({ enabled }),
        {
          wrapper: createQueryWrapper(),
          initialProps: { enabled: false },
        }
      )

      expect(mockGetCommissions).not.toHaveBeenCalled()

      rerender({ enabled: true })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockGetCommissions).toHaveBeenCalledTimes(1)
    })
  })

  describe('Commission Values', () => {
    it('should have correct FBO commission (paidStorageKgvp)', async () => {
      mockGetCommissions.mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => useCommissions(), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const category = result.current.data?.commissions[0]
      expect(category?.paidStorageKgvp).toBe(25) // FBO commission
    })

    it('should have correct FBS commission (kgvpMarketplace)', async () => {
      mockGetCommissions.mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => useCommissions(), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const category = result.current.data?.commissions[0]
      expect(category?.kgvpMarketplace).toBe(28) // FBS commission
    })

    it('should show FBS commission is higher than FBO', async () => {
      mockGetCommissions.mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => useCommissions(), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const category = result.current.data?.commissions[0]
      // FBS is typically 3-4% higher than FBO
      expect(category!.kgvpMarketplace - category!.paidStorageKgvp).toBe(3)
    })
  })
})
