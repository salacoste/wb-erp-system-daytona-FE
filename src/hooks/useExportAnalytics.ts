/**
 * Hook for exporting analytics data
 * Story 6.5-FE: Export Analytics UI
 *
 * Features:
 * - Create export request (POST /v1/exports/analytics)
 * - Poll export status (GET /v1/exports/:id) every 2 seconds
 * - Auto-stop polling when completed or failed
 * - Timeout handling (max 2 minutes)
 * - Reset function to clear state
 *
 * Reference: frontend/docs/stories/epic-6/story-6.5-fe-export-analytics.md
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ExportRequest, ExportCreateResponse, ExportStatus } from '@/types/analytics'
import {
  MAX_POLLING_TIME_MS,
  POLLING_INTERVAL_MS,
  shouldContinuePolling,
  buildTimeoutStatus,
} from './useExportAnalytics-utils'

// Re-export for consumers
export {
  type UseExportAnalyticsReturn,
  formatBytes,
  formatExpirationDate,
} from './useExportAnalytics-utils'

/**
 * Hook for creating and monitoring analytics exports
 */
export function useExportAnalytics() {
  const queryClient = useQueryClient()
  const [exportId, setExportId] = useState<string | null>(null)
  const pollingStartRef = useRef<number | null>(null)
  const [isTimedOut, setIsTimedOut] = useState(false)

  // Create export mutation
  const createMutation = useMutation({
    mutationFn: async (request: ExportRequest): Promise<ExportCreateResponse> => {
      const apiRequest = {
        type: request.type,
        week_start: request.weekStart,
        week_end: request.weekEnd,
        week: request.week,
        format: request.format,
        include_cogs: request.includeCogs,
        filters: request.filters,
      }
      return apiClient.post<ExportCreateResponse>('/v1/exports/analytics', apiRequest)
    },
    onSuccess: response => {
      setExportId(response.export_id)
      pollingStartRef.current = Date.now()
      setIsTimedOut(false)
    },
    onError: () => {
      setExportId(null)
      pollingStartRef.current = null
    },
  })

  // Status polling query
  const statusQuery = useQuery({
    queryKey: ['exports', exportId],
    queryFn: async (): Promise<ExportStatus> => {
      if (!exportId) throw new Error('No export ID')
      return apiClient.get<ExportStatus>(`/v1/exports/${exportId}`)
    },
    enabled: !!exportId && !isTimedOut,
    refetchInterval: query => {
      const status = query.state.data
      if (!shouldContinuePolling(status)) return false
      return POLLING_INTERVAL_MS
    },
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })

  // Check for timeout
  useEffect(() => {
    if (!exportId || !pollingStartRef.current) return
    const status = statusQuery.data
    if (status?.status === 'completed' || status?.status === 'failed') return

    const checkTimeout = () => {
      if (pollingStartRef.current) {
        const elapsed = Date.now() - pollingStartRef.current
        if (elapsed >= MAX_POLLING_TIME_MS) {
          setIsTimedOut(true)
        }
      }
    }
    checkTimeout()
    const interval = setInterval(checkTimeout, 1000)
    return () => clearInterval(interval)
  }, [exportId, statusQuery.data])

  // Reset function
  const reset = useCallback(() => {
    setExportId(null)
    pollingStartRef.current = null
    setIsTimedOut(false)
    createMutation.reset()
    queryClient.removeQueries({ queryKey: ['exports'] })
  }, [createMutation, queryClient])

  const effectiveStatus: ExportStatus | null = isTimedOut
    ? buildTimeoutStatus(exportId || '')
    : (statusQuery.data ?? null)

  return {
    createExport: createMutation.mutate,
    isCreating: createMutation.isPending,
    status: effectiveStatus,
    isPolling: !!exportId && !isTimedOut && shouldContinuePolling(statusQuery.data),
    isTimedOut,
    reset,
    createError: createMutation.error,
  }
}
