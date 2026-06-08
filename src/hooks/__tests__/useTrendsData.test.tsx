/**
 * Tests for useTrendsData hook
 * Historical trends data fetching with week range calculation
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTrendsData, trendsQueryKeys } from '../useTrendsData'
import * as apiClientModule from '@/lib/api-client'

vi.mock('@/lib/api-client')

const mockGet = vi.mocked(apiClientModule.apiClient.get)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const mockTrendsResponse = {
  period: { from: '2026-W02', to: '2026-W05', weeks_count: 4 },
  data: [
    { week: '2026-W02', metric: 'wb_sales_gross', value: 100000 },
    { week: '2026-W03', metric: 'wb_sales_gross', value: 110000 },
    { week: '2026-W04', metric: 'wb_sales_gross', value: 105000 },
    { week: '2026-W05', metric: 'wb_sales_gross', value: 120000 },
  ],
  summary: {
    wb_sales_gross: { min: 100000, max: 120000, avg: 108750, trend: 'up' },
  },
}

describe('trendsQueryKeys', () => {
  it('all returns base key', () => {
    expect(trendsQueryKeys.all).toEqual(['trends'])
  })

  it('byRange includes from and to', () => {
    expect(trendsQueryKeys.byRange('2026-W02', '2026-W05')).toEqual([
      'trends',
      '2026-W02',
      '2026-W05',
    ])
  })
})

describe('useTrendsData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches trends data for given week range', async () => {
    mockGet.mockResolvedValueOnce(mockTrendsResponse as never)

    const { result } = renderHook(
      () => useTrendsData({ currentWeek: '2026-W05', weeks: 4, enabled: true }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.data).toHaveLength(4)
    expect(result.current.data?.summary).toBeDefined()
    expect(result.current.data?.period).toBeDefined()
  })

  it('is disabled when enabled=false', () => {
    const { result } = renderHook(
      () => useTrendsData({ currentWeek: '2026-W05', weeks: 4, enabled: false }),
      { wrapper: createWrapper() }
    )
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('is disabled when enabled is false', () => {
    const { result } = renderHook(
      () => useTrendsData({ currentWeek: '2026-W05', weeks: 4, enabled: false }),
      { wrapper: createWrapper() }
    )
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('returns loading state initially', () => {
    mockGet.mockReturnValue(new Promise(() => {}) as never)

    const { result } = renderHook(
      () => useTrendsData({ currentWeek: '2026-W05', weeks: 4, enabled: true }),
      { wrapper: createWrapper() }
    )
    expect(result.current.isLoading).toBe(true)
  })
})
