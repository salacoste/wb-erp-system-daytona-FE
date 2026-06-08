/**
 * Tests for useRemoveOrders hook
 * Optimistic removal of orders from a supply with rollback on error
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRemoveOrders } from '../useRemoveOrders'
import * as suppliesApi from '@/lib/api/supplies'

vi.mock('@/lib/api/supplies', () => ({
  removeOrdersFromSupply: vi.fn(),
  suppliesQueryKeys: {
    all: ['supplies'],
    detail: (id: string) => ['supplies', 'detail', id],
  },
}))

const mockRemoveOrders = vi.mocked(suppliesApi.removeOrdersFromSupply)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useRemoveOrders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls removeOrdersFromSupply with correct args', async () => {
    mockRemoveOrders.mockResolvedValueOnce({
      removedCount: 1,
    } as unknown as never)

    const { result } = renderHook(() => useRemoveOrders('supply-001'), {
      wrapper: createWrapper(),
    })

    result.current.mutate(['order-1'])

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockRemoveOrders).toHaveBeenCalledWith('supply-001', ['order-1'])
  })

  it('returns isPending false initially', () => {
    const { result } = renderHook(() => useRemoveOrders('supply-001'), {
      wrapper: createWrapper(),
    })
    expect(result.current.isPending).toBe(false)
  })

  it('handles error from API', async () => {
    mockRemoveOrders.mockRejectedValueOnce(new Error('Server error'))

    const { result } = renderHook(() => useRemoveOrders('supply-001'), {
      wrapper: createWrapper(),
    })

    result.current.mutate(['order-1'])

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Server error')
  })

  it('handles removal of multiple orders', async () => {
    mockRemoveOrders.mockResolvedValueOnce({
      removedCount: 2,
    } as unknown as never)

    const { result } = renderHook(() => useRemoveOrders('supply-001'), {
      wrapper: createWrapper(),
    })

    result.current.mutate(['order-1', 'order-2'])

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockRemoveOrders).toHaveBeenCalledWith('supply-001', ['order-1', 'order-2'])
  })
})
