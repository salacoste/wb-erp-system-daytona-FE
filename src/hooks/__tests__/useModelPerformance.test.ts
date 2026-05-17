/**
 * useModelPerformance — cabinet-isolation regression tests + enabled-gate.
 * Story 109.5-FE: mirrors useAiModels.test.ts cabinet-isolation pattern (Story 97.5-FE).
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useModelPerformance, modelPerformanceKeys } from '../useModelPerformance'
import * as modelsApi from '@/lib/api/ai/models'
import * as authStore from '@/stores/authStore'
import type { ModelPerformanceResponse } from '@/types/ai/models'

vi.mock('@/lib/api/ai/models')
vi.mock('@/stores/authStore')

const mockGetModelPerformance = vi.mocked(modelsApi.getModelPerformance)
const mockUseAuthStore = vi.mocked(authStore.useAuthStore)

const mockPerformance: ModelPerformanceResponse = {
  driftStatus: 'stable',
  mapeTrend: [],
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

// ── modelPerformanceKeys cabinet-isolation ──────────────────────────────────

describe('modelPerformanceKeys', () => {
  it('different cabinetIds produce DIFFERENT byId keys (no cache collision)', () => {
    const keyA = modelPerformanceKeys.byId('cab-A', 'model-1')
    const keyB = modelPerformanceKeys.byId('cab-B', 'model-1')
    expect(keyA).not.toEqual(keyB)
  })

  it('null cabinetId produces a key with null (unauthenticated state isolated)', () => {
    const key = modelPerformanceKeys.byId(null, 'model-1')
    expect(key).toContain(null)
  })

  it('same cabinetId + modelId produces identical keys (cache reuse)', () => {
    const keyA = modelPerformanceKeys.byId('cab-123', 'model-1')
    const keyB = modelPerformanceKeys.byId('cab-123', 'model-1')
    expect(keyA).toEqual(keyB)
  })

  it('byId returns exact key shape [ai, model-performance, cabinetId, modelId]', () => {
    expect(modelPerformanceKeys.byId('cab-1', 'model-X')).toEqual([
      'ai',
      'model-performance',
      'cab-1',
      'model-X',
    ])
  })
})

// ── useModelPerformance enabled-gate ──────────────────────────────────────

describe('useModelPerformance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) => selector({ cabinetId: 'cab-123' }))
    mockGetModelPerformance.mockResolvedValue(mockPerformance)
  })

  it('fetches performance when cabinetId and modelId are present', async () => {
    const { result } = renderHook(() => useModelPerformance('model-1'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetModelPerformance).toHaveBeenCalledWith('model-1')
  })

  it('query disabled when modelId is empty string', async () => {
    const { result } = renderHook(() => useModelPerformance(''), {
      wrapper: createWrapper(),
    })
    // enabled: false → never fetches
    expect(result.current.isLoading).toBe(false)
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGetModelPerformance).not.toHaveBeenCalled()
  })

  it('query disabled when cabinetId is null', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) => selector({ cabinetId: null }))
    const { result } = renderHook(() => useModelPerformance('model-1'), {
      wrapper: createWrapper(),
    })
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGetModelPerformance).not.toHaveBeenCalled()
  })
})
