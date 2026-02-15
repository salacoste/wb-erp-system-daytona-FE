/**
 * Unit Tests for Fulfillment (FBO/FBS) Analytics Hooks
 * Epic 60: FBO/FBS Order Analytics Separation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createQueryWrapper } from '@/test/utils/test-utils'
import {
  mockFulfillmentSummary,
  mockFulfillmentSummaryEmpty,
  mockFulfillmentSummaryPrevious,
  mockSyncStatusAvailable,
  mockSyncStatusUnavailable,
  mockSyncStatusInProgress,
} from '@/test/fixtures/fulfillment'

vi.mock('@/lib/api/fulfillment', () => ({
  getFulfillmentSummary: vi.fn(),
  getFulfillmentSyncStatus: vi.fn(),
  fulfillmentQueryKeys: {
    all: ['fulfillment'],
    summary: (from: string, to: string) => ['fulfillment', 'summary', from, to],
    syncStatus: ['fulfillment', 'sync-status'],
  },
}))

import { getFulfillmentSummary, getFulfillmentSyncStatus } from '@/lib/api/fulfillment'
import {
  useFulfillmentSummary,
  useFulfillmentSyncStatus,
  useFulfillmentSummaryWithComparison,
} from '../useFulfillment'

describe('Fulfillment Hooks - Epic 60', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('useFulfillmentSummary', () => {
    it('returns FBO/FBS summary for date range', async () => {
      vi.mocked(getFulfillmentSummary).mockResolvedValueOnce(mockFulfillmentSummary)
      const { result } = renderHook(() => useFulfillmentSummary('2026-01-19', '2026-01-25'), {
        wrapper: createQueryWrapper(),
      })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data?.summary.fbo.ordersCount).toBe(150)
      expect(result.current.data?.summary.total.fboShare).toBe(63.8)
    })

    it('returns loading state initially', () => {
      vi.mocked(getFulfillmentSummary).mockImplementation(() => new Promise(() => {}))
      const { result } = renderHook(() => useFulfillmentSummary('2026-01-19', '2026-01-25'), {
        wrapper: createQueryWrapper(),
      })
      expect(result.current.isLoading).toBe(true)
    })

    it('handles API errors', async () => {
      vi.mocked(getFulfillmentSummary).mockRejectedValue(new Error('API Error'))
      const { result } = renderHook(() => useFulfillmentSummary('2026-01-19', '2026-01-25'), {
        wrapper: createQueryWrapper(),
      })
      await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
      expect(result.current.error?.message).toBe('API Error')
    })

    it('does not fetch when dates are empty', () => {
      const { result: r1 } = renderHook(() => useFulfillmentSummary('', '2026-01-25'), {
        wrapper: createQueryWrapper(),
      })
      const { result: r2 } = renderHook(() => useFulfillmentSummary('2026-01-19', ''), {
        wrapper: createQueryWrapper(),
      })
      expect(getFulfillmentSummary).not.toHaveBeenCalled()
      expect(r1.current.isPending).toBe(true)
      expect(r2.current.isPending).toBe(true)
    })

    it('respects enabled option', () => {
      const { result } = renderHook(
        () => useFulfillmentSummary('2026-01-19', '2026-01-25', { enabled: false }),
        { wrapper: createQueryWrapper() }
      )
      expect(getFulfillmentSummary).not.toHaveBeenCalled()
      expect(result.current.isPending).toBe(true)
    })

    it('handles empty data response', async () => {
      vi.mocked(getFulfillmentSummary).mockResolvedValueOnce(mockFulfillmentSummaryEmpty)
      const { result } = renderHook(() => useFulfillmentSummary('2026-01-19', '2026-01-25'), {
        wrapper: createQueryWrapper(),
      })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data?.summary.total.ordersCount).toBe(0)
    })
  })

  describe('useFulfillmentSyncStatus', () => {
    it('returns isDataAvailable true when synced', async () => {
      vi.mocked(getFulfillmentSyncStatus).mockResolvedValueOnce(mockSyncStatusAvailable)
      const { result } = renderHook(() => useFulfillmentSyncStatus(), {
        wrapper: createQueryWrapper(),
      })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data?.isDataAvailable).toBe(true)
      expect(result.current.data?.aggregation?.status).toBe('complete')
    })

    it('returns isDataAvailable false when not synced', async () => {
      vi.mocked(getFulfillmentSyncStatus).mockResolvedValueOnce(mockSyncStatusUnavailable)
      const { result } = renderHook(() => useFulfillmentSyncStatus(), {
        wrapper: createQueryWrapper(),
      })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data?.isDataAvailable).toBe(false)
      expect(result.current.data?.orders).toBeNull()
    })

    it('returns in_progress status when aggregation running', async () => {
      vi.mocked(getFulfillmentSyncStatus).mockResolvedValueOnce(mockSyncStatusInProgress)
      const { result } = renderHook(() => useFulfillmentSyncStatus(), {
        wrapper: createQueryWrapper(),
      })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data?.aggregation?.status).toBe('in_progress')
    })

    it('respects enabled option', () => {
      const { result } = renderHook(() => useFulfillmentSyncStatus({ enabled: false }), {
        wrapper: createQueryWrapper(),
      })
      expect(getFulfillmentSyncStatus).not.toHaveBeenCalled()
      expect(result.current.isPending).toBe(true)
    })

    it('handles API errors gracefully', async () => {
      vi.mocked(getFulfillmentSyncStatus).mockRejectedValue(new Error('Network Error'))
      const { result } = renderHook(() => useFulfillmentSyncStatus(), {
        wrapper: createQueryWrapper(),
      })
      await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
      expect(result.current.error?.message).toBe('Network Error')
    })
  })

  describe('useFulfillmentSummaryWithComparison', () => {
    it('returns current and previous period data', async () => {
      vi.mocked(getFulfillmentSummary)
        .mockResolvedValueOnce(mockFulfillmentSummary)
        .mockResolvedValueOnce(mockFulfillmentSummaryPrevious)
      const { result } = renderHook(
        () =>
          useFulfillmentSummaryWithComparison({
            from: '2026-01-19',
            to: '2026-01-25',
            previousFrom: '2026-01-12',
            previousTo: '2026-01-18',
          }),
        { wrapper: createQueryWrapper() }
      )
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.current?.summary.total.ordersCount).toBe(235)
      expect(result.current.previous?.summary.total.ordersCount).toBe(200)
    })

    it('returns loading state when either query is loading', () => {
      vi.mocked(getFulfillmentSummary).mockImplementation(() => new Promise(() => {}))
      const { result } = renderHook(
        () =>
          useFulfillmentSummaryWithComparison({
            from: '2026-01-19',
            to: '2026-01-25',
            previousFrom: '2026-01-12',
            previousTo: '2026-01-18',
          }),
        { wrapper: createQueryWrapper() }
      )
      expect(result.current.isLoading).toBe(true)
    })

    it('skips previous period when dates not provided', async () => {
      vi.mocked(getFulfillmentSummary).mockResolvedValueOnce(mockFulfillmentSummary)
      const { result } = renderHook(
        () => useFulfillmentSummaryWithComparison({ from: '2026-01-19', to: '2026-01-25' }),
        { wrapper: createQueryWrapper() }
      )
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.current).toBeDefined()
      expect(result.current.previous).toBeUndefined()
      expect(getFulfillmentSummary).toHaveBeenCalledTimes(1)
    })
  })
})
