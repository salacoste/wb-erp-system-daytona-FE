/**
 * useModelRollback — tests: success/error/403/invalidation/cabinet-isolation.
 * Story 112.1-FE Task 2.
 * AP#3: real ApiError constructor, mockRejectedValueOnce.
 * Cabinet-isolation: pre-seed cab-A cache → mutate cab-B → cab-A untouched.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useModelRollback } from '../useModelRollback'
import * as adminApi from '@/lib/api/ai/admin'
import * as authStore from '@/stores/authStore'
import { ApiError } from '@/types/api'

vi.mock('@/lib/api/ai/admin')
vi.mock('@/stores/authStore')

const mockPatchModelRollback = vi.mocked(adminApi.patchModelRollback)
const mockUseAuthStore = vi.mocked(authStore.useAuthStore)

function createWrapper(queryClient?: QueryClient) {
  const client =
    queryClient ?? new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children)
}

describe('useModelRollback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-123', user: { role: 'Owner' } })
    )
  })

  it('calls patchModelRollback with correct args on mutate', async () => {
    mockPatchModelRollback.mockResolvedValueOnce(undefined)
    const { result } = renderHook(() => useModelRollback(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ modelId: 'model-1', reason: 'MAPE degraded to 45%' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockPatchModelRollback).toHaveBeenCalledWith('model-1', {
      reason: 'MAPE degraded to 45%',
    })
  })

  it('exposes error state on fetch failure', async () => {
    mockPatchModelRollback.mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useModelRollback(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ modelId: 'model-1', reason: 'test reason here' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('exposes 403 ApiError on forbidden rollback — real ApiError constructor (AP#3)', async () => {
    // AP#3: use real ApiError constructor, NOT Object.assign(new Error(), { status })
    const forbidden = new ApiError('Forbidden', 403)
    mockPatchModelRollback.mockRejectedValueOnce(forbidden)

    const { result } = renderHook(() => useModelRollback(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ modelId: 'model-1', reason: 'test reason here' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(ApiError)
    expect((result.current.error as ApiError).status).toBe(403)
  })

  it('invalidates admin + public model queryKeys on success (F-2: prefix-match is intentional)', async () => {
    mockPatchModelRollback.mockResolvedValueOnce(undefined)
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useModelRollback(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ modelId: 'model-1', reason: 'test reason here' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Admin models list cache invalidated (this page)
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['ai', 'admin', 'models', 'cab-123'],
    })
    // Public models list cache invalidated — rollback affects all forecast outputs
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['ai', 'models', 'cab-123'],
    })
  })

  it('F-11: mutate() with user===null throws generic Error (not 403 ApiError) without calling fetcher', async () => {
    // Differentiates "auth not yet hydrated" from "explicitly denied" (F-3).
    // authStore initial state is null (User | null per authStore.ts:39), not undefined.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-123', user: null })
    )

    const { result } = renderHook(() => useModelRollback(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ modelId: 'model-1', reason: 'should be blocked' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    // Fetcher must NOT have been called
    expect(mockPatchModelRollback).not.toHaveBeenCalled()

    // Must be a generic Error, NOT an ApiError (so UI doesn't show "Доступ запрещён")
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error).not.toBeInstanceOf(ApiError)
  })

  it('F-3: non-Owner mutate() rejects with 403 ApiError WITHOUT calling fetcher', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-123', user: { role: 'Manager' } })
    )

    const { result } = renderHook(() => useModelRollback(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ modelId: 'model-1', reason: 'should be blocked' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    // Fetcher must NOT have been called — guard fires before network
    expect(mockPatchModelRollback).not.toHaveBeenCalled()

    // Error must be a real ApiError with status 403 (AP#3 pattern)
    expect(result.current.error).toBeInstanceOf(ApiError)
    expect((result.current.error as ApiError).status).toBe(403)
  })

  it('cabinet-isolation: mutating cab-B does not disturb cab-A cache', async () => {
    mockPatchModelRollback.mockResolvedValueOnce(undefined)

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    })
    // Pre-seed cab-A cache with sentinel data
    const sentinelData = { models: [], total: 99, page: 1, limit: 20 }
    queryClient.setQueryData(['ai', 'admin', 'models', 'cab-A'], sentinelData)

    // Mount under cab-B
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-B', user: { role: 'Owner' } })
    )

    const { result } = renderHook(() => useModelRollback(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ modelId: 'model-1', reason: 'reason for cab-B rollback' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // cab-A cache must remain untouched
    const cabACache = queryClient.getQueryData(['ai', 'admin', 'models', 'cab-A'])
    expect(cabACache).toEqual(sentinelData)
  })
})
