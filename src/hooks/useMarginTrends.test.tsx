/**
 * Unit tests for useMarginTrends hook
 * Story 4.7: Margin Analysis by Time Period
 *
 * Tests:
 * - API integration with weeks parameter
 * - API integration with weekStart/weekEnd parameters
 * - Data sorting (chronological)
 * - Error handling (404, 400)
 * - Parameter validation
 * - Helper functions: getWeekRange, getISOWeek
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMarginTrends, getWeekRange } from './useMarginTrends'
import { apiClient } from '@/lib/api-client'

// Mock apiClient
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

const createWrapper = () => {
  // NOTE: this retry:false is only the QueryClient *default*. Empirically the per-query
  // retry:1 set inside useMarginTrends still fires here (verified by the 400/generic
  // error tests needing two mocks before isError settles), so error-path tests that
  // THROW must mock N+1 rejections (N = hook retry). Tests whose queryFn catches and
  // returns (e.g. the 404 path) resolve without a retry — one mock suffices there.
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useMarginTrends', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('with weeks parameter', () => {
    it('fetches margin trends for specified number of weeks', async () => {
      const mockResponse = {
        data: [
          {
            week: '2025-W45',
            week_start_date: '2025-11-03',
            week_end_date: '2025-11-09',
            margin_pct: 35.5,
            revenue_net: 125000.5,
            cogs: 80625.32,
            profit: 44375.18,
            qty: 50,
            sku_count: 10,
            missing_cogs_count: 0,
          },
          {
            week: '2025-W46',
            week_start_date: '2025-11-10',
            week_end_date: '2025-11-16',
            margin_pct: 28.2,
            revenue_net: 98000.0,
            cogs: 70364.0,
            profit: 27636.0,
            qty: 40,
            sku_count: 8,
            missing_cogs_count: 2,
          },
        ],
      }

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => useMarginTrends({ weeks: 12 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toBeDefined()
      expect(result.current.data).toHaveLength(2)
      expect(result.current.data?.[0]).toMatchObject({
        week: '2025-W45',
        margin_pct: 35.5,
        revenue_net: 125000.5,
      })
    })

    // Validation F-30: apiClient auto-unwraps the `{ data }` envelope, so at runtime
    // the queryFn receives MarginTrendPoint[] directly — NOT { data: [...] }. The old
    // `response.data || []` read undefined on that array → empty chart in prod. This
    // pins the real (unwrapped-array) shape; it would fail before the Array.isArray fix.
    it('handles the apiClient-unwrapped array shape (real prod path)', async () => {
      // Full 10-field shape matching MarginTrendPoint (the tooltip renders qty/
      // missing_cogs_count, so the fixture must carry them — review F-30 pass).
      const unwrapped = [
        {
          week: '2026-W11',
          week_start_date: '2026-03-08',
          week_end_date: '2026-03-14',
          margin_pct: 6.2,
          revenue_net: 415775.61,
          cogs: 390000,
          profit: 25775.61,
          qty: 780,
          sku_count: 27,
          missing_cogs_count: 0,
        },
      ]

      vi.mocked(apiClient.get).mockResolvedValueOnce(unwrapped)

      const { result } = renderHook(() => useMarginTrends({ weeks: 12 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toHaveLength(1)
      expect(result.current.data?.[0]).toMatchObject({ week: '2026-W11', margin_pct: 6.2 })
    })

    it('sorts data chronologically (oldest to newest)', async () => {
      const mockResponse = {
        data: [
          {
            week: '2025-W46',
            week_start_date: '2025-11-10',
            week_end_date: '2025-11-16',
            margin_pct: 28.2,
            revenue_net: 98000.0,
            cogs: 70364.0,
            profit: 27636.0,
            qty: 40,
            sku_count: 8,
            missing_cogs_count: 0,
          },
          {
            week: '2025-W45',
            week_start_date: '2025-11-03',
            week_end_date: '2025-11-09',
            margin_pct: 35.5,
            revenue_net: 125000.5,
            cogs: 80625.32,
            profit: 44375.18,
            qty: 50,
            sku_count: 10,
            missing_cogs_count: 0,
          },
        ],
      }

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => useMarginTrends({ weeks: 12 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      // Should be sorted: W45 first, then W46
      expect(result.current.data?.[0].week).toBe('2025-W45')
      expect(result.current.data?.[1].week).toBe('2025-W46')
    })
  })

  describe('with weekStart/weekEnd parameters', () => {
    it('fetches margin trends for specific week range', async () => {
      const mockResponse = {
        data: [
          {
            week: '2025-W40',
            week_start_date: '2025-09-29',
            week_end_date: '2025-10-05',
            margin_pct: 30.0,
            revenue_net: 100000.0,
            cogs: 70000.0,
            profit: 30000.0,
            qty: 40,
            sku_count: 8,
            missing_cogs_count: 0,
          },
        ],
      }

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(
        () =>
          useMarginTrends({
            weekStart: '2025-W40',
            weekEnd: '2025-W47',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toBeDefined()
      expect(result.current.data).toHaveLength(1)
    })

    it('includes weekStart and weekEnd in query params', async () => {
      const mockResponse = { data: [] }
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse)

      renderHook(
        () =>
          useMarginTrends({
            weekStart: '2025-W40',
            weekEnd: '2025-W47',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalled()
        const callArgs = vi.mocked(apiClient.get).mock.calls[0][0]
        expect(callArgs).toContain('weekStart=2025-W40')
        expect(callArgs).toContain('weekEnd=2025-W47')
      })
    })
  })

  describe('error handling', () => {
    it('returns empty array for 404 errors', async () => {
      const error = new Error('Not Found') as Error & { response?: { status: number } }
      error.response = { status: 404 }

      // Only ONE mock here (unlike the 400/generic tests): the 404 branch is caught
      // INSIDE queryFn and returns [] — TanStack Query sees a success, so it never
      // retries. The "mock N+1 rejections" note on createWrapper does NOT apply.
      vi.mocked(apiClient.get).mockRejectedValueOnce(error)

      const { result } = renderHook(() => useMarginTrends({ weeks: 12 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual([])
    })

    it('throws error for 400 bad request', async () => {
      const error = new Error('Bad Request') as Error & {
        response?: { status: number; data?: { error?: { message?: string } } }
      }
      error.response = {
        status: 400,
        data: { error: { message: 'Invalid week range' } },
      }

      // The hook sets retry:1, so the queryFn runs twice on failure — reject BOTH
      // calls (initial + retry) so the query settles to error for the right reason.
      // (Previously only the 1st call was mocked; the retry's undefined return happened
      // to throw on `response.data`, masking this — see Validation F-30.)
      vi.mocked(apiClient.get).mockRejectedValueOnce(error).mockRejectedValueOnce(error)

      const { result } = renderHook(
        () => useMarginTrends({ weeks: 12 }), // Valid weeks parameter
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
      expect(result.current.error).toBeDefined()
    })

    it('handles generic API errors', async () => {
      // retry:1 → reject both the initial call and the retry (see F-30 note above).
      const netErr = new Error('Network Error')
      vi.mocked(apiClient.get).mockRejectedValueOnce(netErr).mockRejectedValueOnce(netErr)

      const { result } = renderHook(() => useMarginTrends({ weeks: 12 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
      expect(result.current.error).toBeDefined()
    })
  })

  describe('parameter validation', () => {
    it('throws error when neither weeks nor weekStart/weekEnd provided', () => {
      expect(() => {
        renderHook(() => useMarginTrends({}), { wrapper: createWrapper() })
      }).toThrow('useMarginTrends: Must provide either')
    })

    it('throws error when both weeks and weekStart/weekEnd provided', () => {
      expect(() => {
        renderHook(
          () => useMarginTrends({ weeks: 12, weekStart: '2025-W40', weekEnd: '2025-W47' }),
          { wrapper: createWrapper() }
        )
      }).toThrow('useMarginTrends: Cannot use both')
    })

    it('disables query when parameters are invalid', () => {
      // Hook throws error when parameters are invalid, so we need to catch it
      expect(() => {
        renderHook(
          () => useMarginTrends({ weekStart: '2025-W40' }), // Missing weekEnd
          { wrapper: createWrapper() }
        )
      }).toThrow('useMarginTrends: Must provide either')
    })
  })
})

describe('getWeekRange', () => {
  it('returns weekStart and weekEnd for specified number of weeks', () => {
    const range = getWeekRange(12)
    expect(range).toHaveProperty('weekStart')
    expect(range).toHaveProperty('weekEnd')
    expect(range.weekStart).toMatch(/^\d{4}-W\d{2}$/)
    expect(range.weekEnd).toMatch(/^\d{4}-W\d{2}$/)
  })

  it('returns valid ISO week format', () => {
    const range = getWeekRange(4)
    expect(range.weekStart).toMatch(/^\d{4}-W\d{2}$/)
    expect(range.weekEnd).toMatch(/^\d{4}-W\d{2}$/)
  })
})
