/**
 * useAiTrends hook tests
 * Story 108.4-FE: AI Trends hook — top SKUs during collecting state.
 *
 * Tests:
 * - queryKey includes cabinetId (cabinet-isolation discipline, Story 97.5-FE)
 * - Fetches trends data successfully
 * - Disabled when cabinetId is null
 * - Disabled when enabled param is false
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAiTrends, aiTrendsKeys } from '../useAiTrends'
import * as trendsApi from '@/lib/api/ai/trends-sneak'
import type { AiTrendsResponse } from '@/types/ai/trends-sneak'

vi.mock('@/lib/api/ai/trends-sneak')

const mockGetAiTrends = vi.mocked(trendsApi.getAiTrends)

let mockCabinetId: string | null = 'cabinet-42'

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (s: { cabinetId: string | null }) => unknown) =>
    selector({ cabinetId: mockCabinetId }),
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const mockTrendsData: AiTrendsResponse = {
  topSkus: [
    { nmId: 123, vendorCode: 'SKU-A', avgPerDay: 4.5, weeklyVolume: 31 },
    { nmId: 456, vendorCode: null, avgPerDay: null, weeklyVolume: 10 },
  ],
}

describe('useAiTrends', () => {
  beforeEach(() => {
    mockCabinetId = 'cabinet-42'
    vi.clearAllMocks()
  })

  it('queryKey includes cabinetId (cabinet-isolation discipline)', () => {
    expect(aiTrendsKeys.byCabinet('cabinet-42')).toEqual(['ai', 'trends', 'cabinet-42'])
    expect(aiTrendsKeys.byCabinet(null)).toEqual(['ai', 'trends', null])
  })

  it('fetches trends data successfully', async () => {
    mockGetAiTrends.mockResolvedValueOnce(mockTrendsData)
    const { result } = renderHook(() => useAiTrends(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockTrendsData)
    expect(mockGetAiTrends).toHaveBeenCalledTimes(1)
  })

  it('is disabled when cabinetId is null', async () => {
    mockCabinetId = null
    const { result } = renderHook(() => useAiTrends(), { wrapper: createWrapper() })
    // fetchStatus idle means query never ran
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGetAiTrends).not.toHaveBeenCalled()
  })

  it('is disabled when enabled param is false', async () => {
    const { result } = renderHook(() => useAiTrends(false), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGetAiTrends).not.toHaveBeenCalled()
  })
})
