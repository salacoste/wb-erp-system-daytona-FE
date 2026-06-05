/**
 * Reorder Dashboard React Query Hooks
 * Hooks for list, metrics, refresh, and status update.
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getReorderRecommendations,
  getReorderMetrics,
  refreshReorderRecommendations,
  updateReorderStatus,
  reorderQueryKeys,
} from '@/lib/api/reorder-recommendations'
import type { UpdateReorderStatusPayload } from '@/types/reorder-recommendations'

const STALE_TIME = 60_000
const GC_TIME = 300_000

/** Fetch reorder recommendations list with optional filters */
export function useReorderRecommendations(params?: {
  status?: string
  urgency?: string
  limit?: number
}) {
  return useQuery({
    queryKey: reorderQueryKeys.list(params),
    queryFn: () => getReorderRecommendations(params),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: 1,
  })
}

/** Fetch fulfillment metrics */
export function useReorderMetrics() {
  return useQuery({
    queryKey: reorderQueryKeys.metrics(),
    queryFn: getReorderMetrics,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: 1,
  })
}

/** Trigger a recompute of recommendations */
export function useReorderRefresh() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: refreshReorderRecommendations,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reorderQueryKeys.all })
    },
  })
}

/** Update status of a recommendation (ordered / received) */
export function useUpdateReorderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateReorderStatusPayload }) =>
      updateReorderStatus(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reorderQueryKeys.all })
    },
  })
}
