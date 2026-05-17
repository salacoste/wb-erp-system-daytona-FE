/**
 * useAiModels — cabinet-isolation regression tests.
 * Story 109.3-FE: asserts different cabinetIds produce different queryKeys
 * (prevents cross-cabinet cache collision — cabinet-isolation discipline, Story 97.5-FE).
 * Story 109.4-FE: polling option tests (AC-2).
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAiModels, aiModelsKeys } from '../useAiModels'
import * as modelsApi from '@/lib/api/ai/models'
import * as authStore from '@/stores/authStore'

vi.mock('@/lib/api/ai/models')
vi.mock('@/stores/authStore')

const mockGetAiModels = vi.mocked(modelsApi.getAiModels)
const mockUseAuthStore = vi.mocked(authStore.useAuthStore)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('aiModelsKeys', () => {
  it('different cabinetIds produce DIFFERENT list keys (no cache collision)', () => {
    const keyA = aiModelsKeys.list('cab-A')
    const keyB = aiModelsKeys.list('cab-B')
    expect(keyA).not.toEqual(keyB)
  })

  it('null cabinetId produces a key with null (unauthenticated state isolated)', () => {
    const key = aiModelsKeys.list(null)
    expect(key).toContain(null)
  })

  it('same cabinetId produces identical keys (cache reuse)', () => {
    const keyA = aiModelsKeys.list('cab-123')
    const keyB = aiModelsKeys.list('cab-123')
    expect(keyA).toEqual(keyB)
  })
})

// ── Polling option tests (AC-2, Story 109.4-FE) ───────────────────────────────

describe('useAiModels polling option', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) => selector({ cabinetId: 'cab-poll' }))
    mockGetAiModels.mockResolvedValue({ models: [] })
  })

  it('useAiModels() without options — query succeeds without refetchInterval set to 5000', async () => {
    // When polling is not requested, the hook should NOT poll (refetchInterval is false).
    // We verify the query completes successfully without any polling side-effects.
    const { result } = renderHook(() => useAiModels(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    // One fetch on mount — no additional polling fetches within test timeframe.
    expect(mockGetAiModels).toHaveBeenCalledTimes(1)
  })

  it('useAiModels({ polling: true }) — refetchInterval is 5_000 (query option verified)', async () => {
    // When polling is true, the hook passes refetchInterval: 5_000 to useQuery.
    // We verify this by spying on useQuery's options via the queryClient's observer.
    // Simpler: assert the option is correctly forwarded by confirming the hook
    // result still resolves (option is accepted) AND refetch occurs periodically.
    // For a unit test: we use vi.useFakeTimers to advance time and check refetch count.
    vi.useFakeTimers()
    const { result } = renderHook(() => useAiModels({ polling: true }), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    // First fetch: 1 call.
    expect(mockGetAiModels).toHaveBeenCalledTimes(1)

    // Advance past the 5s refetchInterval — should trigger a second fetch.
    vi.advanceTimersByTime(5_100)
    await waitFor(() => expect(mockGetAiModels).toHaveBeenCalledTimes(2))

    vi.useRealTimers()
  })
})
