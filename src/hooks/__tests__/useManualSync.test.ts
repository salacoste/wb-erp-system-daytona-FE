/**
 * Unit tests for useManualSync hook
 * Tests: sync mutation, rate limiting, query invalidation, error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useManualSync } from '../useManualSync'
import { POLLING_CONFIG } from '../supply-polling-constants'

vi.mock('@/lib/api/supplies', () => ({
  syncSupplies: vi.fn(),
  suppliesQueryKeys: { all: ['supplies'] },
}))

vi.mock('../supply-polling-constants', async () => {
  const actual = await vi.importActual('../supply-polling-constants')
  return {
    ...actual,
    supplyPollingQueryKeys: { all: ['supply-polling'] },
  }
})

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn() },
}))

import { syncSupplies } from '@/lib/api/supplies'

const mockSyncSupplies = vi.mocked(syncSupplies)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

const mockSyncResponse = { jobId: 'job-123', message: 'Sync started' }

describe('useManualSync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns initial state with canSync=true and no syncing', () => {
    const { result } = renderHook(() => useManualSync(), { wrapper: createWrapper() })
    expect(result.current.canSync).toBe(true)
    expect(result.current.isSyncing).toBe(false)
    expect(result.current.lastSyncAt).toBeNull()
    expect(result.current.rateLimitCountdown).toBe(0)
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.isSuccess).toBe(false)
    expect(result.current.isError).toBe(false)
  })

  it('calls syncSupplies on sync()', async () => {
    mockSyncSupplies.mockResolvedValueOnce(mockSyncResponse)

    const { result } = renderHook(() => useManualSync(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.sync()
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockSyncSupplies).toHaveBeenCalledOnce()
    expect(result.current.data).toEqual(mockSyncResponse)
  })

  it('sets isSyncing during mutation', async () => {
    let resolveMutation: (v: unknown) => void
    mockSyncSupplies.mockImplementation(
      () =>
        new Promise((resolve: (v: unknown) => void) => {
          resolveMutation = resolve
        }) as unknown as typeof mockSyncSupplies extends (...args: unknown[]) => infer R ? R : never
    )

    const { result } = renderHook(() => useManualSync(), { wrapper: createWrapper() })

    result.current.sync()

    await waitFor(() => expect(result.current.isSyncing).toBe(true))
    expect(result.current.canSync).toBe(false)

    await act(async () => {
      resolveMutation!(mockSyncResponse)
    })

    expect(result.current.isSyncing).toBe(false)
  })

  it('starts rate limit countdown after successful sync', async () => {
    mockSyncSupplies.mockResolvedValueOnce(mockSyncResponse)

    const { result } = renderHook(() => useManualSync(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.sync()
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const expectedCountdown = POLLING_CONFIG.manualSyncRateLimitMs / 1000
    expect(result.current.rateLimitCountdown).toBe(expectedCountdown)
    expect(result.current.canSync).toBe(false)
  })

  it('decrements rate limit countdown over time', async () => {
    mockSyncSupplies.mockResolvedValueOnce(mockSyncResponse)

    const { result } = renderHook(() => useManualSync(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.sync()
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const initial = result.current.rateLimitCountdown
    expect(initial).toBeGreaterThan(0)

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(result.current.rateLimitCountdown).toBe(initial - 2)
  })

  it('sets lastSyncAt after successful sync', async () => {
    mockSyncSupplies.mockResolvedValueOnce(mockSyncResponse)

    const { result } = renderHook(() => useManualSync(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.sync()
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.lastSyncAt).toBeInstanceOf(Date)
  })

  it('does not call sync when canSync is false (rate limited)', async () => {
    mockSyncSupplies.mockResolvedValueOnce(mockSyncResponse)

    const { result } = renderHook(() => useManualSync(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.sync()
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    mockSyncSupplies.mockClear()

    // Still rate-limited — sync should be no-op
    act(() => {
      result.current.sync()
    })
    expect(mockSyncSupplies).not.toHaveBeenCalled()
  })

  it('sets error on failed sync', async () => {
    mockSyncSupplies.mockRejectedValueOnce(new Error('Network failure'))

    const { result } = renderHook(() => useManualSync(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.sync()
    })
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('Network failure')
  })

  it('allows sync again after rate limit expires', async () => {
    mockSyncSupplies.mockResolvedValueOnce(mockSyncResponse)

    const { result } = renderHook(() => useManualSync(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.sync()
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.canSync).toBe(false)

    // Advance past rate limit
    act(() => {
      vi.advanceTimersByTime(POLLING_CONFIG.manualSyncRateLimitMs + 1000)
    })
    expect(result.current.rateLimitCountdown).toBe(0)
    expect(result.current.canSync).toBe(true)

    mockSyncSupplies.mockResolvedValueOnce({ jobId: 'job-456', message: 'Sync again' })
    await act(async () => {
      result.current.sync()
    })
    await waitFor(() => expect(result.current.data?.jobId).toBe('job-456'))
  })

  it('does not start countdown on error', async () => {
    mockSyncSupplies.mockRejectedValueOnce(new Error('fail'))

    const { result } = renderHook(() => useManualSync(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.sync()
    })
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.rateLimitCountdown).toBe(0)
    expect(result.current.canSync).toBe(true)
  })
})
