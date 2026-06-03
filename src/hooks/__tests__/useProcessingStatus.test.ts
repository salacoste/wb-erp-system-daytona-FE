import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { useProcessingStatus, getRefetchInterval, MAX_EMPTY_POLLS } from '../useProcessingStatus'
import { apiClient } from '@/lib/api-client'
import type { ProcessingStatus } from '@/types/api'

vi.mock('@/lib/api-client', () => ({
  apiClient: { get: vi.fn() },
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({ cabinetId: 'cab-1' }),
}))

const mockGet = vi.mocked(apiClient.get)

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useProcessingStatus — empty-batch terminal state', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('early empty polls return status "processing"', async () => {
    mockGet.mockResolvedValue({ batches: [] })

    const { result } = renderHook(() => useProcessingStatus(), { wrapper })

    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data?.status).toBe('processing')
  })

  it('flips to "no_data" after MAX_EMPTY_POLLS empty polls', async () => {
    mockGet.mockResolvedValue({ batches: [] })

    const { result } = renderHook(() => useProcessingStatus(), { wrapper })

    await waitFor(() => expect(result.current.data?.status).toBe('processing'))

    // First poll already happened (count=1). Drive MAX_EMPTY_POLLS-1 more
    // refetches to reach the cap. Derived from the source const so tuning the
    // cap doesn't silently mis-test the boundary.
    for (let i = 0; i < MAX_EMPTY_POLLS - 1; i++) {
      await result.current.refetch()
    }

    await waitFor(() => expect(result.current.data?.status).toBe('no_data'))
    expect(result.current.data?.productParsing.status).toBe('pending')
    expect(result.current.data?.reportLoading.status).toBe('pending')
  })

  it('resets the empty-poll counter when a batch arrives', async () => {
    // MAX_EMPTY_POLLS-1 empty polls (just under the cap), then a non-empty batch,
    // then empties again.
    mockGet.mockResolvedValue({ batches: [] })

    const { result } = renderHook(() => useProcessingStatus(), { wrapper })

    await waitFor(() => expect(result.current.data?.status).toBe('processing'))
    // First poll already counted (count=1); drive MAX_EMPTY_POLLS-2 more to reach
    // count = MAX_EMPTY_POLLS-1, one short of the cap.
    for (let i = 0; i < MAX_EMPTY_POLLS - 2; i++) {
      await result.current.refetch()
    }
    // count = MAX_EMPTY_POLLS-1, still "processing" (under cap)
    expect(result.current.data?.status).toBe('processing')

    // A batch arrives → resets counter, normal aggregation flow.
    mockGet.mockResolvedValue({
      batches: [
        {
          id: 'b1',
          batchType: 'historical',
          weekStart: '2025-01-01',
          weekEnd: '2025-01-07',
          totalWeeks: 4,
          completedWeeks: 2,
          failedWeeks: 0,
          status: 'in_progress',
          startedAt: null,
          completedAt: null,
        },
      ],
      total: 1,
    })
    await result.current.refetch()
    await waitFor(() => expect(result.current.data?.status).toBe('processing'))
    expect(result.current.data?.reportLoading.status).toBe('in_progress')

    // Back to empties — counter restarted, so a single empty poll is "processing",
    // NOT "no_data" (would be no_data if the counter had not reset).
    mockGet.mockResolvedValue({ batches: [] })
    await result.current.refetch()
    expect(result.current.data?.status).toBe('processing')
  })
})

describe('getRefetchInterval — load-bearing terminal-stop ordering', () => {
  const mk = (overrides: Partial<ProcessingStatus>): ProcessingStatus => ({
    status: 'processing',
    productParsing: { progress: 0, status: 'pending' },
    reportLoading: { progress: 0, status: 'pending' },
    ...overrides,
  })

  it('stops polling (returns false) on terminal "no_data" even with reportLoading.status "pending"', () => {
    // Guards the exact ordering bug the ticket fixed: a terminal 'no_data' carries
    // reportLoading.status: 'pending', which must NOT re-trigger the in-progress poll.
    expect(getRefetchInterval(mk({ status: 'no_data' }))).toBe(false)
  })

  it('keeps polling (returns 3000) while "processing"', () => {
    expect(getRefetchInterval(mk({ status: 'processing' }))).toBe(3000)
  })

  it('stops polling on terminal "completed" and "failed"', () => {
    expect(getRefetchInterval(mk({ status: 'completed' }))).toBe(false)
    expect(getRefetchInterval(mk({ status: 'failed' }))).toBe(false)
  })

  it('returns false when data is undefined', () => {
    expect(getRefetchInterval(undefined)).toBe(false)
  })
})
