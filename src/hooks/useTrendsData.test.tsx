/**
 * useTrendsData — Validation F-32 (double-unwrap class, see F-30).
 * GET /v1/analytics/weekly/trends returns the FULL wrapper { period, data, summary }.
 * The hook needs all three siblings, so it MUST pass skipDataUnwrap:true — otherwise
 * apiClient strips the `{ data }` envelope, discarding period+summary and making
 * `response.data` undefined → the Historical Trends section renders empty.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTrendsData } from './useTrendsData'
import { apiClient } from '@/lib/api-client'
import type { WeeklyTrendsResponse } from '@/types/api'

vi.mock('@/lib/api-client', () => ({
  apiClient: { get: vi.fn() },
}))

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const fullWrapper = {
  period: { from: '2026-W18', to: '2026-W22', weeks_count: 5 },
  data: [
    { week: '2026-W18', wb_sales_gross: 446416.19, payout_total: 310987.07 },
    { week: '2026-W19', wb_sales_gross: 400000, payout_total: 300000 },
  ],
  // TrendMetricSummary requires `trend` (e.g. "+3.2%") — include it so the fixture
  // matches the real backend contract (review F-32 pass-2 HIGH).
  summary: { payout_total: { min: 300000, max: 310987.07, avg: 305493.5, trend: '+3.2%' } },
}

describe('useTrendsData — F-32 skipDataUnwrap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('requests with skipDataUnwrap:true so the { period, data, summary } wrapper survives', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(fullWrapper as unknown as WeeklyTrendsResponse)

    const { result } = renderHook(() => useTrendsData({ currentWeek: '2026-W22', weeks: 4 }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // The call must opt out of the auto-unwrap, else period/summary are discarded.
    expect(apiClient.get).toHaveBeenCalledWith(expect.any(String), { skipDataUnwrap: true })

    expect(result.current.data?.data).toHaveLength(2)
    expect(result.current.data?.summary?.payout_total?.trend).toBe('+3.2%')
    expect(result.current.data?.period).toMatchObject({ from: '2026-W18', to: '2026-W22' })
  })

  it('falls back to [] data when the wrapper omits the data array', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      period: { from: 'a', to: 'b', weeks_count: 0 },
    } as unknown as WeeklyTrendsResponse)

    const { result } = renderHook(() => useTrendsData({ currentWeek: '2026-W22', weeks: 4 }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.data).toEqual([])
  })
})
