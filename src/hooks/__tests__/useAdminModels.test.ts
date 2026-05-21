/**
 * useAdminModels — tests: success/loading/error/enabled-gate/cabinet-isolation.
 * Story 112.1-FE Task 1.
 * Cabinet-isolation: SINGLE shared QueryClient (Story 110.2-FE F-4 precedent).
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAdminModels, adminModelsKeys } from '../useAdminModels'
import * as adminApi from '@/lib/api/ai/admin'
import * as authStore from '@/stores/authStore'
import type { AdminModelListResponse } from '@/types/ai/admin'

vi.mock('@/lib/api/ai/admin')
vi.mock('@/stores/authStore')

const mockGetAdminModels = vi.mocked(adminApi.getAdminModels)
const mockUseAuthStore = vi.mocked(authStore.useAuthStore)

const mockResponse: AdminModelListResponse = {
  models: [],
  total: 0,
  page: 1,
  limit: 20,
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

// ── adminModelsKeys cabinet-isolation ─────────────────────────────────────────

describe('adminModelsKeys', () => {
  it('different cabinetIds produce DIFFERENT keys (no cache collision)', () => {
    const keyA = adminModelsKeys.filtered('cab-A', null, 1, 20)
    const keyB = adminModelsKeys.filtered('cab-B', null, 1, 20)
    expect(keyA).not.toEqual(keyB)
  })

  it('null cabinetId produces a key with null (unauthenticated state isolated)', () => {
    expect(adminModelsKeys.all(null)).toContain(null)
  })

  it('same inputs produce identical keys (cache reuse)', () => {
    const keyA = adminModelsKeys.filtered('cab-1', 'active', 2, 20)
    const keyB = adminModelsKeys.filtered('cab-1', 'active', 2, 20)
    expect(keyA).toEqual(keyB)
  })

  it('filtered key shape includes all params', () => {
    expect(adminModelsKeys.filtered('cab-1', 'active', 1, 20)).toEqual([
      'ai',
      'admin',
      'models',
      'cab-1',
      'active',
      1,
      20,
    ])
  })
})

// ── useAdminModels ─────────────────────────────────────────────────────────────

describe('useAdminModels', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-123', user: { role: 'Owner' } })
    )
    mockGetAdminModels.mockResolvedValue(mockResponse)
  })

  it('fetches models when cabinetId present and user is Owner', async () => {
    const { result } = renderHook(() => useAdminModels(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetAdminModels).toHaveBeenCalledOnce()
  })

  it('returns data on success', async () => {
    const { result } = renderHook(() => useAdminModels(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockResponse)
  })

  it('is idle (not loading) before fetch completes — loading state present', async () => {
    mockGetAdminModels.mockImplementation(() => new Promise(() => {})) // never resolves
    const { result } = renderHook(() => useAdminModels(), { wrapper: createWrapper() })
    // enabled=true → fetchStatus 'fetching', isLoading true
    expect(result.current.isLoading).toBe(true)
  })

  it('returns error state on fetch failure', async () => {
    // Hook sets retry:1, so reject twice (initial + one retry) to reach error state
    mockGetAdminModels.mockRejectedValueOnce(new Error('Network error'))
    mockGetAdminModels.mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useAdminModels(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
    expect(result.current.error).toBeTruthy()
  })

  it('enabled=false when user is not Owner', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-123', user: { role: 'Manager' } })
    )
    const { result } = renderHook(() => useAdminModels(), { wrapper: createWrapper() })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGetAdminModels).not.toHaveBeenCalled()
  })

  it('enabled=false when cabinetId is null', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: null, user: { role: 'Owner' } })
    )
    const { result } = renderHook(() => useAdminModels(), { wrapper: createWrapper() })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGetAdminModels).not.toHaveBeenCalled()
  })

  it('enabled=false when user is Analyst', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-123', user: { role: 'Analyst' } })
    )
    const { result } = renderHook(() => useAdminModels(), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGetAdminModels).not.toHaveBeenCalled()
  })

  it('F-4: different cabinetIds fire separate fetches (single shared QueryClient)', async () => {
    // WHY single QueryClient: if two separate clients were used, cab-B would fetch
    // even without cabinetId in the queryKey (empty cache). With one shared client,
    // only a distinct key causes a new fetch — proving real isolation.
    const sharedClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    })
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: sharedClient }, children)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-A', user: { role: 'Owner' } })
    )
    const { result: rA, unmount } = renderHook(() => useAdminModels(), { wrapper })
    await waitFor(() => expect(rA.current.isSuccess).toBe(true))
    const callsAfterA = mockGetAdminModels.mock.calls.length
    unmount()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-B', user: { role: 'Owner' } })
    )
    const { result: rB } = renderHook(() => useAdminModels(), { wrapper })
    await waitFor(() => expect(rB.current.isSuccess).toBe(true))
    const callsAfterB = mockGetAdminModels.mock.calls.length

    expect(callsAfterB).toBeGreaterThan(callsAfterA)
  })

  it('F-6/F-16: cab-B fetches DISTINCT data while cab-A sentinel survives (project-level isolation)', async () => {
    // Strengthened per F-16: assert cab-B data is DISTINCT (total=7), not just that
    // cab-A's sentinel (total=99) survives. Proves project-level isolation, not just
    // that TanStack uses separate queryKeys (which is a library guarantee, not a project one).
    const sharedClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    })
    const cabASentinel: AdminModelListResponse = { models: [], total: 99, page: 1, limit: 20 }
    sharedClient.setQueryData(adminModelsKeys.filtered('cab-A', null, 1, 20), cabASentinel)

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: sharedClient }, children)

    // cab-B returns distinct total=7
    mockGetAdminModels.mockResolvedValue({ models: [], total: 7, page: 1, limit: 20 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-B', user: { role: 'Owner' } })
    )
    const { result } = renderHook(() => useAdminModels({ status: undefined, page: 1, limit: 20 }), {
      wrapper,
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // cab-A sentinel survives untouched
    const cabAData = sharedClient.getQueryData(
      adminModelsKeys.filtered('cab-A', null, 1, 20)
    ) as AdminModelListResponse
    expect(cabAData).toEqual(cabASentinel)
    expect(cabAData.total).toBe(99)

    // cab-B fetched distinct data — proves the queryKey was different AND the fetch ran
    const cabBData = sharedClient.getQueryData(
      adminModelsKeys.filtered('cab-B', null, 1, 20)
    ) as AdminModelListResponse
    expect(cabBData.total).toBe(7)
  })
})
