/**
 * useMoyskladSync — task-status polling tests.
 * Contract: docs/request-backend/221-moysklad-integration-backend-contract.md
 *
 * Covers the HIGH-fix rewrite: POST /sync → flat {taskUuid}, then poll
 * GET /v1/tasks/:taskUuid until terminal (completed|failed). The list-diff is
 * gone. Mocks apiClient.get (the transport the queryFn calls) — the named
 * export spy can't intercept same-module calls, so we go one layer down.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import * as moyskladApi from '@/lib/api/moysklad'
import { apiClient } from '@/lib/api-client'
import { useMoyskladSync } from '../useMoyskladSync'

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

const mockedGet = vi.mocked(apiClient.get)

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children)
}

describe('useMoyskladSync — task-status polling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('reads the flat {taskUuid} from enqueueMoyskladSync (no `data.` prefix)', async () => {
    const enqueueSpy = vi
      .spyOn(moyskladApi, 'enqueueMoyskladSync')
      .mockResolvedValue({ status: 'enqueued', taskUuid: 'task-flat', queue: 'moysklad-sync' })
    // Non-terminal so taskUuid stays set (lets us read it before any reset).
    mockedGet.mockResolvedValue({ status: 'in_progress' })

    const { result } = renderHook(() => useMoyskladSync(), {
      wrapper: createWrapper(),
    })
    result.current.sync()
    // enqueue read flat — taskUuid captured directly from the response.
    await waitFor(() => expect(result.current.taskUuid).toBe('task-flat'))
    expect(enqueueSpy).toHaveBeenCalledTimes(1)
  })

  it('polls GET /v1/tasks/:taskUuid after enqueue, stops + invalidates on completed', async () => {
    vi.spyOn(moyskladApi, 'enqueueMoyskladSync').mockResolvedValue({
      status: 'enqueued',
      taskUuid: 'task-1',
      queue: 'moysklad-sync',
    })
    // First poll returns terminal (completed) → terminal effect fires on first fetch.
    mockedGet.mockResolvedValue({ status: 'completed' })

    let invalidateCount = 0
    const origInvalidate = QueryClient.prototype.invalidateQueries
    vi.spyOn(QueryClient.prototype, 'invalidateQueries').mockImplementation(function (
      this: QueryClient,
      ...args: unknown[]
    ) {
      const opts = args[0] as { queryKey?: unknown }
      if (Array.isArray(opts?.queryKey) && opts.queryKey[0] === 'moysklad') invalidateCount += 1
      return origInvalidate.apply(this, args as [never])
    })

    const { result } = renderHook(() => useMoyskladSync(), {
      wrapper: createWrapper(),
    })
    result.current.sync()
    // taskUuid is set then reset on terminal — assert via the poll landing
    // rather than the ephemeral taskUuid state (it flips too fast to catch).
    await waitFor(() => expect(mockedGet).toHaveBeenCalledWith('/v1/tasks/task-1'))
    // completed (terminal) → taskUuid resets so a new sync can start; mappings invalidated.
    await waitFor(() => expect(result.current.taskUuid).toBeNull())
    expect(invalidateCount).toBeGreaterThan(0)
  })

  it('surfaces failed status as an error and resets taskUuid', async () => {
    vi.spyOn(moyskladApi, 'enqueueMoyskladSync').mockResolvedValue({
      status: 'enqueued',
      taskUuid: 'task-fail',
      queue: 'moysklad-sync',
    })
    // First poll returns terminal (failed) → terminal effect fires on first fetch.
    mockedGet.mockResolvedValue({ status: 'failed', error: 'boom' })

    const { result } = renderHook(() => useMoyskladSync(), {
      wrapper: createWrapper(),
    })
    result.current.sync()
    // failed (terminal) → taskUuid resets; error surfaced. Assert via the poll
    // landing (taskUuid flips set→reset too fast to catch mid-state).
    await waitFor(() => expect(mockedGet).toHaveBeenCalledWith('/v1/tasks/task-fail'))
    await waitFor(() => expect(result.current.taskUuid).toBeNull())
    expect(result.current.error).toBeInstanceOf(Error)
  })

  it('rate-limits via canSync (disabled while syncing)', async () => {
    vi.spyOn(moyskladApi, 'enqueueMoyskladSync').mockResolvedValue({
      status: 'enqueued',
      taskUuid: 'task-rate',
      queue: 'moysklad-sync',
    })
    mockedGet.mockResolvedValue({ status: 'in_progress' })

    const { result } = renderHook(() => useMoyskladSync(), {
      wrapper: createWrapper(),
    })
    expect(result.current.canSync).toBe(true)
    result.current.sync()
    await waitFor(() => expect(result.current.taskUuid).toBe('task-rate'))
    expect(result.current.canSync).toBe(false)
  })

  it('does not poll before a sync is enqueued', () => {
    mockedGet.mockResolvedValue({ status: 'in_progress' })
    const { result } = renderHook(() => useMoyskladSync(), {
      wrapper: createWrapper(),
    })
    expect(result.current.taskUuid).toBeNull()
    expect(result.current.status).toBeNull()
    expect(mockedGet).not.toHaveBeenCalled()
  })
})
