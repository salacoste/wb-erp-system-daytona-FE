/**
 * useAnomalies — tests: success/loading/error/enabled-gate/cabinet-isolation.
 * Story 112.3-FE Task 3.
 * Cabinet-isolation: SINGLE shared QueryClient (Story 110.2-FE F-4 precedent).
 * Dual-role gate: Owner AND Manager enabled; Analyst and Service disabled.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAnomalies, anomaliesKeys } from '../useAnomalies'
import * as systemApi from '@/lib/api/ai/system'
import * as authStore from '@/stores/authStore'
import type { AnomalyListResponse } from '@/types/ai/system'

vi.mock('@/lib/api/ai/system')
vi.mock('@/stores/authStore')

const mockGetAnomalies = vi.mocked(systemApi.getAnomalies)
const mockUseAuthStore = vi.mocked(authStore.useAuthStore)

const emptyResponse: AnomalyListResponse = {
  anomalies: [],
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

// ── anomaliesKeys cabinet-isolation ───────────────────────────────────────────

describe('anomaliesKeys', () => {
  it('different cabinetIds produce DIFFERENT keys (no cache collision)', () => {
    const keyA = anomaliesKeys.filtered('cab-A', null, 1, 20)
    const keyB = anomaliesKeys.filtered('cab-B', null, 1, 20)
    expect(keyA).not.toEqual(keyB)
  })

  it('null cabinetId produces a key with null (unauthenticated state isolated)', () => {
    expect(anomaliesKeys.all(null)).toContain(null)
  })

  it('same inputs produce identical keys (cache reuse)', () => {
    const keyA = anomaliesKeys.filtered('cab-1', 'pending', 2, 20)
    const keyB = anomaliesKeys.filtered('cab-1', 'pending', 2, 20)
    expect(keyA).toEqual(keyB)
  })

  it('filtered key shape includes all params', () => {
    expect(anomaliesKeys.filtered('cab-1', 'pending', 1, 20)).toEqual([
      'ai',
      'anomalies',
      'cab-1',
      'pending',
      1,
      20,
    ])
  })

  it('null status serializes correctly in key (no-filter state)', () => {
    expect(anomaliesKeys.filtered('cab-1', null, 1, 20)).toEqual([
      'ai',
      'anomalies',
      'cab-1',
      null,
      1,
      20,
    ])
  })
})

// ── useAnomalies ──────────────────────────────────────────────────────────────

describe('useAnomalies', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-123', user: { role: 'Owner' } })
    )
    mockGetAnomalies.mockResolvedValue(emptyResponse)
  })

  it('fetches anomalies when cabinetId present and user is Owner', async () => {
    const { result } = renderHook(() => useAnomalies(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetAnomalies).toHaveBeenCalledOnce()
  })

  it('fetches anomalies when user is Manager (dual-role gate)', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-123', user: { role: 'Manager' } })
    )
    const { result } = renderHook(() => useAnomalies(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetAnomalies).toHaveBeenCalledOnce()
  })

  it('returns data on success', async () => {
    const { result } = renderHook(() => useAnomalies(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(emptyResponse)
  })

  it('is loading before fetch completes', async () => {
    mockGetAnomalies.mockImplementation(() => new Promise(() => {})) // never resolves
    const { result } = renderHook(() => useAnomalies(), { wrapper: createWrapper() })
    expect(result.current.isLoading).toBe(true)
  })

  it('returns error state on fetch failure', async () => {
    mockGetAnomalies.mockRejectedValueOnce(new Error('Network error'))
    mockGetAnomalies.mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useAnomalies(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
    expect(result.current.error).toBeTruthy()
  })

  it('enabled=false when user is Analyst (not Owner or Manager)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-123', user: { role: 'Analyst' } })
    )
    const { result } = renderHook(() => useAnomalies(), { wrapper: createWrapper() })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGetAnomalies).not.toHaveBeenCalled()
  })

  it('enabled=false when user is Service (not Owner or Manager)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-123', user: { role: 'Service' } })
    )
    const { result } = renderHook(() => useAnomalies(), { wrapper: createWrapper() })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGetAnomalies).not.toHaveBeenCalled()
  })

  it('enabled=false when cabinetId is null', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: null, user: { role: 'Owner' } })
    )
    const { result } = renderHook(() => useAnomalies(), { wrapper: createWrapper() })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGetAnomalies).not.toHaveBeenCalled()
  })

  it('passes status filter param to getAnomalies', async () => {
    const { result } = renderHook(() => useAnomalies({ status: 'pending' }), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetAnomalies).toHaveBeenCalledWith({ status: 'pending' })
  })
})

// ── Cabinet-isolation behavioral test ─────────────────────────────────────────

describe('useAnomalies cabinet-isolation (Story 97.5-FE + Story 112.1-FE F-16)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('cab-A sentinel survives after cab-B is fetched (single shared QueryClient)', async () => {
    // gcTime: Infinity — prevents GC of inactive (cab-A) query between setQueryData and assertion.
    // Pattern from useAdminModels cabinet-isolation test (Story 112.1-FE F-16).
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    })

    // Pre-seed cab-A sentinel
    const cabAKey = anomaliesKeys.filtered('cab-A', null, 1, 20)
    const cabASentinel: AnomalyListResponse = { anomalies: [], total: 99, page: 1, limit: 20 }
    queryClient.setQueryData(cabAKey, cabASentinel)

    // Mock cab-B distinct response
    const cabBResponse: AnomalyListResponse = { anomalies: [], total: 42, page: 1, limit: 20 }
    mockGetAnomalies.mockResolvedValue(cabBResponse)

    // Render hook as cab-B user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-B', user: { role: 'Owner' } })
    )

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useAnomalies(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // F-7: only cab-B observer triggered fetches — pre-seeded cab-A cache did NOT refetch.
    // Exactly one call: the single cab-B hook invocation. Pre-seeded cab-A never triggers a fetch.
    expect(mockGetAnomalies).toHaveBeenCalledOnce()
    // Verify cab-A's cached sentinel data survives unchanged after cab-B fetch (no cross-cabinet cache write)
    const cabAData = queryClient.getQueryData<AnomalyListResponse>(cabAKey)
    expect(cabAData).toEqual({ anomalies: [], total: 99, page: 1, limit: 20 })

    // cab-B sees its distinct data
    expect(result.current.data?.total).toBe(42)
  })
})
