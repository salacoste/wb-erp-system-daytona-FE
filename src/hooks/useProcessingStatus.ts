/**
 * Hook for monitoring processing status during onboarding
 * Story 2.3: Data Processing Status Indicators
 *
 * Updated: Uses /v1/imports/historical API for batch progress tracking
 * instead of /v1/tasks (which doesn't have batch progress data)
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/authStore'
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
  // Find the most recent batch (or active one)
  const activeBatch = batches.find(
    (b) => b.status === 'in_progress' || b.status === 'pending'
  )
  const latestBatch = activeBatch || batches[0]

  // Calculate progress based on batch
  const progressPercent = latestBatch
    ? latestBatch.progressPercent ??
      (latestBatch.totalWeeks > 0
        ? Math.round((latestBatch.completedWeeks / latestBatch.totalWeeks) * 100)
        : 0)
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
  }
}

/**
 * Hook to monitor processing status for onboarding
 * Polls imports/historical API every 3 seconds while processing
 */
export function useProcessingStatus() {
  const { cabinetId } = useAuthStore()

  return useQuery({
    queryKey: ['processing-status', cabinetId],
    queryFn: async (): Promise<ProcessingStatus> => {
      if (!cabinetId) {
        throw new Error('Cabinet ID not found')
      }

      try {
        // Get batches for this cabinet (most recent first, including active)
        const response = await apiClient.get<BatchListResponse>(
          '/v1/imports/historical?limit=5'
        )

        const batches = response.batches || []

        // If no batches found, check if this is a new cabinet
        // that might not have started processing yet
        if (batches.length === 0) {
          return {
            status: 'processing',
            productParsing: {
              progress: 0,
              status: 'pending',
            },
            reportLoading: {
              progress: 0,
              status: 'pending',
            },
          }
        }

        return aggregateProcessingStatus(batches)
      } catch (error) {
        // If API returns 401/403, the user might not have token configured
        // Return a pending state instead of throwing
        console.warn('[useProcessingStatus] Error fetching batches:', error)
        return {
          status: 'processing',
          productParsing: {
            progress: 0,
            status: 'pending',
          },
          reportLoading: {
            progress: 0,
            status: 'pending',
          },
        }
      }
    },
    enabled: !!cabinetId,
    refetchInterval: (query) => {
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
