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
  backfillQueryKeys,
} from '@/lib/api/backfill'
import type {
  StartBackfillRequest,
  BackfillCabinetStatus,
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
