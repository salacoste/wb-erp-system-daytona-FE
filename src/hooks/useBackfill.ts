/**
 * Backfill Admin React Query Hooks
 * Story 51.10-FE: Backfill Admin Types & Hooks
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * React Query hooks for backfill operations (Owner role only).
 * @see docs/stories/epic-51/story-51.10-fe-backfill-admin-types.md
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getBackfillStatus,
  startBackfill,
  pauseBackfill,
  resumeBackfill,
  backfillQueryKeys,
} from '@/lib/api/backfill'
import { isBackfillActive } from '@/lib/backfill-utils'
import { useAuthStore } from '@/stores/authStore'
import type {
  BackfillStatusResponse,
  StartBackfillRequest,
  StartBackfillResponse,
  BackfillActionResponse,
  UseBackfillStatusOptions,
  UseBackfillMutationOptions,
} from '@/types/backfill'

export { backfillQueryKeys }

/** Cache config: 10s stale for polling, 5min gc */
const BACKFILL_CACHE = {
  staleTime: 10 * 1000,
  gcTime: 5 * 60 * 1000,
  defaultPollingInterval: 5 * 1000,
}

/** Hook to fetch backfill status for all cabinets (Owner role required) */
export function useBackfillStatus(options: UseBackfillStatusOptions = {}) {
  const { enabled = true, polling = false, pollingInterval } = options
  const { user } = useAuthStore()
  const isOwner = user?.role === 'Owner'

  const query = useQuery<BackfillStatusResponse, Error>({
    queryKey: backfillQueryKeys.status(),
    queryFn: async () => {
      if (!isOwner) throw new Error('Доступ запрещен: требуется роль Owner')
      return getBackfillStatus()
    },
    enabled: enabled && isOwner,
    staleTime: BACKFILL_CACHE.staleTime,
    gcTime: BACKFILL_CACHE.gcTime,
    refetchInterval: polling ? (pollingInterval ?? BACKFILL_CACHE.defaultPollingInterval) : false,
    retry: 1,
  })

  const hasActiveBackfills = query.data?.some(c => isBackfillActive(c.status)) ?? false

  return { ...query, hasActiveBackfills }
}

/** Hook to start backfill process (Owner role required) */
export function useStartBackfill(options: UseBackfillMutationOptions<StartBackfillResponse> = {}) {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation<StartBackfillResponse, Error, StartBackfillRequest>({
    mutationFn: async request => {
      if (user?.role !== 'Owner') throw new Error('Доступ запрещен: требуется роль Owner')
      return startBackfill(request)
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: backfillQueryKeys.all })
      toast.success('Импорт исторических данных запущен', {
        description: `Примерное время: ~${data.estimated_duration_minutes} мин`,
      })
      options.onSuccess?.(data)
    },
    onError: error => {
      toast.error('Ошибка запуска импорта', { description: error.message })
      options.onError?.(error)
    },
  })
}

/** Hook to pause backfill process (Owner role required) */
export function usePauseBackfill(options: UseBackfillMutationOptions<BackfillActionResponse> = {}) {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation<BackfillActionResponse, Error, { cabinet_id: string }>({
    mutationFn: async ({ cabinet_id }) => {
      if (user?.role !== 'Owner') throw new Error('Доступ запрещен: требуется роль Owner')
      return pauseBackfill(cabinet_id)
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: backfillQueryKeys.all })
      toast.success('Импорт приостановлен', { description: data.message })
      options.onSuccess?.(data)
    },
    onError: error => {
      toast.error('Ошибка приостановки импорта', { description: error.message })
      options.onError?.(error)
    },
  })
}

/** Hook to resume backfill process (Owner role required) */
export function useResumeBackfill(
  options: UseBackfillMutationOptions<BackfillActionResponse> = {}
) {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation<BackfillActionResponse, Error, { cabinet_id: string }>({
    mutationFn: async ({ cabinet_id }) => {
      if (user?.role !== 'Owner') throw new Error('Доступ запрещен: требуется роль Owner')
      return resumeBackfill(cabinet_id)
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: backfillQueryKeys.all })
      toast.success('Импорт возобновлен', { description: data.message })
      options.onSuccess?.(data)
    },
    onError: error => {
      toast.error('Ошибка возобновления импорта', { description: error.message })
      options.onError?.(error)
    },
  })
}

/** Hook to check if current user can access backfill admin features */
export function useCanAccessBackfill() {
  const { user } = useAuthStore()
  const isOwner = user?.role === 'Owner'
  return { canAccessBackfill: isOwner, userRole: user?.role ?? null }
}

/** Hook to manually invalidate all backfill queries */
export function useInvalidateBackfillQueries() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: backfillQueryKeys.all })
}
