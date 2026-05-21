/**
 * useAiPreferences hook tests — success/loading/error/enabled-gate/cabinet-isolation.
 * Story 112.2-FE Task 1.
 * Cabinet-isolation: SINGLE shared QueryClient (Story 112.1 F-16 strengthened pattern).
 * Owner dual-gate: !!cabinetId && user?.role === 'Owner' (Story 112.1 F-3 precedent).
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAiPreferences, aiPreferencesKeys } from '../useAiPreferences'
import * as systemApi from '@/lib/api/ai/system'
import * as authStore from '@/stores/authStore'
import type { AiPreferences } from '@/types/ai/system'

vi.mock('@/lib/api/ai/system')
vi.mock('@/stores/authStore')

const mockGetAiPreferences = vi.mocked(systemApi.getAiPreferences)
const mockUseAuthStore = vi.mocked(authStore.useAuthStore)

const CABINET_ID = 'cab-123'
const PREFS_ENABLED: AiPreferences = { aiEnabled: true }
const PREFS_DISABLED: AiPreferences = { aiEnabled: false }

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

// ── aiPreferencesKeys cabinet-isolation ───────────────────────────────────────

describe('aiPreferencesKeys', () => {
  it('includes cabinetId in queryKey (cabinet-isolation discipline)', () => {
    expect(aiPreferencesKeys.byCabinet('cab-abc')).toEqual(['ai', 'preferences', 'cab-abc'])
  })

  it('handles null cabinetId', () => {
    expect(aiPreferencesKeys.byCabinet(null)).toEqual(['ai', 'preferences', null])
  })

  it('different cabinetIds produce DIFFERENT keys (no cache collision)', () => {
    expect(aiPreferencesKeys.byCabinet('cab-A')).not.toEqual(aiPreferencesKeys.byCabinet('cab-B'))
  })

  it('same cabinetId produces identical keys (cache reuse)', () => {
    expect(aiPreferencesKeys.byCabinet('cab-1')).toEqual(aiPreferencesKeys.byCabinet('cab-1'))
  })
})

// ── useAiPreferences ──────────────────────────────────────────────────────────

describe('useAiPreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: CABINET_ID, user: { role: 'Owner' } })
    )
    mockGetAiPreferences.mockResolvedValue(PREFS_ENABLED)
  })

  it('fetches preferences when Owner and cabinetId present', async () => {
    const { result } = renderHook(() => useAiPreferences(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(PREFS_ENABLED)
    expect(mockGetAiPreferences).toHaveBeenCalledOnce()
  })

  it('returns isLoading=true before fetch completes', () => {
    mockGetAiPreferences.mockImplementation(() => new Promise(() => {})) // never resolves
    const { result } = renderHook(() => useAiPreferences(), { wrapper: createWrapper() })
    expect(result.current.isLoading).toBe(true)
  })

  it('returns error state on fetch failure', async () => {
    // retry:1 → reject twice (initial + 1 retry) to reach error state
    mockGetAiPreferences.mockRejectedValueOnce(new Error('Network error'))
    mockGetAiPreferences.mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useAiPreferences(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
    expect(result.current.error).toBeTruthy()
  })

  it('enabled=false when user is not Owner (Manager)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: CABINET_ID, user: { role: 'Manager' } })
    )
    const { result } = renderHook(() => useAiPreferences(), { wrapper: createWrapper() })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGetAiPreferences).not.toHaveBeenCalled()
  })

  it('enabled=false when user is Analyst', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: CABINET_ID, user: { role: 'Analyst' } })
    )
    const { result } = renderHook(() => useAiPreferences(), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGetAiPreferences).not.toHaveBeenCalled()
  })

  it('enabled=false when cabinetId is null', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: null, user: { role: 'Owner' } })
    )
    const { result } = renderHook(() => useAiPreferences(), { wrapper: createWrapper() })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGetAiPreferences).not.toHaveBeenCalled()
  })

  it('queryKey isolation: cab-B query fetches DISTINCT data while cab-A sentinel survives', async () => {
    // WHY single QueryClient: a separate client would fetch even with the same key (empty cache).
    // Shared client proves queryKey uniqueness — different cabinetId → different cache slot.
    // NOTE: mutation-level cache-write isolation is tested in useUpdateAiPreferences.test.ts (F-8).
    const sharedClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    })
    // Pre-seed cab-A sentinel
    sharedClient.setQueryData(aiPreferencesKeys.byCabinet('cab-A'), PREFS_DISABLED)

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: sharedClient }, children)

    // cab-B returns distinct value
    mockGetAiPreferences.mockResolvedValue(PREFS_ENABLED)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-B', user: { role: 'Owner' } })
    )
    const { result } = renderHook(() => useAiPreferences(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // cab-A sentinel survives untouched
    const cabAData = sharedClient.getQueryData(
      aiPreferencesKeys.byCabinet('cab-A')
    ) as AiPreferences
    expect(cabAData).toEqual(PREFS_DISABLED)
    expect(cabAData.aiEnabled).toBe(false)

    // cab-B fetched distinct data — proves key was different AND fetch ran
    const cabBData = sharedClient.getQueryData(
      aiPreferencesKeys.byCabinet('cab-B')
    ) as AiPreferences
    expect(cabBData.aiEnabled).toBe(true)
  })
})
