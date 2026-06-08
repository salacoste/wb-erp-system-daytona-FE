/**
 * Tests for useReturnsDailyTrends Hook
 *
 * Tests the hook's query enabling, data fetching, and error handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

// Mock the API layer
const mockGetReturnsDailyTrends = vi.fn()
vi.mock('@/lib/api/returns-daily', () => ({
  getReturnsDailyTrends: (...args: unknown[]) => mockGetReturnsDailyTrends(...args),
  returnsDailyQueryKeys: {
    all: ['returns-daily'],
    trends: (from: string, to: string) => ['returns-daily', 'trends', from, to],
  },
}))

import { useReturnsDailyTrends } from '@/hooks/use-returns-daily'

const emptyResponse = {
  daily: [],
  period: { from: '2026-06-01', to: '2026-06-07' },
  summary: {
    totalReturns: 0,
    avgReturnRate: 0,
    totalCancellations: 0,
    totalRefusals: 0,
    totalDefects: 0,
  },
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
    },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useReturnsDailyTrends', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetReturnsDailyTrends.mockResolvedValue(emptyResponse)
  })

  it('fetches data when from and to are provided', async () => {
    const { result } = renderHook(() => useReturnsDailyTrends('2026-06-01', '2026-06-07'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetReturnsDailyTrends).toHaveBeenCalledWith('2026-06-01', '2026-06-07')
    expect(result.current.data).toEqual(emptyResponse)
  })

  it('does not fetch when from is empty', () => {
    const { result } = renderHook(() => useReturnsDailyTrends('', '2026-06-07'), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGetReturnsDailyTrends).not.toHaveBeenCalled()
  })

  it('does not fetch when to is empty', () => {
    const { result } = renderHook(() => useReturnsDailyTrends('2026-06-01', ''), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGetReturnsDailyTrends).not.toHaveBeenCalled()
  })

  it('returns populated response data correctly', async () => {
    const populatedResponse = {
      daily: [
        {
          date: '2026-06-01',
          totalReturns: 10,
          returnRate: 5.2,
          cancellations: 4,
          refusals: 3,
          defects: 3,
        },
        {
          date: '2026-06-02',
          totalReturns: 7,
          returnRate: 3.8,
          cancellations: 2,
          refusals: 3,
          defects: 2,
        },
      ],
      period: { from: '2026-06-01', to: '2026-06-02' },
      summary: {
        totalReturns: 17,
        avgReturnRate: 4.5,
        totalCancellations: 6,
        totalRefusals: 6,
        totalDefects: 5,
      },
    }
    mockGetReturnsDailyTrends.mockResolvedValue(populatedResponse)

    const { result } = renderHook(() => useReturnsDailyTrends('2026-06-01', '2026-06-02'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.daily).toHaveLength(2)
    expect(result.current.data?.summary.totalReturns).toBe(17)
  })

  it('handles API errors gracefully', async () => {
    // hook has retry: 1 — use persistent rejection so both attempts fail
    mockGetReturnsDailyTrends.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useReturnsDailyTrends('2026-06-01', '2026-06-07'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
    expect(result.current.error?.message).toBe('Network error')
  })
})
