/**
 * useAiSneakPreview hook tests
 * Story 108.5-FE: Sneak-preview hook — low-confidence forecasts.
 *
 * Tests:
 * - queryKey includes cabinetId (cabinet-isolation discipline, Story 97.5-FE)
 * - Fetches sneak-preview data successfully
 * - Disabled when cabinetId is null
 * - Disabled when enabled param is false
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAiSneakPreview, aiSneakPreviewKeys } from '../useAiSneakPreview'
import * as trendsApi from '@/lib/api/ai/trends-sneak'
import type { AiSneakPreviewResponse } from '@/types/ai/trends-sneak'

vi.mock('@/lib/api/ai/trends-sneak')

const mockGetAiSneakPreview = vi.mocked(trendsApi.getAiSneakPreview)

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

const mockSneakData: AiSneakPreviewResponse = {
  disclaimer: 'Данные предварительные — модель ещё обучается',
  skuForecasts: [
    {
      nmId: 111,
      vendorCode: 'SKU-X',
      avgPerDay: 3.2,
      trend: 'up',
      estimatedRange: { low: 20, high: 25 },
    },
  ],
}

describe('useAiSneakPreview', () => {
  beforeEach(() => {
    mockCabinetId = 'cabinet-42'
    vi.clearAllMocks()
  })

  it('queryKey includes cabinetId (cabinet-isolation discipline)', () => {
    expect(aiSneakPreviewKeys.byCabinet('cabinet-42')).toEqual([
      'ai',
      'sneak-preview',
      'cabinet-42',
    ])
    expect(aiSneakPreviewKeys.byCabinet(null)).toEqual(['ai', 'sneak-preview', null])
  })

  it('fetches sneak-preview data successfully', async () => {
    mockGetAiSneakPreview.mockResolvedValueOnce(mockSneakData)
    const { result } = renderHook(() => useAiSneakPreview(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockSneakData)
    expect(mockGetAiSneakPreview).toHaveBeenCalledTimes(1)
  })

  it('is disabled when cabinetId is null', () => {
    mockCabinetId = null
    const { result } = renderHook(() => useAiSneakPreview(), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGetAiSneakPreview).not.toHaveBeenCalled()
  })

  it('is disabled when enabled param is false', () => {
    const { result } = renderHook(() => useAiSneakPreview(false), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGetAiSneakPreview).not.toHaveBeenCalled()
  })
})
