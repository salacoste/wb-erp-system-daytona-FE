/**
 * Backfill Admin Hooks
 * Story 51.11-FE: Backfill Admin Page
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * React Query hooks for backfill status management (Owner only)
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getBackfillStatus,
  startBackfill,
  pauseBackfill,
  resumeBackfill,
  retryBackfill,
  backfillQueryKeys,
} from '@/lib/api/backfill'
import type {
  StartBackfillRequest,
  BackfillCabinetStatus,
  BackfillRetrySource,
  UseBackfillStatusOptions,
} from '@/types/backfill'

// ============================================================================
// Backfill Status Query Hook
// ============================================================================

/**
 * Hook для получения статуса бэкфилла
 * GET /v1/admin/backfill/status
 */
export function useBackfillStatus(options: UseBackfillStatusOptions = {}) {
  const { enabled = true, polling = true, pollingInterval = 10000 } = options

  return useQuery({
    queryKey: backfillQueryKeys.status(),
    queryFn: getBackfillStatus,
    enabled,
    refetchInterval: polling ? pollingInterval : false,
    staleTime: 5000, // 5 seconds
  })
}

// ============================================================================
// Backfill Mutation Hooks
// ============================================================================

/**
 * Hook для запуска бэкфилла
 * POST /v1/admin/backfill/start
 */
export function useStartBackfill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: StartBackfillRequest) => startBackfill(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backfillQueryKeys.all })
    },
  })
}

/**
 * Hook для приостановки бэкфилла
 * POST /v1/admin/backfill/pause
 */
export function usePauseBackfill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (cabinetId: string) => pauseBackfill(cabinetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backfillQueryKeys.all })
    },
  })
}

/**
 * Hook для возобновления бэкфилла
 * POST /v1/admin/backfill/resume
 */
export function useResumeBackfill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (cabinetId: string) => resumeBackfill(cabinetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backfillQueryKeys.all })
    },
  })
}

/**
 * Story 165.5: Hook для повторного запуска ОДНОГО источника бэкфилла (report | analytics).
 * POST /v1/admin/backfill/{report|analytics}/retry.
 *
 * Per-source independence (AC3/AC4): each source gets its own mutation scoped by
 * `dataSource` in the variables, so reports- and analytics-retry never share loading
 * state. The status query is invalidated on settle (success OR error) so the table
 * refreshes to reflect the resolved race (409 in-progress / 404 not-failed) and the
 * new retry attempt. 403/404/409 propagate as ApiError to the caller's onError.
 */
export function useRetryBackfill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      cabinetId,
      dataSource,
    }: {
      cabinetId: string
      dataSource: BackfillRetrySource
    }) => retryBackfill(cabinetId, dataSource),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backfillQueryKeys.all })
    },
    // AC5: refresh the status query even on error so a 409/404 race resolves in the
    // table (the competing/in-flight state is the source of truth, not the stale error).
    onError: () => {
      queryClient.invalidateQueries({ queryKey: backfillQueryKeys.all })
    },
  })
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Проверка, есть ли активные (незавершённые) задачи бэкфилла
 */
export function hasActiveBackfillJobs(statuses: BackfillCabinetStatus[]): boolean {
  return statuses.some(s => s.status === 'in_progress' || s.status === 'pending')
}

/**
 * Проверка, все ли задачи завершены
 */
export function isAllBackfillCompleted(statuses: BackfillCabinetStatus[]): boolean {
  return statuses.every(s => s.status === 'completed')
}
