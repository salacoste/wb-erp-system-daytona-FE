/**
 * useAiPreferences + useUpdateAiPreferences Hook Tests
 * Story 108.2-FE: AI Preferences per-cabinet hook.
 *
 * Verifies: queryKey includes cabinetId, optimistic update, rollback on error.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAiPreferences, useUpdateAiPreferences, aiPreferencesKeys } from '../useAiPreferences'
import * as systemApi from '@/lib/api/ai/system'
import * as authStore from '@/stores/authStore'
import type { AiPreferences } from '@/types/ai/system'

vi.mock('@/lib/api/ai/system')
vi.mock('@/stores/authStore')

const mockGetAiPreferences = vi.mocked(systemApi.getAiPreferences)
const mockPatchAiPreferences = vi.mocked(systemApi.patchAiPreferences)
const mockUseAuthStore = vi.mocked(authStore.useAuthStore)

const CABINET_ID = 'cab-123'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('aiPreferencesKeys', () => {
  it('includes cabinetId in queryKey (cabinet-isolation discipline)', () => {
    const key = aiPreferencesKeys.byCabinet('cab-abc')
    expect(key).toEqual(['ai', 'preferences', 'cab-abc'])
  })

  it('handles null cabinetId', () => {
    const key = aiPreferencesKeys.byCabinet(null)
    expect(key).toEqual(['ai', 'preferences', null])
  })
})

describe('useAiPreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) => selector({ cabinetId: CABINET_ID }))
  })

  it('fetches preferences when cabinetId is set', async () => {
    const prefs: AiPreferences = { aiEnabled: true }
    mockGetAiPreferences.mockResolvedValueOnce(prefs)
    const { result } = renderHook(() => useAiPreferences(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(prefs)
  })

  it('is disabled when cabinetId is null', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) => selector({ cabinetId: null }))
    const { result } = renderHook(() => useAiPreferences(), { wrapper: createWrapper() })
    // Should remain in idle/pending state — never fetches
    expect(result.current.isPending).toBe(true)
    expect(mockGetAiPreferences).not.toHaveBeenCalled()
  })
})

describe('useUpdateAiPreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) => selector({ cabinetId: CABINET_ID }))
  })

  it('applies optimistic update before server response', async () => {
    const initial: AiPreferences = { aiEnabled: true }
    const updated: AiPreferences = { aiEnabled: false }

    mockGetAiPreferences.mockResolvedValue(initial)
    // Slow mutation — stays pending long enough to observe optimistic state
    mockPatchAiPreferences.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(updated), 200))
    )

    const wrapper = createWrapper()
    const { result: queryResult } = renderHook(() => useAiPreferences(), { wrapper })
    await waitFor(() => expect(queryResult.current.isSuccess).toBe(true))

    const { result: mutateResult } = renderHook(() => useUpdateAiPreferences(), { wrapper })

    act(() => {
      mutateResult.current.mutate(updated)
    })

    // Optimistic update applied synchronously
    await waitFor(() => expect(queryResult.current.data?.aiEnabled).toBe(false))
  })

  it('rolls back optimistic update on error', async () => {
    const initial: AiPreferences = { aiEnabled: true }
    const updated: AiPreferences = { aiEnabled: false }

    mockGetAiPreferences.mockResolvedValue(initial)
    mockPatchAiPreferences.mockRejectedValueOnce(new Error('server error'))

    const wrapper = createWrapper()
    const { result: queryResult } = renderHook(() => useAiPreferences(), { wrapper })
    await waitFor(() => expect(queryResult.current.isSuccess).toBe(true))

    const { result: mutateResult } = renderHook(() => useUpdateAiPreferences(), { wrapper })

    act(() => {
      mutateResult.current.mutate(updated)
    })

    // Wait for mutation to fail and rollback to complete
    await waitFor(() => expect(mutateResult.current.isError).toBe(true))
    // After rollback, data should be restored to initial
    await waitFor(() => expect(queryResult.current.data?.aiEnabled).toBe(true))
  })
})
