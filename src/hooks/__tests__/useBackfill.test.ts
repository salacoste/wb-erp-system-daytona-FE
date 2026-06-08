/**
 * Unit tests for useBackfill hooks (useBackfillStatus, useCanAccessBackfill)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useBackfillStatus, useCanAccessBackfill } from '../useBackfill'

vi.mock('@/lib/api/backfill', () => ({
  getBackfillStatus: vi.fn(),
  startBackfill: vi.fn(),
  pauseBackfill: vi.fn(),
  resumeBackfill: vi.fn(),
  backfillQueryKeys: {
    all: ['backfill'] as const,
    status: () => ['backfill', 'status'] as const,
    cabinet: (id: string) => ['backfill', 'cabinet', id] as const,
  },
}))

vi.mock('@/lib/backfill-utils', () => ({
  isBackfillActive: vi.fn(),
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn() },
}))

import { getBackfillStatus } from '@/lib/api/backfill'
import { isBackfillActive } from '@/lib/backfill-utils'
import { useAuthStore } from '@/stores/authStore'
const mockGetStatus = vi.mocked(getBackfillStatus)
const mockIsActive = vi.mocked(isBackfillActive)
const mockAuthStore = vi.mocked(useAuthStore)

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

const mockStatusResponse = [
  {
    cabinet_id: 'cab-001',
    cabinet_name: 'Main Cabinet',
    status: 'completed',
    analytics_status: 'completed',
    data_source: 'api',
    oldest_available_date: '2025-01-01',
    newest_available_date: '2026-01-01',
    progress: {
      total_days: 365,
      completed_days: 365,
      current_date: null,
      percentage: 100,
      estimated_remaining_seconds: null,
    },
    last_error: null,
    started_at: '2026-01-01T00:00:00Z',
    completed_at: '2026-01-01T10:00:00Z',
    updated_at: '2026-01-01T10:00:00Z',
  },
  {
    cabinet_id: 'cab-002',
    cabinet_name: 'Second Cabinet',
    status: 'in_progress',
    analytics_status: 'pending',
    data_source: 'api',
    oldest_available_date: null,
    newest_available_date: null,
    progress: {
      total_days: 365,
      completed_days: 180,
      current_date: '2025-07-01',
      percentage: 49,
      estimated_remaining_seconds: 1800,
    },
    last_error: null,
    started_at: '2026-01-02T00:00:00Z',
    completed_at: null,
    updated_at: '2026-01-02T05:00:00Z',
  },
]

describe('useBackfillStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthStore.mockReturnValue({
      user: { role: 'Owner', id: 'user-1', email: 'test@test.com', name: 'Test' },
    } as ReturnType<typeof useAuthStore>)
  })

  it('fetches backfill status for Owner role', async () => {
    mockGetStatus.mockResolvedValueOnce(
      mockStatusResponse as Awaited<ReturnType<typeof getBackfillStatus>>
    )

    const { result } = renderHook(() => useBackfillStatus(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(2)
    expect(result.current.data?.[0].cabinet_id).toBe('cab-001')
  })

  it('computes hasActiveBackfills from status data', async () => {
    mockIsActive.mockImplementation((status: string) => status === 'in_progress')
    mockGetStatus.mockResolvedValueOnce(
      mockStatusResponse as Awaited<ReturnType<typeof getBackfillStatus>>
    )

    const { result } = renderHook(() => useBackfillStatus(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.hasActiveBackfills).toBe(true)
  })

  it('hasActiveBackfills is false when all completed', async () => {
    mockIsActive.mockReturnValue(false)
    mockGetStatus.mockResolvedValueOnce([mockStatusResponse[0]] as Awaited<
      ReturnType<typeof getBackfillStatus>
    >)

    const { result } = renderHook(() => useBackfillStatus(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.hasActiveBackfills).toBe(false)
  })

  it('is disabled for non-Owner role', () => {
    mockAuthStore.mockReturnValue({
      user: { role: 'Analyst', id: 'user-2', email: 'analyst@test.com' },
    } as ReturnType<typeof useAuthStore>)

    const { result } = renderHook(() => useBackfillStatus(), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('is disabled when enabled option is false', () => {
    const { result } = renderHook(() => useBackfillStatus({ enabled: false }), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('handles API error', async () => {
    mockGetStatus.mockRejectedValue(new Error('Server error'))

    const { result } = renderHook(() => useBackfillStatus(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
    expect(result.current.error?.message).toBe('Server error')
  })

  it('handles null user gracefully', () => {
    mockAuthStore.mockReturnValue({ user: null } as unknown as ReturnType<typeof useAuthStore>)

    const { result } = renderHook(() => useBackfillStatus(), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useCanAccessBackfill', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns true for Owner role', () => {
    mockAuthStore.mockReturnValue({
      user: { role: 'Owner', id: 'user-1', email: 'test@test.com' },
    } as ReturnType<typeof useAuthStore>)

    const { result } = renderHook(() => useCanAccessBackfill(), { wrapper: createWrapper() })

    expect(result.current.canAccessBackfill).toBe(true)
    expect(result.current.userRole).toBe('Owner')
  })

  it('returns false for Manager role', () => {
    mockAuthStore.mockReturnValue({
      user: { role: 'Manager', id: 'user-2', email: 'mgr@test.com' },
    } as ReturnType<typeof useAuthStore>)

    const { result } = renderHook(() => useCanAccessBackfill(), { wrapper: createWrapper() })

    expect(result.current.canAccessBackfill).toBe(false)
    expect(result.current.userRole).toBe('Manager')
  })

  it('returns false for null user', () => {
    mockAuthStore.mockReturnValue({ user: null } as unknown as ReturnType<typeof useAuthStore>)

    const { result } = renderHook(() => useCanAccessBackfill(), { wrapper: createWrapper() })

    expect(result.current.canAccessBackfill).toBe(false)
    expect(result.current.userRole).toBeNull()
  })
})
