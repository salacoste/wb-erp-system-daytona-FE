/**
 * useAiEvaluations — cabinet-isolation regression tests + enabled-gate + queryKey-shape.
 * Story 110.2-FE: mirrors useModelPerformance.test.ts pattern (Story 109.5-FE).
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAiEvaluations, aiEvaluationsKeys } from '../useAiEvaluations'
import * as evaluationsApi from '@/lib/api/ai/evaluations'
import * as authStore from '@/stores/authStore'
import type { AiEvaluationListResponse } from '@/types/ai/evaluations'

vi.mock('@/lib/api/ai/evaluations')
vi.mock('@/stores/authStore')

const mockGetEvaluations = vi.mocked(evaluationsApi.getEvaluations)
const mockUseAuthStore = vi.mocked(authStore.useAuthStore)

const mockEvaluations: AiEvaluationListResponse = {
  evaluations: [],
  cabinetMape: null,
  evaluatedAt: null,
  skuCount: 0,
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

// ── aiEvaluationsKeys cabinet-isolation ───────────────────────────────────────

describe('aiEvaluationsKeys', () => {
  it('different cabinetIds produce DIFFERENT byModel keys (no cache collision)', () => {
    const keyA = aiEvaluationsKeys.byModel('cab-A', 'model-1')
    const keyB = aiEvaluationsKeys.byModel('cab-B', 'model-1')
    expect(keyA).not.toEqual(keyB)
  })

  it('null cabinetId produces a key with null (unauthenticated state isolated)', () => {
    const key = aiEvaluationsKeys.byModel(null, 'model-1')
    expect(key).toContain(null)
  })

  it('same cabinetId + modelId produces identical keys (cache reuse)', () => {
    const keyA = aiEvaluationsKeys.byModel('cab-123', 'model-1')
    const keyB = aiEvaluationsKeys.byModel('cab-123', 'model-1')
    expect(keyA).toEqual(keyB)
  })

  it('byModel returns exact key shape [ai, evaluations, cabinetId, modelId]', () => {
    expect(aiEvaluationsKeys.byModel('cab-1', 'model-X')).toEqual([
      'ai',
      'evaluations',
      'cab-1',
      'model-X',
    ])
  })
})

// ── useAiEvaluations enabled-gate + runtime isolation ────────────────────────

describe('useAiEvaluations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) => selector({ cabinetId: 'cab-123' }))
    mockGetEvaluations.mockResolvedValue(mockEvaluations)
  })

  it('fetches evaluations when cabinetId and modelId are present', async () => {
    const { result } = renderHook(() => useAiEvaluations('model-1'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    // F-1: modelId must be passed to getEvaluations fetcher
    expect(mockGetEvaluations).toHaveBeenCalledWith({ modelId: 'model-1' })
  })

  it('query disabled when modelId is empty string', async () => {
    const { result } = renderHook(() => useAiEvaluations(''), {
      wrapper: createWrapper(),
    })
    // enabled: false → never fetches
    expect(result.current.isLoading).toBe(false)
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGetEvaluations).not.toHaveBeenCalled()
  })

  it('F-4: different cabinetIds fire separate fetches at runtime (single shared QueryClient)', async () => {
    // WHY single QueryClient is required for this assertion to be meaningful:
    // If we create two separate QueryClients, they have independent caches regardless of queryKey.
    // A second fetch would fire even if queryKey did NOT include cabinetId (because the second
    // client has no data at all). The assertion would be vacuously true.
    // With a SINGLE shared client: if queryKey omits cabinetId, cabinet-B would hit cabinet-A's
    // cached entry → no second fetch → callsAfterB === callsAfterA → assertion FAILS (correct).
    // Only when queryKey properly includes cabinetId does the switch cause a cache miss → fresh fetch.
    const sharedClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    })
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: sharedClient }, children)

    // Mount under cabinet A
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) => selector({ cabinetId: 'cab-A' }))
    const { result: resultA, unmount: unmountA } = renderHook(() => useAiEvaluations('model-1'), {
      wrapper,
    })
    await waitFor(() => expect(resultA.current.isSuccess).toBe(true))
    const callsAfterA = mockGetEvaluations.mock.calls.length
    unmountA()

    // Mount under cabinet B with SAME shared client — same cache, different cabinetId
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) => selector({ cabinetId: 'cab-B' }))
    const { result: resultB } = renderHook(() => useAiEvaluations('model-1'), {
      wrapper, // same wrapper = same QueryClient = same cache
    })
    await waitFor(() => expect(resultB.current.isSuccess).toBe(true))
    const callsAfterB = mockGetEvaluations.mock.calls.length

    // If queryKey did NOT include cabinetId, cabinet-B would reuse cab-A's cache → no new fetch
    // → callsAfterB === callsAfterA → this assertion would FAIL (proving the isolation is real)
    expect(callsAfterB).toBeGreaterThan(callsAfterA)
  })
})
