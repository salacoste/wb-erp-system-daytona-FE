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
          return {
            status: 'processing',
            productParsing: { progress: 0, status: 'pending' },
            reportLoading: { progress: 0, status: 'pending' },
          }
        }

        const result = aggregateProcessingStatus(batches)

        // Story 84.4: Reconcile failed batches to detect data from auto-import
        const failedBatches = batches.filter(
          b =>
            (b.status === 'failed' || b.status === 'cancelled') && !reconciledIds.current.has(b.id)
        )

        if (failedBatches.length > 0) {
          const reconcileResults = await Promise.allSettled(
            failedBatches.map(async b => {
              const res = await reconcileBatch(b.id)
              if (res.reconciled) reconciledIds.current.add(b.id)
              return res
            })
          )
          const stillFailed = reconcileResults.filter(
            r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.reconciled)
          ).length
          result.failedBatchCount = stillFailed
        }

        return result
      } catch (error) {
        console.warn('[useProcessingStatus] Error fetching batches:', error)
        return {
          status: 'processing',
          productParsing: { progress: 0, status: 'pending' },
          reportLoading: { progress: 0, status: 'pending' },
        }
      }
    },
    enabled: !!cabinetId,
    refetchInterval: query => {
      // Poll every 3 seconds while processing
      const data = query.state.data
      if (data?.status === 'processing') {
        return 3000
      }
      // Also poll if still in progress
      if (
        data?.reportLoading?.status === 'in_progress' ||
        data?.reportLoading?.status === 'pending'
      ) {
        return 3000
      }
      // Stop polling when completed or failed
      return false
    },
    retry: 1, // Retry once on error
  })
}
