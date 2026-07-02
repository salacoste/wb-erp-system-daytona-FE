'use client'

/**
 * МойСклад sync hook — POST /sync → 202 enqueued (flat {taskUuid}), then poll
 * the task system via GET /v1/tasks/:taskUuid until terminal (completed|failed).
 * Contract: docs/request-backend/221-moysklad-integration-backend-contract.md
 *
 * Mirrors useSanityCheck's task-status polling (NOT a list-diff). Sync writes
 * only to OUR DB (D43/D44 — FE never writes to МойСклад). The 30s rate-limit
 * window (canSync) is preserved.
 */

import { useState, useEffect, useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { enqueueMoyskladSync } from '@/lib/api/moysklad'

const RATE_LIMIT_MS = 30_000
const POLL_INTERVAL_MS = 4_000

/** Task statuses that mean "still running" (poll continues). */
const ACTIVE_STATUSES = new Set(['waiting', 'active', 'delayed', 'in_progress', 'pending'])

/** Task statuses that mean "done" (stop polling + finalize). */
const TERMINAL_STATUSES = new Set(['completed', 'failed', 'cancelled', 'dlq'])

/** Flat shape from GET /v1/tasks/:taskUuid (status + optional error). */
interface MoyskladSyncStatusResponse {
  status: string
  error?: string
}

/** GET /v1/tasks/:taskUuid — poll the standard task system. */
export function getMoyskladSyncStatus(taskUuid: string) {
  return apiClient.get<MoyskladSyncStatusResponse>(`/v1/tasks/${taskUuid}`)
}

export interface UseMoyskladSyncResult {
  sync: () => void
  isSyncing: boolean
  canSync: boolean
  lastSyncAt: Date | null
  rateLimitCountdown: number
  taskUuid: string | null
  status: string | null
  error: Error | null
}

/**
 * Enqueues a sync, then polls GET /v1/tasks/:taskUuid until completed/failed.
 * On terminal: stops polling, invalidates `['moysklad','mappings']`, resets
 * taskUuid so a new sync can start.
 */
export function useMoyskladSync(): UseMoyskladSyncResult {
  const queryClient = useQueryClient()
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null)
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0)
  const [taskUuid, setTaskUuid] = useState<string | null>(null)
  // Persisted terminal error — survives the taskUuid reset (which disables the
  // status query and clears statusQuery.data). Surfaced on the hook result.
  const [terminalError, setTerminalError] = useState<Error | null>(null)

  // Rate-limit countdown timer (per-second decrement).
  useEffect(() => {
    if (rateLimitCountdown <= 0) return
    const interval = setInterval(() => {
      setRateLimitCountdown(prev => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [rateLimitCountdown])

  // Task-status polling — mirrors useSanityCheck.ts.
  const statusQuery = useQuery<MoyskladSyncStatusResponse>({
    queryKey: ['moysklad', 'sync-status', taskUuid],
    queryFn: () => {
      if (!taskUuid) throw new Error('No task UUID')
      return getMoyskladSyncStatus(taskUuid)
    },
    enabled: !!taskUuid,
    refetchInterval: query => {
      const data = query.state.data
      if (data && TERMINAL_STATUSES.has(data.status)) return false
      return POLL_INTERVAL_MS
    },
    retry: 1,
  })

  const status = statusQuery.data?.status ?? null
  const isSyncing = !!taskUuid && (statusQuery.isFetching || ACTIVE_STATUSES.has(status ?? ''))

  // Terminal handling: invalidate mappings + reset taskUuid so a new sync starts.
  useEffect(() => {
    if (!statusQuery.data) return
    const { status: s, error: taskError } = statusQuery.data
    if (TERMINAL_STATUSES.has(s)) {
      queryClient.invalidateQueries({ queryKey: ['moysklad', 'mappings'] })
      if (s === 'failed') {
        setTerminalError(new Error(taskError || 'Ошибка синхронизации'))
      }
      setTaskUuid(null)
    }
  }, [statusQuery.data, queryClient])

  const mutation = useMutation({
    mutationFn: enqueueMoyskladSync,
    onSuccess: data => {
      setTerminalError(null)
      setTaskUuid(data.taskUuid)
      setLastSyncAt(new Date())
      setRateLimitCountdown(RATE_LIMIT_MS / 1000)
    },
  })

  const canSync = rateLimitCountdown === 0 && !mutation.isPending && !isSyncing && !taskUuid

  const sync = useCallback(() => {
    if (canSync) mutation.mutate()
  }, [canSync, mutation])

  return {
    sync,
    isSyncing,
    canSync,
    lastSyncAt,
    rateLimitCountdown,
    taskUuid,
    status,
    error: terminalError ?? (mutation.error as Error | null) ?? (statusQuery.error as Error | null),
  }
}
