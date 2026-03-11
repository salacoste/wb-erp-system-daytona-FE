/** Tests for Shipment Calculations hooks — Epic 76-FE, Story 76.4/76.5 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { createTestQueryClient, createQueryWrapper } from '@/test/utils/test-utils'
import type { QueryClient } from '@tanstack/react-query'

vi.mock('@/lib/api/shipment-cost', () => ({
  calculateShipment: vi.fn(),
  confirmShipment: vi.fn(),
  recalculateShipment: vi.fn(),
}))

import { calculateShipment, confirmShipment, recalculateShipment } from '@/lib/api/shipment-cost'
import {
  useCalculateShipment,
  useConfirmShipment,
  useRecalculateShipment,
} from '../use-shipment-calculations'

const mockCalcResponse = {
  results: [
    {
      nmId: 111,
      productName: 'Test Product',
      unitCostRub: 500,
      deliveryCostPerUnit: 30,
      finalCostPerUnit: 530,
      totalUnits: 10,
      finalCostLine: 5300,
    },
  ],
}

let queryClient: QueryClient
beforeEach(() => {
  vi.clearAllMocks()
  queryClient = createTestQueryClient()
})

describe('useCalculateShipment', () => {
  it('calls calculateShipment with shipmentId', async () => {
    vi.mocked(calculateShipment).mockResolvedValueOnce(mockCalcResponse)
    const { result } = renderHook(() => useCalculateShipment('s-001'), {
      wrapper: createQueryWrapper(queryClient),
    })
    await act(async () => {
      await result.current.mutateAsync()
    })
    expect(calculateShipment).toHaveBeenCalledWith('s-001')
  })

  it('returns calculation results on success', async () => {
    vi.mocked(calculateShipment).mockResolvedValueOnce(mockCalcResponse)
    const { result } = renderHook(() => useCalculateShipment('s-001'), {
      wrapper: createQueryWrapper(queryClient),
    })
    let response: typeof mockCalcResponse | undefined
    await act(async () => {
      response = await result.current.mutateAsync()
    })
    expect(response).toEqual(mockCalcResponse)
  })

  it('invalidates shipment queries on success', async () => {
    vi.mocked(calculateShipment).mockResolvedValueOnce(mockCalcResponse)
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useCalculateShipment('s-001'), {
      wrapper: createQueryWrapper(queryClient),
    })
    await act(async () => {
      await result.current.mutateAsync()
    })
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['shipments', 'detail', 's-001'],
      })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['shipments'] })
    })
  })

  it('propagates errors from API', async () => {
    vi.mocked(calculateShipment).mockRejectedValueOnce(new Error('Validation failed'))
    const { result } = renderHook(() => useCalculateShipment('s-001'), {
      wrapper: createQueryWrapper(queryClient),
    })
    await expect(
      act(async () => {
        await result.current.mutateAsync()
      })
    ).rejects.toThrow('Validation failed')
  })
})

describe('useConfirmShipment', () => {
  const mockShipment = { id: 's-001', status: 'CONFIRMED', confirmedBy: 'user@test.com' }

  it('calls confirmShipment with shipmentId and confirmedBy', async () => {
    vi.mocked(confirmShipment).mockResolvedValueOnce(mockShipment as never)
    const { result } = renderHook(() => useConfirmShipment('s-001'), {
      wrapper: createQueryWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync('user@test.com')
    })

    expect(confirmShipment).toHaveBeenCalledWith('s-001', 'user@test.com')
  })

  it('invalidates shipment queries on success', async () => {
    vi.mocked(confirmShipment).mockResolvedValueOnce(mockShipment as never)
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useConfirmShipment('s-001'), {
      wrapper: createQueryWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync('user@test.com')
    })

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['shipments', 'detail', 's-001'],
      })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['shipments'],
      })
    })
  })

  it('propagates errors from API', async () => {
    vi.mocked(confirmShipment).mockRejectedValueOnce(new Error('Conflict'))
    const { result } = renderHook(() => useConfirmShipment('s-001'), {
      wrapper: createQueryWrapper(queryClient),
    })

    await expect(
      act(async () => {
        await result.current.mutateAsync('user@test.com')
      })
    ).rejects.toThrow('Conflict')
  })
})

describe('useRecalculateShipment', () => {
  it('calls recalculateShipment with shipmentId', async () => {
    vi.mocked(recalculateShipment).mockResolvedValueOnce(mockCalcResponse)
    const { result } = renderHook(() => useRecalculateShipment('s-002'), {
      wrapper: createQueryWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync()
    })

    expect(recalculateShipment).toHaveBeenCalledWith('s-002')
  })

  it('invalidates shipment queries on success', async () => {
    vi.mocked(recalculateShipment).mockResolvedValueOnce(mockCalcResponse)
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useRecalculateShipment('s-002'), {
      wrapper: createQueryWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync()
    })

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['shipments', 'detail', 's-002'],
      })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['shipments'],
      })
    })
  })

  it('propagates errors from API', async () => {
    vi.mocked(recalculateShipment).mockRejectedValueOnce(new Error('Forbidden'))
    const { result } = renderHook(() => useRecalculateShipment('s-002'), {
      wrapper: createQueryWrapper(queryClient),
    })

    await expect(
      act(async () => {
        await result.current.mutateAsync()
      })
    ).rejects.toThrow('Forbidden')
  })
})
