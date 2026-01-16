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
import type {
  ExportRequest,
  ExportCreateResponse,
  ExportStatus,
} from '@/types/analytics'

/**
 * Maximum polling time in milliseconds (2 minutes)
 */
const MAX_POLLING_TIME_MS = 2 * 60 * 1000

/**
 * Polling interval in milliseconds
 */
const POLLING_INTERVAL_MS = 2000

/**
 * Hook return type
 */
export interface UseExportAnalyticsReturn {
  /** Function to create a new export */
  createExport: (request: ExportRequest) => void
  /** Whether export creation is in progress */
  isCreating: boolean
  /** Current export status (null if no active export) */
  status: ExportStatus | null
  /** Whether polling is active */
  isPolling: boolean
  /** Whether timeout occurred */
  isTimedOut: boolean
  /** Reset export state to start fresh */
  reset: () => void
  /** Error from creation mutation */
  createError: Error | null
}

/**
 * Hook for creating and monitoring analytics exports
 *
 * @example
 * ```tsx
 * const { createExport, status, isCreating, reset } = useExportAnalytics()
 *
 * // Create export
 * createExport({
 *   type: 'by-sku',
 *   weekStart: '2025-W44',
 *   weekEnd: '2025-W47',
 *   format: 'xlsx',
 *   includeCogs: true,
 * })
 *
 * // Monitor status
 * if (status?.status === 'completed') {
 *   window.open(status.download_url, '_blank')
 * }
 *
 * // Reset for new export
 * reset()
 * ```
 */
export function useExportAnalytics(): UseExportAnalyticsReturn {
  const queryClient = useQueryClient()

  // Export ID from creation response
  const [exportId, setExportId] = useState<string | null>(null)

  // Polling start time for timeout tracking
  const pollingStartRef = useRef<number | null>(null)

  // Timeout state
  const [isTimedOut, setIsTimedOut] = useState(false)

  // Create export mutation
  const createMutation = useMutation({
    mutationFn: async (request: ExportRequest): Promise<ExportCreateResponse> => {
      // Map camelCase to snake_case for API
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
    onSuccess: (response) => {
      setExportId(response.export_id)
      pollingStartRef.current = Date.now()
      setIsTimedOut(false)
    },
    onError: () => {
      setExportId(null)
      pollingStartRef.current = null
    },
  })

  // Determine if we should poll based on status
  const shouldPoll = useCallback((status: ExportStatus | undefined): boolean => {
    if (!status) return true
    if (status.status === 'completed' || status.status === 'failed') return false
    return true
  }, [])

  // Status polling query
  const statusQuery = useQuery({
    queryKey: ['exports', exportId],
    queryFn: async (): Promise<ExportStatus> => {
      if (!exportId) throw new Error('No export ID')
      return apiClient.get<ExportStatus>(`/v1/exports/${exportId}`)
    },
    enabled: !!exportId && !isTimedOut,
    refetchInterval: (query) => {
      const status = query.state.data
      if (!shouldPoll(status)) return false
      return POLLING_INTERVAL_MS
    },
    // Don't refetch on mount/reconnect when completed
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

    // Check immediately and set up interval
    checkTimeout()
    const interval = setInterval(checkTimeout, 1000)

    return () => clearInterval(interval)
  }, [exportId, statusQuery.data])

  // Reset function to clear all state
  const reset = useCallback(() => {
    setExportId(null)
    pollingStartRef.current = null
    setIsTimedOut(false)
    createMutation.reset()
    // Invalidate any cached export status
    queryClient.removeQueries({ queryKey: ['exports'] })
  }, [createMutation, queryClient])

  // Build status with timeout override
  const effectiveStatus: ExportStatus | null = isTimedOut
    ? {
        export_id: exportId || '',
        status: 'failed',
        error_message: 'Экспорт занял слишком много времени. Попробуйте еще раз.',
      }
    : statusQuery.data ?? null

  return {
    createExport: createMutation.mutate,
    isCreating: createMutation.isPending,
    status: effectiveStatus,
    isPolling: !!exportId && !isTimedOut && shouldPoll(statusQuery.data),
    isTimedOut,
    reset,
    createError: createMutation.error,
  }
}

/**
 * Format bytes to human-readable string
 * @param bytes - Number of bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes: number | undefined): string {
  if (bytes === undefined || bytes === null) return '—'
  if (bytes === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`
}

/**
 * Format date to Russian locale
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export function formatExpirationDate(dateString: string | undefined): string {
  if (!dateString) return '—'

  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateString
  }
}
