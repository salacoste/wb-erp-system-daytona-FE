/**
 * useAiStatus hook tests
 * Story 108.3-FE: Readiness state machine polling hook.
 *
 * Tests:
 * - queryKey includes cabinetId (cabinet-isolation discipline, Story 97.5-FE)
 * - Fetches status data successfully
 * - shouldPollAiStatus: returns false when ready, 60000 otherwise (direct pure-function tests)
 * - Disabled when cabinetId is null
 * - Disabled when enabled param is false (AI feature disabled)
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAiStatus, aiStatusKeys, shouldPollAiStatus } from '../useAiStatus'
import * as aiStatusApi from '@/lib/api/ai/status'
import type { AiStatusResponse } from '@/types/ai/status'

vi.mock('@/lib/api/ai/status')

const mockGetAiStatus = vi.mocked(aiStatusApi.getAiStatus)

// Controlled cabinetId for tests
let mockCabinetId: string | null = 'cabinet-42'

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (s: { cabinetId: string | null }) => unknown) =>
    selector({ cabinetId: mockCabinetId }),
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const readyStatus: AiStatusResponse = {
  readinessLevel: 'ready',
  weeksCollected: 12,
  weeksRequired: 12,
  progressPct: 100,
  missingRequirements: [],
  estimatedActivationDate: null,
  cogsCoveragePct: 95,
  skuCount: 42,
  orderCount: 1200,
}

const collectingStatus: AiStatusResponse = {
  readinessLevel: 'collecting',
  weeksCollected: 4,
  weeksRequired: 12,
  progressPct: 33,
  missingRequirements: ['Требуется больше данных'],
  estimatedActivationDate: '2026-08-01',
  cogsCoveragePct: null,
  skuCount: 10,
  orderCount: 300,
}

const sneakPreviewStatus: AiStatusResponse = {
  readinessLevel: 'sneak_preview',
  weeksCollected: 8,
  weeksRequired: 12,
  progressPct: 67,
  missingRequirements: [],
  estimatedActivationDate: '2026-07-01',
  cogsCoveragePct: 80,
  skuCount: 25,
  orderCount: 800,
}

describe('aiStatusKeys', () => {
  it('includes cabinetId in queryKey for cabinet isolation', () => {
    expect(aiStatusKeys.byCabinet('cabinet-42')).toEqual(['ai', 'status', 'cabinet-42'])
    expect(aiStatusKeys.byCabinet(null)).toEqual(['ai', 'status', null])
  })

  it('produces different keys for different cabinetIds', () => {
    const key1 = aiStatusKeys.byCabinet('cabinet-1')
    const key2 = aiStatusKeys.byCabinet('cabinet-2')
    expect(key1).not.toEqual(key2)
  })
})

describe('useAiStatus', () => {
  beforeEach(() => {
    mockCabinetId = 'cabinet-42'
    vi.clearAllMocks()
  })

  it('fetches AI status data successfully', async () => {
    mockGetAiStatus.mockResolvedValueOnce(readyStatus)

    const { result } = renderHook(() => useAiStatus(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(readyStatus)
    expect(mockGetAiStatus).toHaveBeenCalledTimes(1)
  })

  it('is disabled when cabinetId is null', async () => {
    mockCabinetId = null
    mockGetAiStatus.mockResolvedValueOnce(readyStatus)

    const { result } = renderHook(() => useAiStatus(), { wrapper: createWrapper() })

    // Should remain in pending (not fetching) state
    expect(result.current.isPending).toBe(true)
    expect(result.current.isFetching).toBe(false)
    expect(mockGetAiStatus).not.toHaveBeenCalled()
  })

  it('does not fetch when enabled param is false (AI feature disabled)', async () => {
    mockGetAiStatus.mockResolvedValueOnce(readyStatus)

    const { result } = renderHook(() => useAiStatus(false), { wrapper: createWrapper() })

    expect(result.current.isPending).toBe(true)
    expect(result.current.isFetching).toBe(false)
    expect(mockGetAiStatus).not.toHaveBeenCalled()
  })
})

describe('shouldPollAiStatus', () => {
  it('returns false when readinessLevel is ready (stop polling)', () => {
    const query = { state: { data: readyStatus } }
    expect(shouldPollAiStatus(query)).toBe(false)
  })

  it('returns 60000 when readinessLevel is collecting', () => {
    const query = { state: { data: collectingStatus } }
    expect(shouldPollAiStatus(query)).toBe(60_000)
  })

  it('returns 60000 when readinessLevel is sneak_preview', () => {
    const query = { state: { data: sneakPreviewStatus } }
    expect(shouldPollAiStatus(query)).toBe(60_000)
  })

  it('returns 60000 when data is undefined (initial fetch / error state)', () => {
    const query = { state: { data: undefined } }
    expect(shouldPollAiStatus(query)).toBe(60_000)
  })
})
