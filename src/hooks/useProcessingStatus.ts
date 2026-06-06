/**
 * Hook for monitoring processing status during onboarding
 * Story 2.3: Data Processing Status Indicators
 *
 * Updated: Uses /v1/imports/historical API for batch progress tracking
 * instead of /v1/tasks (which doesn't have batch progress data)
 */

import { useQuery } from '@tanstack/react-query'
import { useRef } from 'react'
import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/authStore'
import { reconcileBatch } from '@/lib/api/imports-reconcile'
import type { ProcessingStatus } from '@/types/api'
import { logger } from '@/lib/logger'

/**
 * Batch status from API
 */
interface ImportBatch {
  id: string
  batchType: string
  weekStart: string
  weekEnd: string
  totalWeeks: number
  completedWeeks: number
  failedWeeks: number
  skippedWeeks?: number
  status: 'pending' | 'in_progress' | 'completed' | 'partial' | 'failed' | 'cancelled'
  startedAt: string | null
  completedAt: string | null
  progressPercent?: number
}

interface BatchListResponse {
  batches: ImportBatch[]
  total: number
}

// After this many consecutive empty-batch polls (~60s at 3s/poll), stop polling
// and surface a terminal "no_data" state instead of spinning forever. This covers
// already-up-to-date cabinets and best-effort enqueues that never fired.
//
// The historical import is a BACKEND-ASYNC side-effect of saving the WB token
// (WbTokenForm only calls updateWbToken + router.push — there is NO synchronous FE
// enqueue). A slow backend batch-creation (queue backlog / WB API latency) can
// legitimately exceed 30s, so a longer grace window avoids truncating a slow real
// import; the recoverable CTA + neutral copy bound the downside if we're wrong.
// Exported so tests couple to this source of truth rather than hardcoding the cap.
export const MAX_EMPTY_POLLS = 20

/**
 * Pure predicate for the query refetchInterval — extracted so the load-bearing
 * "stop polling on terminal status" ordering can be unit-tested directly.
 *
 * MUST check terminal statuses FIRST: a terminal 'no_data' still carries
 * reportLoading.status: 'pending', which would otherwise re-trigger the
 * in-progress poll below and spin forever.
 */
export function getRefetchInterval(data: ProcessingStatus | undefined): number | false {
  if (data?.status === 'no_data' || data?.status === 'completed' || data?.status === 'failed') {
    return false
  }
  // Poll every 3 seconds while processing
  if (data?.status === 'processing') {
    return 3000
  }
  // Also poll if still in progress
  if (data?.reportLoading?.status === 'in_progress' || data?.reportLoading?.status === 'pending') {
    return 3000
  }
  return false
}

/**
 * Aggregates batch statuses into processing status
 */
function aggregateProcessingStatus(batches: ImportBatch[]): ProcessingStatus {
  // Find the most recent active batch, or the latest completed, or fall back to latest overall
  const activeBatch = batches.find(b => b.status === 'in_progress' || b.status === 'pending')
  const completedBatch = batches.find(b => b.status === 'completed' || b.status === 'partial')
  // Prefer active → completed → latest (don't let a stale failed batch override completed data)
  const latestBatch = activeBatch || completedBatch || batches[0]

  // Calculate progress based on batch
  const progressPercent = latestBatch
    ? (latestBatch.progressPercent ??
      (latestBatch.totalWeeks > 0
        ? Math.round((latestBatch.completedWeeks / latestBatch.totalWeeks) * 100)
        : 0))
    : 0

  // Map batch status to task status
  const mapStatus = (
    batch: ImportBatch | undefined
  ): 'pending' | 'in_progress' | 'completed' | 'failed' => {
    if (!batch) return 'pending'
    switch (batch.status) {
      case 'completed':
      case 'partial':
        return 'completed'
      case 'failed':
      case 'cancelled':
        return 'failed'
      case 'in_progress':
        return 'in_progress'
      default:
        return 'pending'
    }
  }

  const taskStatus = mapStatus(latestBatch)

  // For now, treat both product parsing and report loading as the same batch
  // In the future, these could be separate batch types
  const productParsing = {
    progress: progressPercent,
    status: taskStatus,
    taskUuid: latestBatch?.id,
  }

  const reportLoading = {
    progress: progressPercent,
    status: taskStatus,
    taskUuid: latestBatch?.id,
  }

  // Determine overall status
  let overallStatus: 'processing' | 'completed' | 'failed' = 'processing'
  if (taskStatus === 'failed') {
    overallStatus = 'failed'
  } else if (taskStatus === 'completed') {
    overallStatus = 'completed'
  }

  return {
    status: overallStatus,
    productParsing,
    reportLoading,
    error: undefined,
    // failedBatchCount injected by hook after reconcile — default 0 here
    failedBatchCount: 0,
  }
}

/**
 * Hook to monitor processing status for onboarding
 * Polls imports/historical API every 3 seconds while processing
 */
export function useProcessingStatus() {
  const { cabinetId } = useAuthStore()
  const reconciledIds = useRef(new Set<string>())
  const failedReconcileIds = useRef(new Set<string>())
  const emptyPollsRef = useRef(0)

  return useQuery({
    queryKey: ['processing-status', cabinetId],
    queryFn: async (): Promise<ProcessingStatus> => {
      if (!cabinetId) {
        throw new Error('Cabinet ID not found')
      }

      try {
        const response = await apiClient.get<BatchListResponse>('/v1/imports/historical?limit=5')
        const batches = response.batches || []

        if (batches.length === 0) {
          emptyPollsRef.current += 1
          // After the cap, surface a terminal "no_data" state so the onboarding
          // /processing page stops polling forever (already-up-to-date cabinet
          // or a best-effort enqueue that never fired).
          if (emptyPollsRef.current >= MAX_EMPTY_POLLS) {
            return {
              status: 'no_data',
              productParsing: { progress: 0, status: 'pending' },
              reportLoading: { progress: 0, status: 'pending' },
            }
          }
          return {
            status: 'processing',
            productParsing: { progress: 0, status: 'pending' },
            reportLoading: { progress: 0, status: 'pending' },
          }
        }

        // A batch arrived — reset the empty-poll counter so normal flow resumes.
        emptyPollsRef.current = 0

        const result = aggregateProcessingStatus(batches)

        // Story 84.4: Reconcile failed batches to detect data from auto-import
        const failedBatches = batches.filter(
          b =>
            (b.status === 'failed' || b.status === 'cancelled') &&
            !reconciledIds.current.has(b.id) &&
            !failedReconcileIds.current.has(b.id)
        )

        if (failedBatches.length > 0) {
          const reconcileResults = await Promise.allSettled(
            failedBatches.map(async b => {
              const res = await reconcileBatch(b.id)
              if (res.reconciled) reconciledIds.current.add(b.id)
              return res
            })
          )
          let stillFailed = 0
          reconcileResults.forEach((r, i) => {
            if (r.status === 'rejected') {
              failedReconcileIds.current.add(failedBatches[i].id)
              stillFailed++
            } else if (!r.value.reconciled) {
              failedReconcileIds.current.add(failedBatches[i].id)
              stillFailed++
            }
          })
          result.failedBatchCount = stillFailed
        }

        return result
      } catch (error) {
        logger.warn('[useProcessingStatus] Error fetching batches:', error)
        return {
          status: 'processing',
          productParsing: { progress: 0, status: 'pending' },
          reportLoading: { progress: 0, status: 'pending' },
        }
      }
    },
    enabled: !!cabinetId,
    refetchInterval: query => getRefetchInterval(query.state.data),
    retry: 1, // Retry once on error
  })
}
