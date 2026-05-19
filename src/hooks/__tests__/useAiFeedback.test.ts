/**
 * useAiFeedback mutation hook tests — Story 110.4-FE.
 * Covers: success path, error path, cache invalidation with/without modelId,
 * cabinet-isolation (single shared QueryClient — Story 110.2-FE F-4 pattern).
 * 1st-pass review fixes (2026-05-19):
 *   F-1: when modelId absent, invalidates ['ai', 'forecast'] key (narrowed from ['ai'] root to avoid
 *        cache-scope-creep across 9 unrelated AI hooks).
 *   F-6: behavioral cache-collision test — pre-seed cab-A, mutate as cab-B, assert cab-A survives.
 * 2nd-pass review fixes (2026-05-19):
 *   F-1: test updated to assert ['ai', 'forecast'] (not ['ai']) matching the narrowed invalidation.
 *   F-2: replaced tautological spy-based isolation test with data-persistence test using gcTime:Infinity.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAiFeedback } from '../useAiFeedback'
import * as systemApi from '@/lib/api/ai/system'
import * as authStore from '@/stores/authStore'
import { ApiError } from '@/types/api'

vi.mock('@/lib/api/ai/system')
vi.mock('@/stores/authStore')

const mockPostFeedback = vi.mocked(systemApi.postFeedback)
const mockUseAuthStore = vi.mocked(authStore.useAuthStore)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return {
    queryClient,
    wrapper: ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children),
  }
}

describe('useAiFeedback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) => selector({ cabinetId: 'cab-1' }))
    mockPostFeedback.mockResolvedValue(undefined)
  })

  it('success: calls postFeedback with correct forecastId + feedbackType', async () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useAiFeedback(), { wrapper })

    act(() => {
      result.current.mutate({ forecastId: 'fc-123', feedbackType: 'thumbs_up' })
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockPostFeedback).toHaveBeenCalledWith({
      forecastId: 'fc-123',
      feedbackType: 'thumbs_up',
    })
  })

  it('success: thumbs_down variant passes correct feedbackType', async () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useAiFeedback(), { wrapper })

    act(() => {
      result.current.mutate({ forecastId: 'fc-456', feedbackType: 'thumbs_down' })
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockPostFeedback).toHaveBeenCalledWith({
      forecastId: 'fc-456',
      feedbackType: 'thumbs_down',
    })
  })

  it('error: mutation.error populated when fetcher rejects', async () => {
    const apiErr = new ApiError('Bad request', 400, { message: 'invalid forecastId' })
    mockPostFeedback.mockRejectedValueOnce(apiErr)

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useAiFeedback(), { wrapper })

    act(() => {
      result.current.mutate({ forecastId: 'bad-id', feedbackType: 'thumbs_up' })
    })
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBe(apiErr)
  })

  it('invalidateQueries called TWICE when modelId is provided', async () => {
    const { wrapper, queryClient } = createWrapper()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useAiFeedback(), { wrapper })

    act(() => {
      result.current.mutate({ forecastId: 'fc-789', feedbackType: 'thumbs_up', modelId: 'mod-1' })
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidate).toHaveBeenCalledTimes(2)
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ['ai', 'evaluations', 'cab-1', 'mod-1'],
    })
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ['ai', 'sku-accuracy', 'cab-1', 'mod-1'],
    })
  })

  // F-1: when modelId absent, invalidates ['ai', 'forecast'] (narrowed — avoids scope-creep
  // across 9 unrelated AI hooks that share the ['ai'] prefix).
  it("invalidateQueries called with ['ai', 'forecast'] key when modelId is absent", async () => {
    const { wrapper, queryClient } = createWrapper()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useAiFeedback(), { wrapper })

    act(() => {
      result.current.mutate({ forecastId: 'fc-no-model', feedbackType: 'thumbs_down' })
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidate).toHaveBeenCalledOnce()
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['ai', 'forecast'] })
  })

  it('cabinet-isolation: different cabinetIds produce different invalidation keys (single shared QueryClient)', async () => {
    // WHY single QueryClient: separate clients would pass vacuously (separate caches never collide).
    // With a shared client and cabinet-scoped keys, switching cabinetId changes the key → different invalidation.
    const sharedClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
    })
    const invalidate = vi.spyOn(sharedClient, 'invalidateQueries')
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: sharedClient }, children)

    // Cabinet A
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) => selector({ cabinetId: 'cab-A' }))
    const { result: resultA, unmount: unmountA } = renderHook(() => useAiFeedback(), { wrapper })
    act(() => {
      resultA.current.mutate({ forecastId: 'fc-1', feedbackType: 'thumbs_up', modelId: 'mod-X' })
    })
    await waitFor(() => expect(resultA.current.isSuccess).toBe(true))
    unmountA()

    // Cabinet B — same shared client
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) => selector({ cabinetId: 'cab-B' }))
    const { result: resultB } = renderHook(() => useAiFeedback(), { wrapper })
    act(() => {
      resultB.current.mutate({ forecastId: 'fc-2', feedbackType: 'thumbs_down', modelId: 'mod-X' })
    })
    await waitFor(() => expect(resultB.current.isSuccess).toBe(true))

    // cab-A invalidations use 'cab-A', cab-B use 'cab-B' — 4 total (2 per run × 2 runs)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['ai', 'evaluations', 'cab-A', 'mod-X'] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['ai', 'sku-accuracy', 'cab-A', 'mod-X'] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['ai', 'evaluations', 'cab-B', 'mod-X'] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['ai', 'sku-accuracy', 'cab-B', 'mod-X'] })
    expect(invalidate).toHaveBeenCalledTimes(4)
  })

  // F-2 (2nd-pass): data-persistence isolation test — cab-B mutation must NOT invalidate cab-A's cache.
  // Uses gcTime:Infinity so cab-A's cache entry survives after the hook unmounts, then asserts
  // it is still fresh (not invalidated) after cab-B's mutation. Replaces tautological spy test
  // that only mutated as cab-B and circularly asserted cab-A was never called.
  it('isolates cache: invalidation under cab-B does NOT invalidate cab-A entries', async () => {
    const sharedClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
    })

    // Pre-seed cab-A's evaluations cache entry
    sharedClient.setQueryData(['ai', 'evaluations', 'cab-A', 'model-X'], { sentinel: 'A' })

    // Mutate as cab-B for the same modelId
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) => selector({ cabinetId: 'cab-B' }))
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: sharedClient }, children)

    const { result } = renderHook(() => useAiFeedback(), { wrapper })
    act(() => {
      result.current.mutate({ forecastId: 'f1', feedbackType: 'thumbs_up', modelId: 'model-X' })
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Assert cab-A's cache entry is still fresh (not invalidated by cab-B's mutation)
    const state = sharedClient.getQueryState(['ai', 'evaluations', 'cab-A', 'model-X'])
    expect(state?.isInvalidated).toBe(false)
    expect(state?.data).toEqual({ sentinel: 'A' })
  })
})
