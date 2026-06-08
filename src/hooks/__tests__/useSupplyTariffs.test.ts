/**
 * Unit tests for useSupplyTariffs hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useSupplyTariffs } from '../useSupplyTariffs'

vi.mock('@/lib/api/tariffs', () => ({
  getAllAcceptanceCoefficients: vi.fn(),
}))

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { getAllAcceptanceCoefficients } from '@/lib/api/tariffs'
const mockGetAllCoefficients = vi.mocked(getAllAcceptanceCoefficients)

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

const mockCoefficients = [
  {
    warehouseId: 507,
    warehouseName: 'Коледино',
    boxTypeId: 1,
    boxTypeName: 'Монопаалет',
    date: '2026-01-15',
    delivery: { baseLiterRub: 46, additionalLiterRub: 14, coefficient: 1.0 },
    storage: { baseLiterRub: 0.07, additionalLiterRub: 0.05, coefficient: 1.0 },
  },
  {
    warehouseId: 507,
    warehouseName: 'Коледино',
    boxTypeId: 2,
    boxTypeName: 'Палеты',
    date: '2026-01-15',
    delivery: { baseLiterRub: 48, additionalLiterRub: 16, coefficient: 1.0 },
    storage: { baseLiterRub: 0.08, additionalLiterRub: 0.06, coefficient: 1.0 },
  },
  {
    warehouseId: 121330,
    warehouseName: 'Электросталь',
    boxTypeId: 1,
    boxTypeName: 'Монопаалет',
    date: '2026-01-15',
    delivery: { baseLiterRub: 46, additionalLiterRub: 14, coefficient: 1.65 },
    storage: { baseLiterRub: 0.07, additionalLiterRub: 0.05, coefficient: 1.0 },
  },
]

describe('useSupplyTariffs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches supply tariffs successfully', async () => {
    mockGetAllCoefficients.mockResolvedValueOnce({
      coefficients: mockCoefficients,
    } as Awaited<ReturnType<typeof getAllAcceptanceCoefficients>>)

    const { result } = renderHook(() => useSupplyTariffs(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error).toBeNull()
    expect(result.current.coefficients).toHaveLength(3)
  })

  it('extracts unique warehouses from coefficients', async () => {
    mockGetAllCoefficients.mockResolvedValueOnce({
      coefficients: mockCoefficients,
    } as Awaited<ReturnType<typeof getAllAcceptanceCoefficients>>)

    const { result } = renderHook(() => useSupplyTariffs(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    // Two unique warehouses: Коледино and Электросталь
    const warehouseIds = result.current.warehouses.map(w => w.id)
    expect(warehouseIds).toHaveLength(2)
    expect(warehouseIds).toContain(507)
    expect(warehouseIds).toContain(121330)
  })

  it('returns empty coefficients on null response', async () => {
    mockGetAllCoefficients.mockResolvedValueOnce({
      coefficients: null,
    } as unknown as Awaited<ReturnType<typeof getAllAcceptanceCoefficients>>)

    const { result } = renderHook(() => useSupplyTariffs(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.coefficients).toHaveLength(0)
    expect(result.current.warehouses).toHaveLength(0)
  })

  it('handles API error', async () => {
    mockGetAllCoefficients.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useSupplyTariffs(), { wrapper: createWrapper() })

    // UseSupplyTariffsReturn exposes error (not isError), wait for it to populate
    await waitFor(() => expect(result.current.error).toBeTruthy(), { timeout: 5000 })
    expect(result.current.error?.message).toBe('Network error')
    expect(result.current.coefficients).toHaveLength(0)
  })

  it('provides findTariffsForDate function that returns null when not found', async () => {
    mockGetAllCoefficients.mockResolvedValueOnce({
      coefficients: mockCoefficients,
    } as Awaited<ReturnType<typeof getAllAcceptanceCoefficients>>)

    const { result } = renderHook(() => useSupplyTariffs(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    const tariff = result.current.findTariffsForDate(99999, '2026-01-15')
    expect(tariff).toBeNull()
  })

  it('provides findTariffsByNameAndDate function', async () => {
    mockGetAllCoefficients.mockResolvedValueOnce({
      coefficients: mockCoefficients,
    } as Awaited<ReturnType<typeof getAllAcceptanceCoefficients>>)

    const { result } = renderHook(() => useSupplyTariffs(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    // Function should be callable (actual matching tested in helpers unit tests)
    expect(typeof result.current.findTariffsByNameAndDate).toBe('function')
  })

  it('provides getTariffsByBoxType function', async () => {
    mockGetAllCoefficients.mockResolvedValueOnce({
      coefficients: mockCoefficients,
    } as Awaited<ReturnType<typeof getAllAcceptanceCoefficients>>)

    const { result } = renderHook(() => useSupplyTariffs(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(typeof result.current.getTariffsByBoxType).toBe('function')
  })
})
