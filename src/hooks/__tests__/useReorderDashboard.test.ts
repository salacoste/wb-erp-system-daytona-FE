/**
 * Unit tests for useReorderDashboard hooks
 * Tests: useReorderRecommendations, useReorderMetrics, useReorderRefresh,
 *        useUpdateReorderStatus
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import {
  useReorderRecommendations,
  useReorderMetrics,
  useReorderRefresh,
  useUpdateReorderStatus,
} from '../useReorderDashboard'
import * as api from '@/lib/api/reorder-recommendations'
import type {
  ReorderRecommendation,
  ReorderFulfillmentMetrics,
  UpdateReorderStatusPayload,
} from '@/types/reorder-recommendations'

vi.mock('@/lib/api/reorder-recommendations', async () => {
  const actual = await vi.importActual('@/lib/api/reorder-recommendations')
  return {
    ...actual,
    getReorderRecommendations: vi.fn(),
    getReorderMetrics: vi.fn(),
    refreshReorderRecommendations: vi.fn(),
    updateReorderStatus: vi.fn(),
  }
})

const mockGetList = vi.mocked(api.getReorderRecommendations)
const mockGetMetrics = vi.mocked(api.getReorderMetrics)
const mockRefresh = vi.mocked(api.refreshReorderRecommendations)
const mockUpdateStatus = vi.mocked(api.updateReorderStatus)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

const mockRecommendation: ReorderRecommendation = {
  id: 'rec-1',
  nmId: 12345,
  recommendedQty: 50,
  currentStock: 10,
  inTransitQty: 0,
  avgDailyDemand: 2,
  demandSource: 'velocity',
  leadTimeDays: 7,
  coverageDays: 5,
  orderByDate: null,
  stockoutDate: null,
  status: 'pending',
  unitCostRub: null,
  totalReorderValue: null,
  computedAt: '2025-01-15T00:00:00Z',
}

const mockMetrics: ReorderFulfillmentMetrics = {
  totalPending: 15,
  totalOrdered: 30,
  totalReceived: 20,
  avgFulfillmentDays: 4.5,
  totalExpired: 2,
  avgHoursToOrder: 12,
  avgHoursToReceive: 48,
  reorderCoveragePct: 75,
} as ReorderFulfillmentMetrics

// ── useReorderRecommendations ──────────────────────────────────────────────────

describe('useReorderRecommendations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches recommendations with no params', async () => {
    mockGetList.mockResolvedValueOnce([mockRecommendation])
    const { result } = renderHook(() => useReorderRecommendations(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetList).toHaveBeenCalledWith(undefined)
    expect(result.current.data).toEqual([mockRecommendation])
  })

  it('fetches recommendations with status filter', async () => {
    mockGetList.mockResolvedValueOnce([mockRecommendation])
    const params = { status: 'pending' }
    const { result } = renderHook(() => useReorderRecommendations(params), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetList).toHaveBeenCalledWith(params)
  })

  it('fetches recommendations with urgency and limit', async () => {
    mockGetList.mockResolvedValueOnce([mockRecommendation])
    const params = { urgency: 'high', limit: 10 }
    const { result } = renderHook(() => useReorderRecommendations(params), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetList).toHaveBeenCalledWith(params)
  })

  it('is loading before fetch completes', async () => {
    mockGetList.mockImplementation(() => new Promise(() => {}))
    const { result } = renderHook(() => useReorderRecommendations(), { wrapper: createWrapper() })
    expect(result.current.isLoading).toBe(true)
  })

  it('returns error on failure', async () => {
    mockGetList.mockRejectedValueOnce(new Error('Server error'))
    mockGetList.mockRejectedValueOnce(new Error('Server error'))
    const { result } = renderHook(() => useReorderRecommendations(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
  })

  it('returns empty list when no recommendations', async () => {
    mockGetList.mockResolvedValueOnce([])
    const { result } = renderHook(() => useReorderRecommendations(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })
})

// ── useReorderMetrics ──────────────────────────────────────────────────────────

describe('useReorderMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches metrics on mount', async () => {
    mockGetMetrics.mockResolvedValueOnce(mockMetrics)
    const { result } = renderHook(() => useReorderMetrics(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetMetrics).toHaveBeenCalledOnce()
    expect(result.current.data).toEqual(mockMetrics)
  })

  it('is loading before fetch completes', async () => {
    mockGetMetrics.mockImplementation(() => new Promise(() => {}))
    const { result } = renderHook(() => useReorderMetrics(), { wrapper: createWrapper() })
    expect(result.current.isLoading).toBe(true)
  })

  it('returns error on failure', async () => {
    mockGetMetrics.mockRejectedValueOnce(new Error('Network error'))
    mockGetMetrics.mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useReorderMetrics(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
  })
})

// ── useReorderRefresh ──────────────────────────────────────────────────────────

describe('useReorderRefresh', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls refreshRecommendations and invalidates cache', async () => {
    mockRefresh.mockResolvedValueOnce(undefined as unknown as void)

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useReorderRefresh(), { wrapper })

    result.current.mutate()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockRefresh).toHaveBeenCalledOnce()
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['reorder-recommendations'],
    })
  })

  it('returns error on refresh failure', async () => {
    mockRefresh.mockRejectedValueOnce(new Error('Refresh failed'))

    const { result } = renderHook(() => useReorderRefresh(), { wrapper: createWrapper() })

    result.current.mutate()

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('sets isPending during refresh', async () => {
    let resolveMutation: () => void
    mockRefresh.mockImplementation(
      () =>
        new Promise<void>(resolve => {
          resolveMutation = resolve
        })
    )

    const { result } = renderHook(() => useReorderRefresh(), { wrapper: createWrapper() })

    result.current.mutate()
    await waitFor(() => expect(result.current.isPending).toBe(true))

    await act(async () => {
      resolveMutation!()
    })
    await waitFor(() => expect(result.current.isPending).toBe(false))
  })
})

// ── useUpdateReorderStatus ─────────────────────────────────────────────────────

describe('useUpdateReorderStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls updateReorderStatus with id and payload', async () => {
    mockUpdateStatus.mockResolvedValueOnce({} as unknown as ReorderRecommendation)
    const payload: UpdateReorderStatusPayload = { status: 'ordered' }

    const { result } = renderHook(() => useUpdateReorderStatus(), { wrapper: createWrapper() })

    result.current.mutate({ id: 'rec-1', payload })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockUpdateStatus).toHaveBeenCalledWith('rec-1', payload)
  })

  it('invalidates reorder cache on success', async () => {
    mockUpdateStatus.mockResolvedValueOnce({} as unknown as ReorderRecommendation)

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useUpdateReorderStatus(), { wrapper })

    result.current.mutate({ id: 'rec-1', payload: { status: 'ordered' } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['reorder-recommendations'],
    })
  })

  it('returns error on failure', async () => {
    mockUpdateStatus.mockRejectedValueOnce(new Error('Conflict'))

    const { result } = renderHook(() => useUpdateReorderStatus(), { wrapper: createWrapper() })

    result.current.mutate({ id: 'rec-1', payload: { status: 'ordered' } })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
  })
})
