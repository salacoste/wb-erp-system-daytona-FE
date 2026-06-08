/**
 * Processing status polling strategy and batch aggregation
 * Extracted from useProcessingStatus.ts for file size compliance.
 */

import type { ProcessingStatus } from '@/types/api'

/**
 * Batch status from API
 */
export interface ImportBatch {
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

export interface BatchListResponse {
  batches: ImportBatch[]
  total: number
}

// After this many consecutive empty-batch polls (~60s at 3s/poll), stop polling
// and surface a terminal "no_data" state instead of spinning forever.
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

/** Map batch status to task status */
function mapBatchStatus(
  batch: ImportBatch | undefined
): 'pending' | 'in_progress' | 'completed' | 'failed' {
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

/**
 * Aggregates batch statuses into a ProcessingStatus object.
 */
export function aggregateProcessingStatus(batches: ImportBatch[]): ProcessingStatus {
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

  const taskStatus = mapBatchStatus(latestBatch)

  // For now, treat both product parsing and report loading as the same batch
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
