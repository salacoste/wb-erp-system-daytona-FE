/**
 * Tests for useSupplyDetail hook
 * Supply detail fetch with status-based polling
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSupplyDetail } from '../useSupplyDetail'
import * as suppliesApi from '@/lib/api/supplies'

vi.mock('@/lib/api/supplies', () => ({
  getSupplyDetail: vi.fn(),
  suppliesQueryKeys: {
    all: ['supplies'],
    detail: (id: string) => ['supplies', 'detail', id],
  },
}))

const mockGetSupplyDetail = vi.mocked(suppliesApi.getSupplyDetail)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const mockSupplyDetail = {
  supplyId: 'supply-001',
  status: 'CLOSED',
  ordersCount: 5,
  totalValue: 25000,
}

describe('useSupplyDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSupplyDetail.mockResolvedValue(mockSupplyDetail as never)
  })

  it('fetches supply detail for given id', async () => {
    const { result } = renderHook(() => useSupplyDetail('supply-001'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetSupplyDetail).toHaveBeenCalledWith('supply-001')
    expect(result.current.data).toEqual(mockSupplyDetail)
  })

  it('is disabled when supplyId is undefined', () => {
    const { result } = renderHook(() => useSupplyDetail(undefined), {
      wrapper: createWrapper(),
    })
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('is disabled when enabled=false', () => {
    const { result } = renderHook(() => useSupplyDetail('supply-001', { enabled: false }), {
      wrapper: createWrapper(),
    })
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('returns loading state initially', () => {
    mockGetSupplyDetail.mockReturnValue(new Promise(() => {}) as never)
    const { result } = renderHook(() => useSupplyDetail('supply-001'), {
      wrapper: createWrapper(),
    })
    expect(result.current.isLoading).toBe(true)
  })

  it('respects custom staleTime', async () => {
    const { result } = renderHook(() => useSupplyDetail('supply-001', { staleTime: 60000 }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetSupplyDetail).toHaveBeenCalledTimes(1)
  })
})
