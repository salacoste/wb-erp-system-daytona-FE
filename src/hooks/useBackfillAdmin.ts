/**
 * FBS Backfill Admin React Query Hooks
 * Story 51.2-FE: FBS Analytics React Query Hooks
 * Epic 51-FE: FBS Historical Analytics (365 Days)
 *
 * Admin hooks for backfill operations (Owner role only).
 * Includes status polling, start, pause, and resume mutations.
 *
 * Reference: docs/stories/epic-51/story-51.2-fe-fbs-analytics-hooks.md
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getBackfillStatus,
  startBackfill,
  pauseBackfill,
  resumeBackfill,
} from '@/lib/api/fbs-analytics'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'
import type {
  BackfillStatusResponse,
  StartBackfillRequest,
  StartBackfillResponse,
  BackfillActionResponse,
} from '@/types/fbs-analytics'
import { fbsAnalyticsQueryKeys, FBS_ANALYTICS_CACHE } from './useFbsAnalytics'

// ============================================================================
// Backfill Query Keys (re-exported for convenience)
// ============================================================================

export const backfillQueryKeys = {
  all: () => fbsAnalyticsQueryKeys.backfill(),
  status: (cabinetId?: string) => fbsAnalyticsQueryKeys.backfillStatus(cabinetId),
}

// ============================================================================
// Backfill Status Hook
// ============================================================================

export interface UseBackfillStatusOptions {
  /** Enable/disable the query */
  enabled?: boolean
  /** Enable polling when backfill is in progress (default: false) */
  enablePolling?: boolean
  /** Custom polling interval in ms (default: 10000) */
  pollingInterval?: number
}

/**
 * Hook to fetch backfill status (Owner role required)
 *
 * @param cabinetId - Optional cabinet ID filter
 * @param options - Hook options including polling configuration
 * @returns Query result with backfill status for cabinet(s)
 *
 * @example
 * const { data, isLoading } = useBackfillStatus(undefined, {
 *   enablePolling: true,
 * });
 */
export function useBackfillStatus(cabinetId?: string, options: UseBackfillStatusOptions = {}) {
  const { enabled = true, enablePolling = false, pollingInterval } = options
  const { user } = useAuthStore()
  const isOwner = user?.role === 'Owner'

  return useQuery<BackfillStatusResponse, Error>({
    queryKey: backfillQueryKeys.status(cabinetId),
    queryFn: async () => {
      if (!isOwner) {
        throw new Error('Доступ запрещен: требуется роль Owner')
      }
      return getBackfillStatus(cabinetId)
    },
    enabled: enabled && isOwner,
    staleTime: FBS_ANALYTICS_CACHE.backfill.staleTime,
    gcTime: FBS_ANALYTICS_CACHE.backfill.gcTime,
    refetchInterval: enablePolling
      ? (pollingInterval ?? FBS_ANALYTICS_CACHE.backfill.refetchInterval)
      : undefined,
    retry: 1,
  })
}

// ============================================================================
// Backfill Mutation Hooks
// ============================================================================

export interface UseStartBackfillOptions {
  onSuccess?: (data: StartBackfillResponse) => void
  onError?: (error: Error) => void
}

/** Hook to start backfill process (Owner role required) */
export function useStartBackfill(options: UseStartBackfillOptions = {}) {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation<StartBackfillResponse, Error, StartBackfillRequest>({
    mutationFn: async request => {
      if (user?.role !== 'Owner') {
        throw new Error('Доступ запрещен: требуется роль Owner')
      }
      return startBackfill(request)
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: backfillQueryKeys.all() })
      toast.success('Импорт исторических данных запущен', {
        description: `Создано ${data.jobCount} задач`,
      })
      options.onSuccess?.(data)
    },
    onError: error => {
      toast.error('Ошибка запуска импорта', { description: error.message })
      options.onError?.(error)
    },
  })
}

export interface UsePauseBackfillOptions {
  onSuccess?: (data: BackfillActionResponse) => void
  onError?: (error: Error) => void
}

/** Hook to pause backfill process (Owner role required) */
export function usePauseBackfill(options: UsePauseBackfillOptions = {}) {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation<BackfillActionResponse, Error, { cabinetId: string }>({
    mutationFn: async ({ cabinetId }) => {
      if (user?.role !== 'Owner') {
        throw new Error('Доступ запрещен: требуется роль Owner')
      }
      return pauseBackfill(cabinetId)
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: backfillQueryKeys.all() })
      toast.success('Импорт приостановлен', { description: data.message })
      options.onSuccess?.(data)
    },
    onError: error => {
      toast.error('Ошибка приостановки импорта', { description: error.message })
      options.onError?.(error)
    },
  })
}

export interface UseResumeBackfillOptions {
  onSuccess?: (data: BackfillActionResponse) => void
  onError?: (error: Error) => void
}

/** Hook to resume backfill process (Owner role required) */
export function useResumeBackfill(options: UseResumeBackfillOptions = {}) {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation<BackfillActionResponse, Error, { cabinetId: string }>({
    mutationFn: async ({ cabinetId }) => {
      if (user?.role !== 'Owner') {
        throw new Error('Доступ запрещен: требуется роль Owner')
      }
      return resumeBackfill(cabinetId)
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: backfillQueryKeys.all() })
      toast.success('Импорт возобновлен', { description: data.message })
      options.onSuccess?.(data)
    },
    onError: error => {
      toast.error('Ошибка возобновления импорта', { description: error.message })
      options.onError?.(error)
    },
  })
}

// ============================================================================
// Helper Hooks
// ============================================================================

/**
 * Hook to check if current user can access backfill admin features
 * @returns Object with canAccessBackfill boolean and user role
 */
export function useCanAccessBackfill() {
  const { user } = useAuthStore()
  const isOwner = user?.role === 'Owner'
  return { canAccessBackfill: isOwner, userRole: user?.role ?? null }
}
