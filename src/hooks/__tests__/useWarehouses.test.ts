/**
 * Unit tests for useWarehouses hook and transformToWarehouse
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useWarehouses, transformToWarehouse } from '../useWarehouses'

vi.mock('@/lib/api/tariffs', () => ({
  getWarehousesWithTariffs: vi.fn(),
}))

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn() },
}))

import { getWarehousesWithTariffs } from '@/lib/api/tariffs'
const mockGetWarehouses = vi.mocked(getWarehousesWithTariffs)

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

// --- transformToWarehouse pure function tests ---

describe('transformToWarehouse', () => {
  it('transforms warehouse with FBO tariffs', () => {
    const input = {
      id: 507,
      name: 'Коледино',
      tariffs: {
        fbo: {
          delivery_base_rub: 46,
          delivery_liter_rub: 14,
          logistics_coefficient: 1.6,
        },
        storage: {
          base_per_day_rub: 0.07,
          liter_per_day_rub: 0.05,
          coefficient: 1.0,
        },
      },
    }

    const result = transformToWarehouse(input as Parameters<typeof transformToWarehouse>[0])

    expect(result.id).toBe(507)
    expect(result.name).toBe('Коледино')
    expect(result.tariffs.deliveryBaseLiterRub).toBe(46)
    expect(result.tariffs.deliveryPerLiterRub).toBe(14)
    expect(result.tariffs.logisticsCoefficient).toBe(1.6)
    expect(result.tariffs.storageBaseLiterRub).toBe(0.07)
  })

  it('preserves real FBO delivery rate of 0 (DEFECT-2)', () => {
    const input = {
      id: 121330,
      name: 'Электросталь',
      tariffs: {
        fbo: {
          delivery_base_rub: 0,
          delivery_liter_rub: 0,
          logistics_coefficient: 1.0,
        },
        storage: {
          base_per_day_rub: 0.07,
          liter_per_day_rub: 0.05,
          coefficient: 1.0,
        },
      },
    }

    const result = transformToWarehouse(input as Parameters<typeof transformToWarehouse>[0])

    // Real 0 must be preserved, not replaced with defaults
    expect(result.tariffs.deliveryBaseLiterRub).toBe(0)
    expect(result.tariffs.deliveryPerLiterRub).toBe(0)
  })

  it('uses defaults when fbo block is missing', () => {
    const input = {
      id: 999,
      name: 'TestWarehouse',
      tariffs: {
        fbo: undefined,
        storage: {
          base_per_day_rub: 0.07,
          liter_per_day_rub: 0.05,
          coefficient: 1.0,
        },
      },
    }

    const result = transformToWarehouse(input as Parameters<typeof transformToWarehouse>[0])

    expect(result.tariffs.deliveryBaseLiterRub).toBe(46)
    expect(result.tariffs.deliveryPerLiterRub).toBe(14)
  })

  it('uses defaults when tariffs block is missing', () => {
    const input = {
      id: 888,
      name: 'NoTariffs',
      tariffs: {},
    }

    const result = transformToWarehouse(input as Parameters<typeof transformToWarehouse>[0])

    expect(result.tariffs.deliveryBaseLiterRub).toBe(46)
    expect(result.tariffs.storageBaseLiterRub).toBe(0.07)
    expect(result.tariffs.logisticsCoefficient).toBe(1.0)
  })
})

// --- useWarehouses hook tests ---

describe('useWarehouses', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches and transforms warehouses', async () => {
    mockGetWarehouses.mockResolvedValueOnce({
      warehouses: [
        {
          id: 507,
          name: 'Коледино',
          tariffs: {
            fbo: { delivery_base_rub: 46, delivery_liter_rub: 14, logistics_coefficient: 1.6 },
            storage: { base_per_day_rub: 0.07, liter_per_day_rub: 0.05, coefficient: 1.0 },
          },
        },
        {
          id: 121330,
          name: 'Электросталь',
          tariffs: {
            fbo: { delivery_base_rub: 48, delivery_liter_rub: 16, logistics_coefficient: 1.0 },
            storage: { base_per_day_rub: 0.08, liter_per_day_rub: 0.06, coefficient: 1.0 },
          },
        },
      ],
    } as Awaited<ReturnType<typeof getWarehousesWithTariffs>>)

    const { result } = renderHook(() => useWarehouses(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(2)
    // Sorted alphabetically (Russian locale)
    expect(result.current.data?.[0].name).toBe('Коледино')
    expect(result.current.data?.[1].name).toBe('Электросталь')
  })

  it('filters out warehouses with id <= 0', async () => {
    mockGetWarehouses.mockResolvedValueOnce({
      warehouses: [
        {
          id: 507,
          name: 'Коледино',
          tariffs: {
            fbo: { delivery_base_rub: 46, delivery_liter_rub: 14, logistics_coefficient: 1.0 },
            storage: { base_per_day_rub: 0.07, liter_per_day_rub: 0.05, coefficient: 1.0 },
          },
        },
        { id: 0, name: 'Invalid', tariffs: {} },
        { id: -1, name: 'AlsoInvalid', tariffs: {} },
      ],
    } as Awaited<ReturnType<typeof getWarehousesWithTariffs>>)

    const { result } = renderHook(() => useWarehouses(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0].id).toBe(507)
  })

  it('handles empty warehouses response', async () => {
    mockGetWarehouses.mockResolvedValueOnce({
      warehouses: [],
    } as Awaited<ReturnType<typeof getWarehousesWithTariffs>>)

    const { result } = renderHook(() => useWarehouses(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(0)
  })

  it('handles null warehouses response', async () => {
    mockGetWarehouses.mockResolvedValueOnce({
      warehouses: null,
    } as unknown as Awaited<ReturnType<typeof getWarehousesWithTariffs>>)

    const { result } = renderHook(() => useWarehouses(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(0)
  })

  it('handles API error', async () => {
    mockGetWarehouses.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useWarehouses(), { wrapper: createWrapper() })

    // Hook uses retry: 2, but QueryClient has retry: false, so it won't retry
    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
    expect(result.current.error?.message).toBe('Network error')
  })
})
