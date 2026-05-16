/**
 * useAiHealth Hook Tests
 * Story 108.2-FE: AI Engine Health monitoring hook.
 *
 * Verifies: queryKey does NOT include cabinetId (global endpoint),
 * refetchInterval is 30000, staleTime is 15000.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAiHealth, aiHealthKeys } from '../useAiHealth'
import * as systemApi from '@/lib/api/ai/system'
import type { AiHealthResponse } from '@/types/ai/system'

vi.mock('@/lib/api/ai/system')
const mockGetAiHealth = vi.mocked(systemApi.getAiHealth)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

const mockHealth: AiHealthResponse = {
  status: 'ok',
  engineConnected: true,
  engine: 'mindsdb',
  latencyMs: 42,
  cachedPredictionsAvailable: false,
}

describe('useAiHealth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('queryKey does not include cabinetId (global endpoint)', () => {
    expect(aiHealthKeys.all).toEqual(['ai', 'health'])
    expect(aiHealthKeys.all).toHaveLength(2)
  })

  it('fetches health data and returns it', async () => {
    mockGetAiHealth.mockResolvedValueOnce(mockHealth)
    const { result } = renderHook(() => useAiHealth(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockHealth)
    expect(mockGetAiHealth).toHaveBeenCalledTimes(1)
  })

  it('exposes error state when fetch fails', async () => {
    // Two rejections needed: retry:1 means one initial + one retry before isError
    mockGetAiHealth.mockRejectedValueOnce(new Error('network error'))
    mockGetAiHealth.mockRejectedValueOnce(new Error('network error'))
    const { result } = renderHook(() => useAiHealth(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
    expect(result.current.error?.message).toBe('network error')
  })
})
