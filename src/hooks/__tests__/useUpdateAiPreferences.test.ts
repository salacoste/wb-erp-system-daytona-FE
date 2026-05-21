/**
 * useUpdateAiPreferences mutation hook tests.
 * Story 112.2-FE Task 2.
 * AP#3: mockRejectedValueOnce + real ApiError constructor.
 * Two-layer Owner-role guard pattern (Story 112.1 F-3 + F-11).
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useUpdateAiPreferences } from '../useUpdateAiPreferences'
import { aiPreferencesKeys } from '../useAiPreferences'
import * as systemApi from '@/lib/api/ai/system'
import * as authStore from '@/stores/authStore'
import { ApiError } from '@/types/api'
import type { AiPreferences } from '@/types/ai/system'

vi.mock('@/lib/api/ai/system')
vi.mock('@/stores/authStore')

const mockPatchAiPreferences = vi.mocked(systemApi.patchAiPreferences)
const mockUseAuthStore = vi.mocked(authStore.useAuthStore)

const CABINET_ID = 'cab-123'
const PREFS_ENABLED: AiPreferences = { aiEnabled: true }
const PREFS_DISABLED: AiPreferences = { aiEnabled: false }

function createWrapper(queryClient?: QueryClient) {
  const qc =
    queryClient ?? new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

describe('useUpdateAiPreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: CABINET_ID, user: { role: 'Owner' } })
    )
  })

  it('calls patchAiPreferences and resolves on success', async () => {
    mockPatchAiPreferences.mockResolvedValueOnce(PREFS_DISABLED)
    const { result } = renderHook(() => useUpdateAiPreferences(), { wrapper: createWrapper() })
    act(() => {
      result.current.mutate({ aiEnabled: false })
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockPatchAiPreferences).toHaveBeenCalledWith({ aiEnabled: false })
  })

  it('updates query cache (setQueryData) on success with server response', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })
    // Pre-seed cache with initial value
    qc.setQueryData(aiPreferencesKeys.byCabinet(CABINET_ID), PREFS_ENABLED)
    mockPatchAiPreferences.mockResolvedValueOnce(PREFS_DISABLED)

    const { result } = renderHook(() => useUpdateAiPreferences(), {
      wrapper: createWrapper(qc),
    })
    act(() => {
      result.current.mutate({ aiEnabled: false })
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Cache should now reflect server response
    const cached = qc.getQueryData(aiPreferencesKeys.byCabinet(CABINET_ID)) as AiPreferences
    expect(cached.aiEnabled).toBe(false)
  })

  it('returns error state on generic fetch failure', async () => {
    // AP#3: mockRejectedValueOnce (not mockRejectedValue)
    mockPatchAiPreferences.mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useUpdateAiPreferences(), { wrapper: createWrapper() })
    act(() => {
      result.current.mutate({ aiEnabled: false })
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
  })

  it('throws ApiError(403) for non-Owner user (role guard)', async () => {
    // AP#3: real ApiError constructor — not plain Error
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: CABINET_ID, user: { role: 'Manager' } })
    )
    const { result } = renderHook(() => useUpdateAiPreferences(), { wrapper: createWrapper() })
    act(() => {
      result.current.mutate({ aiEnabled: false })
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(ApiError)
    expect((result.current.error as ApiError).status).toBe(403)
    // Fetcher must NOT have been called (guard fired before patchAiPreferences)
    expect(mockPatchAiPreferences).not.toHaveBeenCalled()
  })

  it('throws generic Error (not ApiError) when user===null (hydration race)', async () => {
    // F-11: user===null means auth store initial state, not explicitly denied.
    // Must throw generic Error so form shows skeleton, not "Нет доступа" message.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: CABINET_ID, user: null })
    )
    const { result } = renderHook(() => useUpdateAiPreferences(), { wrapper: createWrapper() })
    act(() => {
      result.current.mutate({ aiEnabled: false })
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    // Must be generic Error, NOT ApiError
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error).not.toBeInstanceOf(ApiError)
    // Fetcher must NOT have been called
    expect(mockPatchAiPreferences).not.toHaveBeenCalled()
  })

  // 1st-pass review F-6: cabinetId null guard must throw generic Error (no cache pollution at null key)
  it('throws generic Error when cabinetId is null (no cache pollution at null key)', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: null, user: { role: 'Owner' } })
    )
    const { result } = renderHook(() => useUpdateAiPreferences(), { wrapper: createWrapper() })
    act(() => {
      result.current.mutate({ aiEnabled: false })
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error).not.toBeInstanceOf(ApiError)
    // Fetcher must NOT have been called — guard fired before patchAiPreferences
    expect(mockPatchAiPreferences).not.toHaveBeenCalled()
  })

  // 1st-pass review F-8: onSuccess setQueryData must be cabinet-scoped (cab-B must not overwrite cab-A)
  it('cab-B mutation does NOT overwrite cab-A preferences (cache-write isolation)', async () => {
    // WHY: onSuccess calls setQueryData(byCabinet(cabinetId), ...) — must use the CORRECT cabinetId.
    // Proves mutation cache write is cabinet-scoped and doesn't pollute sibling cabinet slots.
    const sharedClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    })
    const cabASentinel: AiPreferences = { aiEnabled: true }
    sharedClient.setQueryData(aiPreferencesKeys.byCabinet('cab-A'), cabASentinel)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-B', user: { role: 'Owner' } })
    )
    mockPatchAiPreferences.mockResolvedValueOnce(PREFS_DISABLED)

    const { result } = renderHook(() => useUpdateAiPreferences(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: sharedClient }, children),
    })
    act(() => {
      result.current.mutate({ aiEnabled: false })
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // cab-A sentinel untouched — mutation targeted cab-B only
    expect(sharedClient.getQueryData(aiPreferencesKeys.byCabinet('cab-A'))).toEqual(cabASentinel)
    // cab-B cache updated with server response
    expect(sharedClient.getQueryData(aiPreferencesKeys.byCabinet('cab-B'))).toEqual(PREFS_DISABLED)
  })
})
