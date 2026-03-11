/**
 * useAcceptanceCoefficients Hook Tests
 * Story 44.13-FE: Auto-fill Coefficients from Warehouse
 *
 * Unit tests for acceptance coefficients API hook with normalization
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAcceptanceCoefficients, coefficientsQueryKeys } from '../useAcceptanceCoefficients'
import * as tariffsApi from '@/lib/api/tariffs'
import type { AcceptanceCoefficientsResponse, AcceptanceCoefficient } from '@/types/tariffs'

// Mock the API module
vi.mock('@/lib/api/tariffs')

const mockGetAcceptanceCoefficients = vi.mocked(tariffsApi.getAcceptanceCoefficients)

// Create a wrapper with fresh QueryClient for each test
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

// Sample API response with raw coefficients (integers)
const mockCoefficientsResponse: AcceptanceCoefficientsResponse = {
  coefficients: [
    {
      warehouseId: 507,
      warehouseName: 'Коледино',
      date: '2026-01-20',
      coefficient: 100, // 1.0 normalized
      isAvailable: true,
      allowUnload: true,
      boxTypeId: 1,
      boxTypeName: 'Короб',
      delivery: { coefficient: 100, baseLiterRub: 46, additionalLiterRub: 14 },
      storage: { coefficient: 100, baseLiterRub: 1, additionalLiterRub: 1 },
      isSortingCenter: false,
    },
    {
      warehouseId: 507,
      warehouseName: 'Коледино',
      date: '2026-01-21',
      coefficient: 125, // 1.25 normalized
      isAvailable: true,
      allowUnload: true,
      boxTypeId: 1,
      boxTypeName: 'Короб',
      delivery: { coefficient: 125, baseLiterRub: 46, additionalLiterRub: 14 },
      storage: { coefficient: 100, baseLiterRub: 1, additionalLiterRub: 1 },
      isSortingCenter: false,
    },
    {
      warehouseId: 507,
      warehouseName: 'Коледино',
      date: '2026-01-22',
      coefficient: -1, // Unavailable
      isAvailable: false,
      allowUnload: false,
      boxTypeId: 1,
      boxTypeName: 'Короб',
      delivery: { coefficient: -1, baseLiterRub: 46, additionalLiterRub: 14 },
      storage: { coefficient: -1, baseLiterRub: 1, additionalLiterRub: 1 },
      isSortingCenter: false,
    },
  ] as AcceptanceCoefficient[],
  meta: { total: 3, available: 2, unavailable: 1, cache_ttl_seconds: 3600 },
}

describe('useAcceptanceCoefficients', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('does not fetch when warehouseId is null', async () => {
    const { result } = renderHook(() => useAcceptanceCoefficients(null), {
      wrapper: createWrapper(),
    })

    // Query should be disabled
    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
    expect(mockGetAcceptanceCoefficients).not.toHaveBeenCalled()
  })

  it('fetches and normalizes coefficients when warehouseId provided', async () => {
    mockGetAcceptanceCoefficients.mockResolvedValueOnce(mockCoefficientsResponse)

    const { result } = renderHook(() => useAcceptanceCoefficients(507), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockGetAcceptanceCoefficients).toHaveBeenCalledWith(507)

    const data = result.current.data
    expect(data).not.toBeNull()
    expect(data?.warehouseId).toBe(507)
    expect(data?.warehouseName).toBe('Коледино')

    // Check normalization: 100 -> 1.0
    expect(data?.todayCoefficient).toBe(1.0)

    // Check daily coefficients normalization
    expect(data?.dailyCoefficients).toHaveLength(3)
    expect(data?.dailyCoefficients[0].coefficient).toBe(1.0)
    expect(data?.dailyCoefficients[1].coefficient).toBe(1.25)
    expect(data?.dailyCoefficients[2].coefficient).toBe(0) // -1 normalized to 0

    // Check delivery tariffs
    expect(data?.delivery.coefficient).toBe(1.0)
    expect(data?.delivery.baseLiterRub).toBe(46)
    expect(data?.delivery.additionalLiterRub).toBe(14)

    // Check storage tariffs
    expect(data?.storage.coefficient).toBe(1.0)
    expect(data?.storage.baseLiterRub).toBe(1)
    expect(data?.storage.additionalLiterRub).toBe(1)
  })

  it('calculates average coefficient from available days only', async () => {
    mockGetAcceptanceCoefficients.mockResolvedValueOnce(mockCoefficientsResponse)

    const { result } = renderHook(() => useAcceptanceCoefficients(507), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Average of 100 and 125 (available) = 112.5 -> 1.125 normalized
    expect(result.current.data?.averageCoefficient).toBeCloseTo(1.125, 3)
  })

  it('verifies API is called with correct warehouse ID', async () => {
    // This test verifies the hook calls the API with the correct parameter
    mockGetAcceptanceCoefficients.mockResolvedValueOnce(mockCoefficientsResponse)

    const { result } = renderHook(() => useAcceptanceCoefficients(123), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Verify correct warehouse ID was passed to API
    expect(mockGetAcceptanceCoefficients).toHaveBeenCalledWith(123)
  })

  it('returns null for empty coefficients array', async () => {
    mockGetAcceptanceCoefficients.mockResolvedValueOnce({
      coefficients: [],
      meta: { total: 0, available: 0, unavailable: 0, cache_ttl_seconds: 3600 },
    })

    const { result } = renderHook(() => useAcceptanceCoefficients(507), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toBeNull()
  })
})

describe('coefficientsQueryKeys', () => {
  it('generates correct query keys', () => {
    expect(coefficientsQueryKeys.all).toEqual(['coefficients'])
    expect(coefficientsQueryKeys.byWarehouse(507)).toEqual(['coefficients', 'warehouse', 507])
  })
})
