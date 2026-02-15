/**
 * Hook for triggering and polling weekly sanity check task
 * Story 42.2-FE: Add Sanity Check Hook
 * Epic 42-FE: Task Handlers Adaptation
 *
 * Enqueues weekly_sanity_check task and polls for completion.
 * @see docs/stories/epic-42/story-42.2-fe-sanity-check-hook.md
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/authStore'
import type {
  SanityCheckPayload,
  SanityCheckResult,
  EnqueueTaskResponse,
  TaskStatusResponse,
} from '@/types/tasks'

// =============================================================================
// Query Keys
// =============================================================================

export const sanityCheckQueryKeys = {
  all: ['sanity-check'] as const,
  status: (taskUuid: string) => [...sanityCheckQueryKeys.all, 'status', taskUuid] as const,
}

// =============================================================================
// Constants
// =============================================================================

/** Default polling interval in milliseconds */
const DEFAULT_POLL_INTERVAL = 2000

/** Default max polling attempts */
const DEFAULT_MAX_ATTEMPTS = 30

// =============================================================================
// Types
// =============================================================================

/** Parameters for runCheck method */
export interface RunCheckParams {
  /** Optional: specific week to validate (ISO format, e.g., "2025-W49") */
  week?: string
}

/** Options for useSanityCheck hook */
export interface UseSanityCheckOptions {
  /** Polling interval in ms (default: 2000) */
  pollInterval?: number
  /** Max polling attempts (default: 30) */
  maxAttempts?: number
  /** Disable polling after enqueue (useful for testing) */
  enablePolling?: boolean
  /** Callback on successful completion */
  onSuccess?: (result: SanityCheckResult) => void
  /** Callback on error */
  onError?: (error: Error) => void
}

/** Return type for useSanityCheck hook */
export interface UseSanityCheckReturn {
  /** Trigger sanity check task */
  runCheck: (params: RunCheckParams) => void
  /** Whether task is being enqueued */
  isEnqueuing: boolean
  /** Whether polling is in progress */
  isPolling: boolean
  /** Whether operation is pending (enqueuing or polling) */
  isPending: boolean
  /** Task result (when completed) */
  result: SanityCheckResult | undefined
  /** Error (if any) */
  error: Error | null
  /** Task UUID (after enqueue) */
  taskUuid: string | null
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook to trigger and poll weekly sanity check
 *
 * @example
 * const { runCheck, isPending, result, error } = useSanityCheck({
 *   onSuccess: (result) => console.log('Checks:', result.checks_passed),
 * })
 *
 * // Trigger check for all weeks
 * runCheck({})
 *
 * // Trigger check for specific week
 * runCheck({ week: '2025-W49' })
 */
export function useSanityCheck(options: UseSanityCheckOptions = {}): UseSanityCheckReturn {
  const {
    pollInterval = DEFAULT_POLL_INTERVAL,
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    enablePolling = true,
    onSuccess,
    onError,
  } = options

  const { cabinetId } = useAuthStore()
  const queryClient = useQueryClient()

  // State
  const [taskUuid, setTaskUuid] = useState<string | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const attemptsRef = useRef(0)

  // Refs for callbacks (avoid stale closures)
  const onSuccessRef = useRef(onSuccess)
  const onErrorRef = useRef(onError)
  useEffect(() => {
    onSuccessRef.current = onSuccess
    onErrorRef.current = onError
  }, [onSuccess, onError])

  // ==========================================================================
  // Enqueue Mutation
  // ==========================================================================

  const enqueueMutation = useMutation({
    mutationFn: async (params: RunCheckParams): Promise<EnqueueTaskResponse> => {
      if (!cabinetId) {
        throw new Error('Cabinet ID is required')
      }

      const payload: SanityCheckPayload & { cabinet_id: string } = {
        cabinet_id: cabinetId,
      }
      if (params.week) {
        payload.week = params.week
      }

      return apiClient.post<EnqueueTaskResponse>('/v1/tasks/enqueue', {
        task_type: 'weekly_sanity_check',
        payload,
      })
    },
    onSuccess: data => {
      toast.info('Проверка данных запущена', {
        description: `Задача ${data.task_uuid.substring(0, 8)}... поставлена в очередь`,
      })
      if (enablePolling) {
        setTaskUuid(data.task_uuid)
        attemptsRef.current = 0
      }
    },
    onError: err => {
      const error = err as Error
      setError(error)
      toast.error('Ошибка запуска проверки', {
        description: error.message,
      })
      onErrorRef.current?.(error)
    },
  })

  // ==========================================================================
  // Status Polling Query
  // ==========================================================================

  const statusQuery = useQuery<TaskStatusResponse<SanityCheckResult>>({
    queryKey: sanityCheckQueryKeys.status(taskUuid ?? ''),
    queryFn: async () => {
      if (!taskUuid) throw new Error('No task UUID')
      return apiClient.get<TaskStatusResponse<SanityCheckResult>>(`/v1/tasks/${taskUuid}`)
    },
    enabled: !!taskUuid && enablePolling,
    refetchInterval: query => {
      const data = query.state.data
      // Stop polling on completion or failure
      if (data?.status === 'completed' || data?.status === 'failed') {
        return false
      }
      // Stop polling if max attempts reached
      if (attemptsRef.current >= maxAttempts) {
        return false
      }
      attemptsRef.current += 1
      return pollInterval
    },
    retry: 1,
  })

  // ==========================================================================
  // Handle Completion/Failure
  // ==========================================================================

  const handleCompletion = useCallback(
    (result: SanityCheckResult) => {
      if (result.checks_failed > 0) {
        toast.warning(`Проверка завершена: ${result.checks_failed} проблемы`, {
          description: `${result.checks_passed} проверок пройдено`,
        })
      } else {
        toast.success('Все проверки пройдены', {
          description: `${result.checks_passed} проверок выполнено`,
        })
      }
      onSuccessRef.current?.(result)
      setTaskUuid(null)
      queryClient.invalidateQueries({ queryKey: sanityCheckQueryKeys.all })
    },
    [queryClient]
  )

  const handleFailure = useCallback((errorMsg: string) => {
    const err = new Error(errorMsg)
    setError(err)
    toast.error('Ошибка проверки данных', {
      description: errorMsg,
    })
    onErrorRef.current?.(err)
    setTaskUuid(null)
  }, [])

  // Effect to handle status changes
  useEffect(() => {
    if (!statusQuery.data) return

    const { status, metrics, error: taskError } = statusQuery.data

    if (status === 'completed' && metrics) {
      handleCompletion(metrics)
    } else if (status === 'failed') {
      handleFailure(taskError || 'Sanity check failed')
    }
  }, [statusQuery.data, handleCompletion, handleFailure])

  // ==========================================================================
  // Return Values
  // ==========================================================================

  const isEnqueuing = enqueueMutation.isPending
  const isPolling = !!taskUuid && statusQuery.isFetching
  const isPending =
    isEnqueuing ||
    (!!taskUuid &&
      statusQuery.data?.status !== 'completed' &&
      statusQuery.data?.status !== 'failed')

  return {
    runCheck: enqueueMutation.mutate,
    isEnqueuing,
    isPolling,
    isPending,
    result: statusQuery.data?.metrics,
    error: error || (statusQuery.error as Error | null) || (enqueueMutation.error as Error | null),
    taskUuid,
  }
}
