/**
 * Reorder Dashboard page-level state hook
 * Manages filter state and wires data hooks.
 */

'use client'

import { useState, useCallback } from 'react'
import type { ReorderStatusFilter } from '@/types/reorder-recommendations'
import {
  useReorderRecommendations,
  useReorderMetrics,
  useReorderRefresh,
  useUpdateReorderStatus,
} from '@/hooks/useReorderDashboard'

export function useReorderPageState() {
  const [statusFilter, setStatusFilter] = useState<ReorderStatusFilter>('all')

  const recommendations = useReorderRecommendations({
    status: statusFilter,
    limit: 50,
  })

  const metrics = useReorderMetrics()
  const refresh = useReorderRefresh()
  const updateStatus = useUpdateReorderStatus()

  const handleStatusFilterChange = useCallback((value: ReorderStatusFilter) => {
    setStatusFilter(value)
  }, [])

  const handleRefresh = useCallback(() => {
    refresh.mutate()
  }, [refresh])

  const handleMarkOrdered = useCallback(
    (id: string) => {
      updateStatus.mutate({ id, payload: { status: 'ordered' } })
    },
    [updateStatus]
  )

  const handleMarkReceived = useCallback(
    (id: string) => {
      updateStatus.mutate({ id, payload: { status: 'received' } })
    },
    [updateStatus]
  )

  return {
    statusFilter,
    handleStatusFilterChange,
    recommendations: recommendations.data ?? [],
    isLoadingRecommendations: recommendations.isLoading,
    recommendationsError: recommendations.error,
    metrics: metrics.data,
    isLoadingMetrics: metrics.isLoading,
    isRefreshing: refresh.isPending,
    handleRefresh,
    handleMarkOrdered,
    handleMarkReceived,
    isUpdating: updateStatus.isPending,
  }
}
