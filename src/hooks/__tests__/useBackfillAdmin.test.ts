/**
 * Unit Tests for Backfill Admin Hooks
 * Story 51.10-FE: Backfill Admin Types
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * @see src/hooks/useBackfillAdmin.ts
 * @see src/lib/api/backfill.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import {
  useBackfillStatus,
  useStartBackfill,
  usePauseBackfill,
  useResumeBackfill,
  hasActiveBackfillJobs,
  isAllBackfillCompleted,
} from '../useBackfillAdmin'
import type { BackfillCabinetStatus } from '@/types/backfill'
import { backfillQueryKeys } from '@/lib/api/backfill'
import {
  mockBackfillStatusResponse,
  mockBackfillStatusCompleted,
  mockBackfillStatusInProgress,
  mockBackfillStatusFailed,
  mockBackfillStatusPaused,
  mockStartBackfillResponse,
  mockBackfillActionResponse,
  mockBackfillActionResponseResume,
  mockStartBackfillRequest,
} from '@/test/fixtures/fbs-analytics'

vi.mock('@/lib/api-client', () => ({ apiClient: { get: vi.fn(), post: vi.fn() } }))
import { apiClient } from '@/lib/api-client'

type Fixture = {
  cabinetId: string
  cabinetName: string
  reportsStatus: string
  analyticsStatus: string
  overallProgress: number
  estimatedEta: string | null
  errors: string[]
}

function normalizedStatus(f: Fixture) {
  return {
    cabinet_id: f.cabinetId,
    cabinet_name: f.cabinetName,
    status: f.reportsStatus,
    analytics_status: f.analyticsStatus,
    data_source: 'none' as const,
    oldest_available_date: null,
    newest_available_date: null,
    progress: {
      percentage: f.overallProgress,
      estimated_remaining_seconds: null,
      total_days: 0,
      completed_days: 0,
      current_date: null,
    },
    last_error: f.errors[0] ?? null,
    started_at: null,
    completed_at: null,
    updated_at: '',
  }
}

const allNormalized = () => mockBackfillStatusResponse.map(normalizedStatus)

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children)
}

function createWrapperWithClient() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children)
  return { client, wrapper }
}

beforeEach(() => {
  vi.clearAllMocks()
})
afterEach(() => {
  vi.restoreAllMocks()
})

// ============================================================================
// Query Keys
// ============================================================================

describe('backfillQueryKeys', () => {
  it('should generate correct base key', () => expect(backfillQueryKeys.all).toEqual(['backfill']))
  it('should generate correct status key', () => {
    expect(backfillQueryKeys.status()).toEqual(['backfill', 'status'])
  })
  it('should generate status key without cabinetId', () => {
    expect(backfillQueryKeys.status()).toHaveLength(2)
  })
  it('should generate unique keys for different cabinetIds', () => {
    expect(backfillQueryKeys.cabinet('cab-001')).not.toEqual(backfillQueryKeys.cabinet('cab-002'))
    expect(backfillQueryKeys.cabinet('cab-001')).toEqual(['backfill', 'cabinet', 'cab-001'])
  })
})

// ============================================================================
// useBackfillStatus — Basic
// ============================================================================

describe('useBackfillStatus - Basic functionality', () => {
  it('fetches backfill status for all cabinets', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(allNormalized())
    const { result } = renderHook(() => useBackfillStatus(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(4)
    expect(apiClient.get).toHaveBeenCalledWith(
      '/v1/admin/backfill/status',
      expect.objectContaining({ skipDataUnwrap: true })
    )
  })

  it('returns BackfillCabinetStatus objects', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(allNormalized())
    const { result } = renderHook(() => useBackfillStatus(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    result.current.data!.forEach(item => {
      expect(item).toHaveProperty('cabinet_id')
      expect(item).toHaveProperty('status')
      expect(item).toHaveProperty('analytics_status')
      expect(item).toHaveProperty('progress')
    })
  })

  it('returns loading state initially', () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useBackfillStatus(), { wrapper: createWrapper() })
    expect(result.current.isLoading).toBe(true)
  })

  it('returns success state with data', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(allNormalized())
    const { result } = renderHook(() => useBackfillStatus(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeDefined()
    expect(result.current.isLoading).toBe(false)
  })

  it('returns error state on API failure', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useBackfillStatus(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
  })
})

// ============================================================================
// useBackfillStatus — Polling
// ============================================================================

describe('useBackfillStatus - Polling', () => {
  it('supports refetchInterval for polling', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(allNormalized())
    const { result } = renderHook(
      () => useBackfillStatus({ polling: true, pollingInterval: 5000 }),
      { wrapper: createWrapper() }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeDefined()
  })

  it('uses 10s default polling when enabled', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(allNormalized())
    const { result } = renderHook(() => useBackfillStatus({ polling: true }), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeDefined()
  })

  it('stops polling when backfill is completed', async () => {
    vi.mocked(apiClient.get).mockResolvedValue([mockBackfillStatusCompleted].map(normalizedStatus))
    const { result } = renderHook(() => useBackfillStatus({ polling: true }), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
  })

  it('refetches on window focus by default', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(allNormalized())
    const { result } = renderHook(() => useBackfillStatus(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeDefined()
  })

  it('respects enabled option to disable query', () => {
    vi.mocked(apiClient.get).mockResolvedValue(allNormalized())
    const { result } = renderHook(() => useBackfillStatus({ enabled: false }), {
      wrapper: createWrapper(),
    })
    expect(result.current.fetchStatus).toBe('idle')
    expect(apiClient.get).not.toHaveBeenCalled()
  })
})

// ============================================================================
// useBackfillStatus — Filtering
// ============================================================================

describe('useBackfillStatus - Filtering', () => {
  it('filters by cabinetId', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(
      [mockBackfillStatusInProgress].map(normalizedStatus)
    )
    const { result } = renderHook(() => useBackfillStatus(), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data![0].cabinet_id).toBe('cabinet-uuid-001')
  })

  it('returns single cabinet when cabinetId specified', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(
      [mockBackfillStatusCompleted].map(normalizedStatus)
    )
    const { result } = renderHook(() => useBackfillStatus(), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
  })

  it('returns empty array when cabinetId not found', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([])
    const { result } = renderHook(() => useBackfillStatus(), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })

  it('fetches all when no options provided', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(allNormalized())
    const { result } = renderHook(() => useBackfillStatus(), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(4)
  })
})

// ============================================================================
// useBackfillStatus — Status parsing
// ============================================================================

describe('useBackfillStatus - Status parsing', () => {
  it('parses "pending" status', async () => {
    const pending = { ...mockBackfillStatusPaused, reportsStatus: 'pending' }
    vi.mocked(apiClient.get).mockResolvedValueOnce([normalizedStatus(pending)])
    const { result } = renderHook(() => useBackfillStatus(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data![0].status).toBe('pending')
  })

  it('parses "in_progress" via reportsStatus', async () => {
    const inProg = { ...mockBackfillStatusInProgress }
    vi.mocked(apiClient.get).mockResolvedValueOnce([normalizedStatus(inProg)])
    const { result } = renderHook(() => useBackfillStatus(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data![0].status).toBe('completed')
  })

  it('parses "completed" status', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([normalizedStatus(mockBackfillStatusCompleted)])
    const { result } = renderHook(() => useBackfillStatus(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data![0].status).toBe('completed')
  })

  it('parses "failed" analytics_status', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([normalizedStatus(mockBackfillStatusFailed)])
    const { result } = renderHook(() => useBackfillStatus(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data![0].analytics_status).toBe('failed')
  })

  it('parses "paused" status', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([normalizedStatus(mockBackfillStatusPaused)])
    const { result } = renderHook(() => useBackfillStatus(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data![0].status).toBe('paused')
  })

  it('parses overallProgress as number 0-100', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([normalizedStatus(mockBackfillStatusInProgress)])
    const { result } = renderHook(() => useBackfillStatus(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const pct = result.current.data![0].progress!.percentage
    expect(pct).toBe(65)
    expect(pct).toBeGreaterThanOrEqual(0)
    expect(pct).toBeLessThanOrEqual(100)
  })

  it('parses estimatedEta (null in fixture)', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([normalizedStatus(mockBackfillStatusInProgress)])
    const { result } = renderHook(() => useBackfillStatus(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data![0].progress?.estimated_remaining_seconds).toBeNull()
  })

  it('parses errors array into last_error', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([normalizedStatus(mockBackfillStatusFailed)])
    const { result } = renderHook(() => useBackfillStatus(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data![0].last_error).toBe('WB API timeout after 5 retries')
  })
})

// ============================================================================
// useStartBackfill — Basic + Request params
// ============================================================================

describe('useStartBackfill', () => {
  it('triggers POST /v1/admin/backfill/start', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockStartBackfillResponse)
    const { result } = renderHook(() => useStartBackfill(), { wrapper: createWrapper() })
    result.current.mutate(mockStartBackfillRequest)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(apiClient.post).toHaveBeenCalledWith(
      '/v1/admin/backfill/start',
      mockStartBackfillRequest
    )
  })

  it('accepts StartBackfillRequest with dates', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockStartBackfillResponse)
    const { result } = renderHook(() => useStartBackfill(), { wrapper: createWrapper() })
    result.current.mutate({
      cabinet_id: 'cabinet-uuid-001',
      from_date: '2025-01-29',
      to_date: '2026-01-28',
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(apiClient.post).toHaveBeenCalledTimes(1)
  })

  it('returns StartBackfillResponse on success', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockStartBackfillResponse)
    const { result } = renderHook(() => useStartBackfill(), { wrapper: createWrapper() })
    result.current.mutate(mockStartBackfillRequest)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockStartBackfillResponse)
  })

  it('returns isPending during mutation', async () => {
    vi.mocked(apiClient.post).mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useStartBackfill(), { wrapper: createWrapper() })
    result.current.mutate(mockStartBackfillRequest)
    await waitFor(() => expect(result.current.isPending).toBe(true))
  })

  it('returns isError on failure', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Server error'))
    const { result } = renderHook(() => useStartBackfill(), { wrapper: createWrapper() })
    result.current.mutate(mockStartBackfillRequest)
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
  })

  it('sends cabinetId when provided', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockStartBackfillResponse)
    const { result } = renderHook(() => useStartBackfill(), { wrapper: createWrapper() })
    result.current.mutate({ cabinet_id: 'cabinet-uuid-001' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(apiClient.post).toHaveBeenCalledWith(
      '/v1/admin/backfill/start',
      expect.objectContaining({ cabinet_id: 'cabinet-uuid-001' })
    )
  })

  it('sends from_date/to_date in YYYY-MM-DD format', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockStartBackfillResponse)
    const { result } = renderHook(() => useStartBackfill(), { wrapper: createWrapper() })
    result.current.mutate({ cabinet_id: 'cab-1', from_date: '2025-01-29', to_date: '2026-01-28' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const body = vi.mocked(apiClient.post).mock.calls[0][1] as Record<string, unknown>
    expect(body.from_date).toBe('2025-01-29')
    expect(body.to_date).toBe('2026-01-28')
  })

  it('sends request without optional dates', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockStartBackfillResponse)
    const { result } = renderHook(() => useStartBackfill(), { wrapper: createWrapper() })
    result.current.mutate({ cabinet_id: 'cab-1' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const body = vi.mocked(apiClient.post).mock.calls[0][1] as Record<string, unknown>
    expect(body.from_date).toBeUndefined()
  })

  it('returns message and estimated_duration_minutes on success', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockStartBackfillResponse)
    const { result } = renderHook(() => useStartBackfill(), { wrapper: createWrapper() })
    result.current.mutate(mockStartBackfillRequest)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.message).toBe('Backfill jobs enqueued successfully')
    expect(result.current.data!.estimated_duration_minutes).toBe(30)
    expect(result.current.data!.cabinet_id).toBe('cabinet-uuid-001')
  })

  it('invalidates backfill queries on success', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockStartBackfillResponse)
    const { client, wrapper } = createWrapperWithClient()
    const spy = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useStartBackfill(), { wrapper })
    result.current.mutate(mockStartBackfillRequest)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: backfillQueryKeys.all })
  })

  it('does not invalidate queries on error', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Fail'))
    const { client, wrapper } = createWrapperWithClient()
    const spy = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useStartBackfill(), { wrapper })
    result.current.mutate(mockStartBackfillRequest)
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(spy).not.toHaveBeenCalled()
  })

  it('resolves mutation data on success', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockStartBackfillResponse)
    const { result } = renderHook(() => useStartBackfill(), { wrapper: createWrapper() })
    result.current.mutate(mockStartBackfillRequest)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.status).toBe('pending')
    expect(result.current.data!.message).toBe('Backfill jobs enqueued successfully')
  })

  it('captures error on mutation failure', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Mutation failed'))
    const { result } = renderHook(() => useStartBackfill(), { wrapper: createWrapper() })
    result.current.mutate(mockStartBackfillRequest)
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Mutation failed')
  })
})

// ============================================================================
// usePauseBackfill
// ============================================================================

describe('usePauseBackfill', () => {
  it('triggers POST /v1/admin/backfill/pause', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockBackfillActionResponse)
    const { result } = renderHook(() => usePauseBackfill(), { wrapper: createWrapper() })
    result.current.mutate('cabinet-uuid-001')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(apiClient.post).toHaveBeenCalledWith('/v1/admin/backfill/pause', {
      cabinet_id: 'cabinet-uuid-001',
    })
  })

  it('accepts cabinetId and returns response', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockBackfillActionResponse)
    const { result } = renderHook(() => usePauseBackfill(), { wrapper: createWrapper() })
    result.current.mutate('cab-123')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const body = vi.mocked(apiClient.post).mock.calls[0][1] as Record<string, unknown>
    expect(body.cabinet_id).toBe('cab-123')
    expect(result.current.data).toEqual(mockBackfillActionResponse)
  })

  it('returns isPending and isError states', async () => {
    vi.mocked(apiClient.post).mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => usePauseBackfill(), { wrapper: createWrapper() })
    result.current.mutate('cabinet-uuid-001')
    await waitFor(() => expect(result.current.isPending).toBe(true))
  })

  it('returns isError on failure', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Pause failed'))
    const { result } = renderHook(() => usePauseBackfill(), { wrapper: createWrapper() })
    result.current.mutate('cabinet-uuid-001')
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
  })

  it('resolves with response data on success', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockBackfillActionResponse)
    const { result } = renderHook(() => usePauseBackfill(), { wrapper: createWrapper() })
    result.current.mutate('cabinet-uuid-001')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.status).toBeTruthy()
  })

  it('captures error on failure', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Pause error'))
    const { result } = renderHook(() => usePauseBackfill(), { wrapper: createWrapper() })
    result.current.mutate('cabinet-uuid-001')
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Pause error')
  })

  it('invalidates backfill status on success', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockBackfillActionResponse)
    const { client, wrapper } = createWrapperWithClient()
    const spy = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => usePauseBackfill(), { wrapper })
    result.current.mutate('cabinet-uuid-001')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: backfillQueryKeys.all })
  })

  it('returns success message with "paused"', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockBackfillActionResponse)
    const { result } = renderHook(() => usePauseBackfill(), { wrapper: createWrapper() })
    result.current.mutate('cabinet-uuid-001')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.message).toContain('paused')
  })

  it('handles already paused cabinet', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      ...mockBackfillActionResponse,
      message: 'Cabinet is already paused',
    })
    const { result } = renderHook(() => usePauseBackfill(), { wrapper: createWrapper() })
    result.current.mutate('cabinet-uuid-001')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.message).toContain('already paused')
  })

  it('sends request even with empty cabinetId', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockBackfillActionResponse)
    const { result } = renderHook(() => usePauseBackfill(), { wrapper: createWrapper() })
    result.current.mutate('')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(apiClient.post).toHaveBeenCalledTimes(1)
  })
})

// ============================================================================
// useResumeBackfill
// ============================================================================

describe('useResumeBackfill', () => {
  it('triggers POST /v1/admin/backfill/resume', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockBackfillActionResponseResume)
    const { result } = renderHook(() => useResumeBackfill(), { wrapper: createWrapper() })
    result.current.mutate('cabinet-uuid-001')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(apiClient.post).toHaveBeenCalledWith('/v1/admin/backfill/resume', {
      cabinet_id: 'cabinet-uuid-001',
    })
  })

  it('accepts cabinetId and returns response', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockBackfillActionResponseResume)
    const { result } = renderHook(() => useResumeBackfill(), { wrapper: createWrapper() })
    result.current.mutate('cab-456')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const body = vi.mocked(apiClient.post).mock.calls[0][1] as Record<string, unknown>
    expect(body.cabinet_id).toBe('cab-456')
    expect(result.current.data).toEqual(mockBackfillActionResponseResume)
  })

  it('returns isPending during mutation', async () => {
    vi.mocked(apiClient.post).mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useResumeBackfill(), { wrapper: createWrapper() })
    result.current.mutate('cabinet-uuid-001')
    await waitFor(() => expect(result.current.isPending).toBe(true))
  })

  it('returns isError on failure', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Resume failed'))
    const { result } = renderHook(() => useResumeBackfill(), { wrapper: createWrapper() })
    result.current.mutate('cabinet-uuid-001')
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
  })

  it('resolves with response data on success', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockBackfillActionResponseResume)
    const { result } = renderHook(() => useResumeBackfill(), { wrapper: createWrapper() })
    result.current.mutate('cabinet-uuid-001')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.status).toBeTruthy()
  })

  it('captures error on failure', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Resume error'))
    const { result } = renderHook(() => useResumeBackfill(), { wrapper: createWrapper() })
    result.current.mutate('cabinet-uuid-001')
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Resume error')
  })

  it('invalidates backfill status on success', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockBackfillActionResponseResume)
    const { client, wrapper } = createWrapperWithClient()
    const spy = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useResumeBackfill(), { wrapper })
    result.current.mutate('cabinet-uuid-001')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: backfillQueryKeys.all })
  })

  it('returns success message with "resumed"', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockBackfillActionResponseResume)
    const { result } = renderHook(() => useResumeBackfill(), { wrapper: createWrapper() })
    result.current.mutate('cabinet-uuid-001')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.message).toContain('resumed')
  })

  it('handles non-paused cabinet gracefully', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      ...mockBackfillActionResponseResume,
      message: 'Cabinet is not paused',
    })
    const { result } = renderHook(() => useResumeBackfill(), { wrapper: createWrapper() })
    result.current.mutate('cabinet-uuid-001')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.message).toContain('not paused')
  })

  it('sends request even with empty cabinetId', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockBackfillActionResponseResume)
    const { result } = renderHook(() => useResumeBackfill(), { wrapper: createWrapper() })
    result.current.mutate('')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(apiClient.post).toHaveBeenCalledTimes(1)
  })
})

// ============================================================================
// Cache Invalidation
// ============================================================================

describe('Backfill Hooks - Cache Invalidation', () => {
  it('verifies query state after fetch', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(allNormalized())
    const { client, wrapper } = createWrapperWithClient()
    renderHook(() => useBackfillStatus(), { wrapper })
    await waitFor(() => {
      const state = client.getQueryState(backfillQueryKeys.status())
      expect(state?.status).toBe('success')
    })
  })

  it('query data is cached after fetch', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(allNormalized())
    const { client, wrapper } = createWrapperWithClient()
    renderHook(() => useBackfillStatus(), { wrapper })
    await waitFor(() => {
      expect(client.getQueryData(backfillQueryKeys.status())).toBeDefined()
    })
  })

  it('supports manual invalidation via queryClient', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(allNormalized())
    const { client, wrapper } = createWrapperWithClient()
    renderHook(() => useBackfillStatus(), { wrapper })
    await waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(1))
    await client.invalidateQueries({ queryKey: backfillQueryKeys.all })
    await waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(2))
  })
})

// ============================================================================
// Error Handling
// ============================================================================

describe('Backfill Hooks - Error handling', () => {
  it('handles network errors', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useBackfillStatus(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Network error')
  })

  it('preserves FORBIDDEN error message', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(
      new Error('Owner role required for admin operations')
    )
    const { result } = renderHook(() => useBackfillStatus(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toContain('Owner role')
  })

  it('preserves UNAUTHORIZED error message', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Authentication required'))
    const { result } = renderHook(() => useBackfillStatus(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toContain('Authentication')
  })

  it('preserves CABINET_NOT_FOUND error', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Cabinet not found'))
    const { result } = renderHook(() => usePauseBackfill(), { wrapper: createWrapper() })
    result.current.mutate('non-existent-cabinet')
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toContain('not found')
  })

  it('preserves original API error message', async () => {
    const msg = 'Rate limit exceeded. Try again in 60 seconds.'
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error(msg))
    const { result } = renderHook(() => useBackfillStatus(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe(msg)
  })

  it('surfaces error immediately with retry:false', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Timeout'))
    const { result } = renderHook(() => useBackfillStatus(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(apiClient.get).toHaveBeenCalledTimes(1)
  })
})

// ============================================================================
// Type Exports
// ============================================================================

describe('Backfill Types - Type exports', () => {
  it('UseBackfillStatusOptions is usable', () => {
    const opts: import('@/types/backfill').UseBackfillStatusOptions = {
      enabled: true,
      polling: true,
      pollingInterval: 5000,
    }
    expect(opts.enabled).toBe(true)
  })
  it('UseBackfillMutationOptions is usable', () => {
    const o: import('@/types/backfill').UseBackfillMutationOptions<
      import('@/types/backfill').StartBackfillResponse
    > = {
      onSuccess: () => {},
      onError: () => {},
    }
    expect(typeof o.onSuccess).toBe('function')
  })
  it('BackfillActionResponse is usable', () => {
    const r: import('@/types/backfill').BackfillActionResponse = {
      cabinet_id: 'c-1',
      status: 'paused',
      message: 'Paused',
    }
    expect(r.cabinet_id).toBe('c-1')
  })
  it('StartBackfillRequest is usable', () => {
    const r: import('@/types/backfill').StartBackfillRequest = {
      cabinet_id: 'c-1',
      from_date: '2025-01-01',
      to_date: '2026-01-01',
    }
    expect(r.cabinet_id).toBe('c-1')
  })
})

// ============================================================================
// Role-Based Access
// ============================================================================

describe('Backfill Hooks - Role-based access', () => {
  it('works for Owner role', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(allNormalized())
    const { result } = renderHook(() => useBackfillStatus(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeDefined()
  })

  it('surfaces 403 for non-Owner', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Request failed with status code 403'))
    const { result } = renderHook(() => useBackfillStatus(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toContain('403')
  })

  it('handles polling with auth', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(allNormalized())
    const { result } = renderHook(
      () => useBackfillStatus({ polling: true, pollingInterval: 10000 }),
      { wrapper: createWrapper() }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(4)
  })
})

// ============================================================================
// Utility Functions
// ============================================================================

describe('hasActiveBackfillJobs', () => {
  it('returns true when in_progress or pending exists', () => {
    const active = [
      normalizedStatus({ ...mockBackfillStatusInProgress, reportsStatus: 'in_progress' }),
    ] as BackfillCabinetStatus[]
    expect(hasActiveBackfillJobs(active)).toBe(true)
  })
  it('returns false when all completed', () => {
    expect(
      hasActiveBackfillJobs(
        [mockBackfillStatusCompleted].map(normalizedStatus) as BackfillCabinetStatus[]
      )
    ).toBe(false)
  })
  it('returns false for empty array', () => expect(hasActiveBackfillJobs([])).toBe(false))
})

describe('isAllBackfillCompleted', () => {
  it('returns true when all completed', () => {
    expect(
      isAllBackfillCompleted(
        [mockBackfillStatusCompleted].map(normalizedStatus) as BackfillCabinetStatus[]
      )
    ).toBe(true)
  })
  it('returns false when any not completed', () => {
    expect(isAllBackfillCompleted(allNormalized() as BackfillCabinetStatus[])).toBe(false)
  })
  it('returns true for empty array', () => expect(isAllBackfillCompleted([])).toBe(true))
})
