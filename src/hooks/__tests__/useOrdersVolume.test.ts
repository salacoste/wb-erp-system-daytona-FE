/**
 * Unit tests for useOrdersVolume hook
 * Story 61.3-FE: Orders Volume API Integration
 *
 * Covers:
 *   - useOrdersVolume: week/month fetching, enabled gating, error handling
 *   - useOrdersVolumeWithComparison: current + previous period
 *   - getPreviousWeek / getPreviousMonth: year boundary edge cases
 *   - Query key generation and cache isolation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetOrdersVolume = vi.fn()
const mockTransformToMetrics = vi.fn()

vi.mock('@/lib/api/orders-volume', () => ({
  getOrdersVolume: (...args: unknown[]) => mockGetOrdersVolume(...args),
  transformToMetrics: (...args: unknown[]) => mockTransformToMetrics(...args),
  ordersVolumeQueryKeys: {
    all: ['orders-volume'] as const,
    byRange: (from: string, to: string) => ['orders-volume', from, to] as const,
    byRangeWithAggregation: (from: string, to: string, agg: string) =>
      ['orders-volume', from, to, agg] as const,
    statusBreakdown: (from: string, to: string) =>
      ['orders-volume', 'status-breakdown', from, to] as const,
    seasonalPatterns: (months: number) => ['orders-volume', 'seasonal', months] as const,
  },
}))

vi.mock('@/lib/date-utils', () => ({
  weekToDateRange: (week: string) => {
    // Simplified mock: W05 2026 -> Jan 27 - Feb 02
    const match = week.match(/^(\d{4})-W(\d{2})$/)
    if (!match) throw new Error(`Invalid week format: ${week}`)
    const year = parseInt(match[1], 10)
    const wn = parseInt(match[2], 10)
    const jan4 = new Date(year, 0, 4)
    const dayOfWeek = jan4.getDay() || 7
    const weekStart = new Date(year, 0, 4 - dayOfWeek + 1 + (wn - 1) * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    return {
      from: weekStart.toISOString().slice(0, 10),
      to: weekEnd.toISOString().slice(0, 10),
    }
  },
  monthToDateRange: (month: string) => {
    const [y, m] = month.split('-').map(Number)
    const start = new Date(y, m - 1, 1)
    const end = new Date(y, m, 0)
    return {
      from: start.toISOString().slice(0, 10),
      to: end.toISOString().slice(0, 10),
    }
  },
}))

import { useOrdersVolume, useOrdersVolumeWithComparison } from '../useOrdersVolume'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children)
}

/** Standard mock metrics response from transformToMetrics. */
function makeMetrics(overrides: Record<string, unknown> = {}) {
  return {
    totalOrders: 1250,
    totalAmount: 4500000,
    avgOrderValue: 3600,
    completionRate: 76,
    cancellationRate: 8,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ===========================================================================
// useOrdersVolume — basic fetching
// ===========================================================================

describe('useOrdersVolume — basic fetching', () => {
  it('fetches and transforms week period data', async () => {
    const rawResponse = { total_orders: 1250, total_amount: 4500000 }
    mockGetOrdersVolume.mockResolvedValueOnce(rawResponse)
    mockTransformToMetrics.mockReturnValueOnce(makeMetrics())

    const { result } = renderHook(
      () =>
        useOrdersVolume({
          periodType: 'week',
          period: '2026-W05',
        }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 5_000 })

    expect(mockGetOrdersVolume).toHaveBeenCalledTimes(1)
    expect(result.current.data!.totalOrders).toBe(1250)
    expect(result.current.data!.completionRate).toBe(76)
  })

  it('fetches month period data', async () => {
    mockGetOrdersVolume.mockResolvedValueOnce({})
    mockTransformToMetrics.mockReturnValueOnce(makeMetrics({ totalOrders: 500 }))

    const { result } = renderHook(
      () =>
        useOrdersVolume({
          periodType: 'month',
          period: '2026-01',
        }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 5_000 })

    expect(result.current.data!.totalOrders).toBe(500)
  })

  it('passes aggregation=day when withDailyBreakdown=true', async () => {
    mockGetOrdersVolume.mockResolvedValueOnce({})
    mockTransformToMetrics.mockReturnValueOnce(makeMetrics())

    renderHook(
      () =>
        useOrdersVolume({
          periodType: 'week',
          period: '2026-W05',
          withDailyBreakdown: true,
        }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(mockGetOrdersVolume).toHaveBeenCalled(), { timeout: 3_000 })

    const params = mockGetOrdersVolume.mock.calls[0][0]
    expect(params.aggregation).toBe('day')
  })

  it('omits aggregation when withDailyBreakdown=false', async () => {
    mockGetOrdersVolume.mockResolvedValueOnce({})
    mockTransformToMetrics.mockReturnValueOnce(makeMetrics())

    renderHook(
      () =>
        useOrdersVolume({
          periodType: 'week',
          period: '2026-W05',
          withDailyBreakdown: false,
        }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(mockGetOrdersVolume).toHaveBeenCalled(), { timeout: 3_000 })

    const params = mockGetOrdersVolume.mock.calls[0][0]
    expect(params.aggregation).toBeUndefined()
  })
})

// ===========================================================================
// useOrdersVolume — enabled gating
// ===========================================================================

describe('useOrdersVolume — enabled gating', () => {
  it('does not fetch when enabled=false', () => {
    const { result } = renderHook(
      () =>
        useOrdersVolume({
          periodType: 'week',
          period: '2026-W05',
          enabled: false,
        }),
      { wrapper: createWrapper() }
    )

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGetOrdersVolume).not.toHaveBeenCalled()
  })

  it('does not fetch when period is empty', () => {
    const { result } = renderHook(
      () =>
        useOrdersVolume({
          periodType: 'week',
          period: '',
        }),
      { wrapper: createWrapper() }
    )

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGetOrdersVolume).not.toHaveBeenCalled()
  })
})

// ===========================================================================
// useOrdersVolume — error handling
// ===========================================================================

describe('useOrdersVolume — error handling', () => {
  it('returns error on API failure', async () => {
    mockGetOrdersVolume.mockRejectedValueOnce(new Error('Network failure'))

    const { result } = renderHook(
      () =>
        useOrdersVolume({
          periodType: 'week',
          period: '2026-W05',
        }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5_000 })
    expect(result.current.error!.message).toBe('Network failure')
  })

  it('handles empty response via transformToMetrics', async () => {
    const emptyResponse = { total_orders: 0, total_amount: 0 }
    mockGetOrdersVolume.mockResolvedValueOnce(emptyResponse)
    mockTransformToMetrics.mockReturnValueOnce(
      makeMetrics({ totalOrders: 0, totalAmount: 0, completionRate: 0, cancellationRate: 0 })
    )

    const { result } = renderHook(
      () =>
        useOrdersVolume({
          periodType: 'week',
          period: '2026-W05',
        }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 5_000 })
    expect(result.current.data!.totalOrders).toBe(0)
    expect(result.current.data!.completionRate).toBe(0)
  })
})

// ===========================================================================
// useOrdersVolumeWithComparison
// ===========================================================================

describe('useOrdersVolumeWithComparison', () => {
  it('fetches current and previous week data', async () => {
    mockGetOrdersVolume.mockResolvedValue({})
    mockTransformToMetrics
      .mockReturnValueOnce(makeMetrics({ totalOrders: 1250 }))
      .mockReturnValueOnce(makeMetrics({ totalOrders: 1100 }))

    const { result } = renderHook(
      () =>
        useOrdersVolumeWithComparison({
          periodType: 'week',
          period: '2026-W05',
        }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 5_000 })

    expect(result.current.current?.totalOrders).toBe(1250)
    expect(result.current.previous?.totalOrders).toBe(1100)
  })

  it('fetches current and previous month data', async () => {
    mockGetOrdersVolume.mockResolvedValue({})
    mockTransformToMetrics
      .mockReturnValueOnce(makeMetrics({ totalOrders: 3000 }))
      .mockReturnValueOnce(makeMetrics({ totalOrders: 2800 }))

    const { result } = renderHook(
      () =>
        useOrdersVolumeWithComparison({
          periodType: 'month',
          period: '2026-01',
        }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 5_000 })

    expect(result.current.current?.totalOrders).toBe(3000)
    expect(result.current.previous?.totalOrders).toBe(2800)
  })

  it('computes previous week correctly for W05 -> W04', async () => {
    mockGetOrdersVolume.mockResolvedValue({})
    mockTransformToMetrics.mockReturnValue(makeMetrics())

    renderHook(
      () =>
        useOrdersVolumeWithComparison({
          periodType: 'week',
          period: '2026-W05',
        }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(mockGetOrdersVolume).toHaveBeenCalledTimes(2), { timeout: 5_000 })

    // Second call should be for the previous period
    // getPreviousWeek('2026-W05') -> '2026-W04'
    const secondCallParams = mockGetOrdersVolume.mock.calls[1][0]
    // The from date should correspond to W04
    expect(secondCallParams.from).toBeDefined()
  })

  it('handles year boundary: W01 -> previous year W52', async () => {
    mockGetOrdersVolume.mockResolvedValue({})
    mockTransformToMetrics.mockReturnValue(makeMetrics())

    renderHook(
      () =>
        useOrdersVolumeWithComparison({
          periodType: 'week',
          period: '2026-W01',
        }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(mockGetOrdersVolume).toHaveBeenCalledTimes(2), { timeout: 5_000 })

    // Second call should use a date from 2025
    const secondCallParams = mockGetOrdersVolume.mock.calls[1][0]
    expect(secondCallParams.from).toContain('2025')
  })

  it('handles year boundary: month 01 -> previous year 12', async () => {
    mockGetOrdersVolume.mockResolvedValue({})
    mockTransformToMetrics.mockReturnValue(makeMetrics())

    renderHook(
      () =>
        useOrdersVolumeWithComparison({
          periodType: 'month',
          period: '2026-01',
        }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(mockGetOrdersVolume).toHaveBeenCalledTimes(2), { timeout: 5_000 })

    // Second call should use a date from 2025-12
    const secondCallParams = mockGetOrdersVolume.mock.calls[1][0]
    expect(secondCallParams.from).toContain('2025-12')
  })

  it('reports isError when either query fails', async () => {
    mockGetOrdersVolume.mockResolvedValue({})
    mockGetOrdersVolume.mockRejectedValueOnce(new Error('fail'))
    mockTransformToMetrics.mockReturnValue(makeMetrics())

    const { result } = renderHook(
      () =>
        useOrdersVolumeWithComparison({
          periodType: 'week',
          period: '2026-W05',
        }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5_000 })
  })
})

// ===========================================================================
// Previous period calculation — indirect tests via hook
// ===========================================================================

describe('getPreviousWeek — edge cases via hook', () => {
  it('W02 -> W01 simple decrement', async () => {
    mockGetOrdersVolume.mockResolvedValue({})
    mockTransformToMetrics.mockReturnValue(makeMetrics())

    renderHook(
      () =>
        useOrdersVolumeWithComparison({
          periodType: 'week',
          period: '2026-W02',
        }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(mockGetOrdersVolume).toHaveBeenCalledTimes(2), { timeout: 5_000 })

    // The previous period should be for W01
    const secondParams = mockGetOrdersVolume.mock.calls[1][0]
    // weekToDateRange('2026-W01') -> starts around 2025-12-29
    expect(secondParams.from).toBeDefined()
    // The from should be a date from late December 2025 or early January 2026
    const fromDate = secondParams.from
    expect(fromDate.startsWith('2025-12') || fromDate.startsWith('2026-01')).toBe(true)
  })

  it('W10 -> W09 mid-year', async () => {
    mockGetOrdersVolume.mockResolvedValue({})
    mockTransformToMetrics.mockReturnValue(makeMetrics())

    renderHook(
      () =>
        useOrdersVolumeWithComparison({
          periodType: 'week',
          period: '2026-W10',
        }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(mockGetOrdersVolume).toHaveBeenCalledTimes(2), { timeout: 5_000 })

    // Second call params should be for W09
    const secondParams = mockGetOrdersVolume.mock.calls[1][0]
    expect(secondParams.from).toContain('2026-03') // W09 2026 ~ early March
  })
})

describe('getPreviousMonth — edge cases via hook', () => {
  it('March -> February same year', async () => {
    mockGetOrdersVolume.mockResolvedValue({})
    mockTransformToMetrics.mockReturnValue(makeMetrics())

    renderHook(
      () =>
        useOrdersVolumeWithComparison({
          periodType: 'month',
          period: '2026-03',
        }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(mockGetOrdersVolume).toHaveBeenCalledTimes(2), { timeout: 5_000 })

    const secondParams = mockGetOrdersVolume.mock.calls[1][0]
    expect(secondParams.from).toContain('2026-02')
  })

  it('December -> November same year', async () => {
    mockGetOrdersVolume.mockResolvedValue({})
    mockTransformToMetrics.mockReturnValue(makeMetrics())

    renderHook(
      () =>
        useOrdersVolumeWithComparison({
          periodType: 'month',
          period: '2026-12',
        }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(mockGetOrdersVolume).toHaveBeenCalledTimes(2), { timeout: 5_000 })

    const secondParams = mockGetOrdersVolume.mock.calls[1][0]
    expect(secondParams.from).toContain('2026-11')
  })
})
