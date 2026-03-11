/**
 * Tests for shipment detail hooks (pallet mutations)
 * Epic 76-FE, Story 76.2
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { createTestQueryClient, createQueryWrapper } from '@/test/utils/test-utils'
import type { QueryClient } from '@tanstack/react-query'

vi.mock('@/lib/api/shipment-cost', () => ({
  addPallet: vi.fn(),
  removePallet: vi.fn(),
}))

import { addPallet, removePallet } from '@/lib/api/shipment-cost'
import { useAddPallet, useRemovePallet } from '../use-shipment-detail'

const mockPallet = {
  id: 'p-1',
  shipmentId: 's-001',
  palletNumber: 1,
  boxLines: [],
  createdAt: '2026-03-11T00:00:00Z',
  updatedAt: '2026-03-11T00:00:00Z',
}

let queryClient: QueryClient

beforeEach(() => {
  vi.clearAllMocks()
  queryClient = createTestQueryClient()
})

describe('useAddPallet', () => {
  it('calls addPallet with shipmentId', async () => {
    vi.mocked(addPallet).mockResolvedValueOnce(mockPallet)
    const { result } = renderHook(() => useAddPallet('s-001'), {
      wrapper: createQueryWrapper(queryClient),
    })
    await act(async () => {
      await result.current.mutateAsync()
    })
    expect(addPallet).toHaveBeenCalledWith('s-001')
  })

  it('propagates errors from addPallet', async () => {
    vi.mocked(addPallet).mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useAddPallet('s-001'), {
      wrapper: createQueryWrapper(queryClient),
    })
    await act(async () => {
      await expect(result.current.mutateAsync()).rejects.toThrow('Network error')
    })
  })

  it('invalidates shipment detail and list caches on success', async () => {
    vi.mocked(addPallet).mockResolvedValueOnce(mockPallet)
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useAddPallet('s-001'), {
      wrapper: createQueryWrapper(queryClient),
    })
    await act(async () => {
      await result.current.mutateAsync()
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
})

describe('useRemovePallet', () => {
  it('calls removePallet with shipmentId and palletId', async () => {
    vi.mocked(removePallet).mockResolvedValueOnce(undefined)
    const { result } = renderHook(() => useRemovePallet('s-001'), {
      wrapper: createQueryWrapper(queryClient),
    })
    await act(async () => {
      await result.current.mutateAsync('p-1')
    })
    expect(removePallet).toHaveBeenCalledWith('s-001', 'p-1')
  })

  it('propagates errors from removePallet', async () => {
    vi.mocked(removePallet).mockRejectedValueOnce(new Error('Not found'))
    const { result } = renderHook(() => useRemovePallet('s-001'), {
      wrapper: createQueryWrapper(queryClient),
    })
    await act(async () => {
      await expect(result.current.mutateAsync('p-1')).rejects.toThrow('Not found')
    })
  })

  it('invalidates shipment detail and list caches on success', async () => {
    vi.mocked(removePallet).mockResolvedValueOnce(undefined)
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useRemovePallet('s-001'), {
      wrapper: createQueryWrapper(queryClient),
    })
    await act(async () => {
      await result.current.mutateAsync('p-1')
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
})
