/**
 * useAiSkuAccuracy — cabinet-isolation regression tests + enabled-gate + queryKey-shape.
 * Story 110.3-FE Task 3: mirrors useAiEvaluations.test.ts pattern (Story 110.2-FE).
 * F-4 cabinet-isolation uses SINGLE shared QueryClient (not two fresh clients — see comment).
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAiSkuAccuracy, aiSkuAccuracyKeys } from '../useAiSkuAccuracy'
import * as evaluationsApi from '@/lib/api/ai/evaluations'
import * as authStore from '@/stores/authStore'
import type { SkuAccuracyListResponse } from '@/types/ai/evaluations'

vi.mock('@/lib/api/ai/evaluations')
vi.mock('@/stores/authStore')

const mockGetSkuAccuracy = vi.mocked(evaluationsApi.getSkuAccuracy)
const mockUseAuthStore = vi.mocked(authStore.useAuthStore)

const mockResponse: SkuAccuracyListResponse = {
  skuAccuracies: [],
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

// ── aiSkuAccuracyKeys cabinet-isolation ───────────────────────────────────────

describe('aiSkuAccuracyKeys', () => {
  it('different cabinetIds produce DIFFERENT bySku keys (no cache collision)', () => {
    const keyA = aiSkuAccuracyKeys.bySku('cab-A', 'model-1', null)
    const keyB = aiSkuAccuracyKeys.bySku('cab-B', 'model-1', null)
    expect(keyA).not.toEqual(keyB)
  })

  it('null cabinetId produces a key with null (unauthenticated state isolated)', () => {
    const key = aiSkuAccuracyKeys.bySku(null, 'model-1', null)
    expect(key).toContain(null)
  })

  it('same cabinetId + modelId + nmId produces identical keys (cache reuse)', () => {
    const keyA = aiSkuAccuracyKeys.bySku('cab-123', 'model-1', 42)
    const keyB = aiSkuAccuracyKeys.bySku('cab-123', 'model-1', 42)
    expect(keyA).toEqual(keyB)
  })

  it('bySku returns exact key shape [ai, sku-accuracy, cabinetId, modelId, nmId]', () => {
    expect(aiSkuAccuracyKeys.bySku('cab-1', 'model-X', 99)).toEqual([
      'ai',
      'sku-accuracy',
      'cab-1',
      'model-X',
      99,
    ])
  })

  it('different nmId values produce DIFFERENT keys (per-SKU isolation)', () => {
    const keyA = aiSkuAccuracyKeys.bySku('cab-1', 'model-1', 111)
    const keyB = aiSkuAccuracyKeys.bySku('cab-1', 'model-1', 222)
    expect(keyA).not.toEqual(keyB)
  })

  it('null nmId vs provided nmId produce different keys', () => {
    const keyA = aiSkuAccuracyKeys.bySku('cab-1', 'model-1', null)
    const keyB = aiSkuAccuracyKeys.bySku('cab-1', 'model-1', 42)
    expect(keyA).not.toEqual(keyB)
  })
})

// ── useAiSkuAccuracy enabled-gate + runtime isolation ────────────────────────

describe('useAiSkuAccuracy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) => selector({ cabinetId: 'cab-123' }))
    mockGetSkuAccuracy.mockResolvedValue(mockResponse)
  })

  it('fetches sku accuracy when cabinetId and modelId are present', async () => {
    const { result } = renderHook(() => useAiSkuAccuracy('model-1'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    // F-7: hook normalizes undefined → null at boundary; fetcher receives null not undefined
    expect(mockGetSkuAccuracy).toHaveBeenCalledWith({ modelId: 'model-1', nmId: null })
  })

  it('threads nmId to fetcher when provided', async () => {
    const { result } = renderHook(() => useAiSkuAccuracy('model-1', 12345), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetSkuAccuracy).toHaveBeenCalledWith({ modelId: 'model-1', nmId: 12345 })
  })

  it('query disabled when modelId is empty string', async () => {
    const { result } = renderHook(() => useAiSkuAccuracy(''), {
      wrapper: createWrapper(),
    })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGetSkuAccuracy).not.toHaveBeenCalled()
  })

  it('query disabled when cabinetId is null', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) => selector({ cabinetId: null }))
    const { result } = renderHook(() => useAiSkuAccuracy('model-1'), {
      wrapper: createWrapper(),
    })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGetSkuAccuracy).not.toHaveBeenCalled()
  })

  it('returns error state on fetch failure', async () => {
    mockGetSkuAccuracy.mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useAiSkuAccuracy('model-1'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('cabinet-isolation: different cabinetIds fire separate fetches (single shared QueryClient)', async () => {
    // WHY single QueryClient is required — see useAiEvaluations.test.ts F-4 comment for rationale.
    // Two separate QueryClients would make this test vacuously true regardless of queryKey shape.
    const sharedClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    })
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: sharedClient }, children)

    // Mount under cabinet A
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) => selector({ cabinetId: 'cab-A' }))
    const { result: resultA, unmount: unmountA } = renderHook(() => useAiSkuAccuracy('model-1'), {
      wrapper,
    })
    await waitFor(() => expect(resultA.current.isSuccess).toBe(true))
    const callsAfterA = mockGetSkuAccuracy.mock.calls.length
    unmountA()

    // Mount under cabinet B with SAME shared client — same cache, different cabinetId
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) => selector({ cabinetId: 'cab-B' }))
    const { result: resultB } = renderHook(() => useAiSkuAccuracy('model-1'), { wrapper })
    await waitFor(() => expect(resultB.current.isSuccess).toBe(true))
    const callsAfterB = mockGetSkuAccuracy.mock.calls.length

    // Cache miss required: cab-B key differs from cab-A → fresh fetch
    expect(callsAfterB).toBeGreaterThan(callsAfterA)
  })
})
