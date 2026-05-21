/**
 * useResolveAnomaly — tests: success/error/403/invalidation/cabinet-isolation/hydration-race.
 * Story 112.3-FE Task 3.
 * AP#3: real ApiError constructor, mockRejectedValueOnce.
 * Cabinet-isolation: pre-seed cab-A cache → mutate → assert cab-A untouched.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useResolveAnomaly } from '../useResolveAnomaly'
import { anomaliesKeys } from '../useAnomalies'
import * as systemApi from '@/lib/api/ai/system'
import * as authStore from '@/stores/authStore'
import { ApiError } from '@/types/api'
import type { AnomalyListResponse } from '@/types/ai/system'

vi.mock('@/lib/api/ai/system')
vi.mock('@/stores/authStore')

const mockPatchAnomalyResolve = vi.mocked(systemApi.patchAnomalyResolve)
const mockUseAuthStore = vi.mocked(authStore.useAuthStore)

function createWrapper(queryClient?: QueryClient) {
  const client =
    queryClient ?? new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children)
}

const validInput = {
  anomalyId: 'anomaly-uuid-1',
  resolutionCause: 'seasonal' as const,
  resolutionNote: 'Holiday demand spike',
}

describe('useResolveAnomaly', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-123', user: { role: 'Owner' } })
    )
  })

  it('calls patchAnomalyResolve with correct args on mutate', async () => {
    mockPatchAnomalyResolve.mockResolvedValueOnce(undefined)
    const { result } = renderHook(() => useResolveAnomaly(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate(validInput)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockPatchAnomalyResolve).toHaveBeenCalledWith('anomaly-uuid-1', {
      resolutionCause: 'seasonal',
      resolutionNote: 'Holiday demand spike',
    })
  })

  it('works without resolutionNote (optional field)', async () => {
    mockPatchAnomalyResolve.mockResolvedValueOnce(undefined)
    const { result } = renderHook(() => useResolveAnomaly(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ anomalyId: 'anomaly-1', resolutionCause: 'other' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockPatchAnomalyResolve).toHaveBeenCalledWith('anomaly-1', {
      resolutionCause: 'other',
      resolutionNote: undefined,
    })
  })

  it('exposes error state on generic failure', async () => {
    mockPatchAnomalyResolve.mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useResolveAnomaly(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate(validInput)
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
  })

  it('exposes 403 ApiError on forbidden resolve — real ApiError constructor (AP#3)', async () => {
    // AP#3: use real ApiError constructor, NOT Object.assign(new Error(), { status })
    const forbidden = new ApiError('Forbidden', 403)
    mockPatchAnomalyResolve.mockRejectedValueOnce(forbidden)

    const { result } = renderHook(() => useResolveAnomaly(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate(validInput)
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(ApiError)
    expect((result.current.error as ApiError).status).toBe(403)
  })

  it('throws generic Error (not ApiError) when user is null without calling fetcher', async () => {
    // F-11 (Story 112.1-FE): null-vs-denied distinction — user===null is hydration race, not denial.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-123', user: null })
    )

    const { result } = renderHook(() => useResolveAnomaly(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate(validInput)
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    // Must be generic Error, NOT ApiError with status 403
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error).not.toBeInstanceOf(ApiError)
    expect(mockPatchAnomalyResolve).not.toHaveBeenCalled()
  })

  it('throws 403 ApiError when user role is Analyst (defense-in-depth)', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-123', user: { role: 'Analyst' } })
    )

    const { result } = renderHook(() => useResolveAnomaly(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate(validInput)
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(ApiError)
    expect((result.current.error as ApiError).status).toBe(403)
    expect(mockPatchAnomalyResolve).not.toHaveBeenCalled()
  })

  it('allows Manager role to mutate successfully (dual-role gate)', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-123', user: { role: 'Manager' } })
    )
    mockPatchAnomalyResolve.mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useResolveAnomaly(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate(validInput)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockPatchAnomalyResolve).toHaveBeenCalledOnce()
  })

  it('invalidates narrow anomalies queryKey on success (no prefix scope-creep)', async () => {
    mockPatchAnomalyResolve.mockResolvedValueOnce(undefined)
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useResolveAnomaly(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate(validInput)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Narrow invalidation: anomalies list ONLY — not ['ai'] prefix
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['ai', 'anomalies', 'cab-123'],
    })
    expect(invalidateSpy).toHaveBeenCalledTimes(1)
  })
})

// ── Cabinet-isolation behavioral test ─────────────────────────────────────────

describe('useResolveAnomaly cabinet-isolation (Story 97.5-FE + Story 112.2-FE F-8)', () => {
  it('cab-A sentinel survives after successful mutation as cab-B user', async () => {
    // gcTime: Infinity — prevents GC of inactive (cab-A) query between setQueryData and assertion.
    // Pattern from useAdminModels cabinet-isolation test (Story 112.1-FE F-16).
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    })

    // Spy on invalidateQueries to verify exact queryKey scoping (F-6 strengthening).
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    // Pre-seed cab-A sentinel in anomalies cache
    const cabAKey = anomaliesKeys.all('cab-A')
    const cabASentinel: AnomalyListResponse = { anomalies: [], total: 99, page: 1, limit: 20 }
    queryClient.setQueryData(cabAKey, cabASentinel)

    // Render hook as cab-B user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-B', user: { role: 'Owner' } })
    )
    mockPatchAnomalyResolve.mockResolvedValueOnce(undefined)

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useResolveAnomaly(), { wrapper })

    await act(async () => {
      result.current.mutate(validInput)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // F-6: exact queryKey assertion — only cab-B anomalies invalidated, never cab-A or broad prefix
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['ai', 'anomalies', 'cab-B'] })
    expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: ['ai'] })
    expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: ['ai', 'anomalies', 'cab-A'] })
    // F-4: exactly one invalidateQueries call — catches regressions where a second call
    // with a non-canonical key (e.g. ['ai', 'anomalies']) slips past the negative assertions.
    expect(invalidateSpy).toHaveBeenCalledTimes(1)

    // cab-A sentinel UNTOUCHED — cab-B invalidation only hits cab-B keys
    const cabAData = queryClient.getQueryData<AnomalyListResponse>(cabAKey)
    expect(cabAData?.total).toBe(99)
  })
})
