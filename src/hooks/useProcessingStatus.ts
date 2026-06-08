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
import {
  MAX_EMPTY_POLLS,
  aggregateProcessingStatus,
  getRefetchInterval,
  type BatchListResponse,
} from '@/lib/processing-polling-strategy'

// Re-export for backward compatibility (tests import these from the hook)
export { MAX_EMPTY_POLLS, getRefetchInterval } from '@/lib/processing-polling-strategy'

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
    retry: 1,
  })
}
