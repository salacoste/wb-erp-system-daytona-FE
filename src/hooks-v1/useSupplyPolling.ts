'use client'

/**
 * Hook for supply status polling and manual sync
 * Story 53.7-FE: Status Polling & Sync
 * Epic 53-FE: Supply Management UI
 *
 * Split into multiple files for Story 74.4 (file size compliance).
 * Constants/types in supply-polling-constants.ts, manual sync in useManualSync.ts.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getSupplies, suppliesQueryKeys } from '@/lib/api/supplies'
import type { SupplyStatus, SuppliesListResponse, SupplyStatusChange } from '@/types/supplies'
import {
  POLLING_CONFIG,
  supplyPollingQueryKeys,
  type UseSupplyPollingOptions,
  type UseSupplyPollingResult,
} from './supply-polling-constants'

// Re-exports for backward compatibility
export { POLLING_CONFIG, supplyPollingQueryKeys } from './supply-polling-constants'
export type {
  UseSupplyPollingOptions,
  UseSupplyPollingResult,
  UseManualSyncResult,
} from './supply-polling-constants'
export { useManualSync } from './useManualSync'

/**
 * Hook for auto-polling supply statuses
 */
export function useSupplyPolling(options: UseSupplyPollingOptions = {}): UseSupplyPollingResult {
  const {
    enabled = true,
    pauseOnBlur = true,
    maxConsecutiveErrors = POLLING_CONFIG.maxConsecutiveErrors,
    onStatusChange,
  } = options

  const queryClient = useQueryClient()
  const [isPaused, setIsPaused] = useState(false)
  const [changedSupplies, setChangedSupplies] = useState<SupplyStatusChange[]>([])
  const [consecutiveErrors, setConsecutiveErrors] = useState(0)
  const [nextSyncIn, setNextSyncIn] = useState(30)

  const previousSuppliesRef = useRef<Map<string, SupplyStatus>>(new Map())
  const onStatusChangeRef = useRef(onStatusChange)

  // Update callback ref
  useEffect(() => {
    onStatusChangeRef.current = onStatusChange
  }, [onStatusChange])

  // Window focus/blur handling
  useEffect(() => {
    if (!pauseOnBlur) return

    const handleBlur = () => setIsPaused(true)
    const handleFocus = () => setIsPaused(false)

    window.addEventListener('blur', handleBlur)
    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('focus', handleFocus)
    }
  }, [pauseOnBlur])

  // Countdown timer
  useEffect(() => {
    if (!enabled || isPaused) return

    const interval = setInterval(() => {
      setNextSyncIn(prev => (prev > 0 ? prev - 1 : 30))
    }, 1000)

    return () => clearInterval(interval)
  }, [enabled, isPaused])

  // Query for active supplies
  const query = useQuery({
    queryKey: supplyPollingQueryKeys.active(),
    queryFn: () => getSupplies({ status: undefined, limit: 100 }),
    enabled: enabled && !isPaused && consecutiveErrors < maxConsecutiveErrors,
    refetchInterval: query => {
      if (!enabled || isPaused) return false
      if (consecutiveErrors >= maxConsecutiveErrors) return false

      const data = query.state.data as SuppliesListResponse | undefined
      if (!data?.items) return POLLING_CONFIG.defaultInterval

      const hasActive = data.items.some(s => POLLING_CONFIG.activeStatuses.includes(s.status))
      if (!hasActive) return false

      const allDelivering = data.items
        .filter(s => POLLING_CONFIG.activeStatuses.includes(s.status))
        .every(s => s.status === 'DELIVERING')

      return allDelivering ? POLLING_CONFIG.deliveringInterval : POLLING_CONFIG.defaultInterval
    },
    refetchIntervalInBackground: false,
  })

  // Detect status changes
  useEffect(() => {
    if (!query.data?.items) return

    const currentMap = new Map<string, SupplyStatus>()
    const changes: SupplyStatusChange[] = []

    for (const supply of query.data.items) {
      currentMap.set(supply.id, supply.status)

      const prevStatus = previousSuppliesRef.current.get(supply.id)
      if (prevStatus && prevStatus !== supply.status) {
        const change: SupplyStatusChange = {
          supplyId: supply.id,
          oldStatus: prevStatus,
          newStatus: supply.status,
        }
        changes.push(change)
        onStatusChangeRef.current?.(change)
      }
    }

    if (changes.length > 0) {
      setChangedSupplies(prev => [...prev, ...changes])
      queryClient.invalidateQueries({ queryKey: suppliesQueryKeys.all })
    }

    previousSuppliesRef.current = currentMap
    setNextSyncIn(30)
  }, [query.data, queryClient])

  // Track consecutive errors
  useEffect(() => {
    if (query.error) {
      setConsecutiveErrors(prev => prev + 1)
    } else if (query.isSuccess) {
      setConsecutiveErrors(0)
    }
  }, [query.error, query.isSuccess])

  const acknowledgeChanges = useCallback(() => {
    setChangedSupplies([])
  }, [])

  const activeCount =
    query.data?.items.filter(s => POLLING_CONFIG.activeStatuses.includes(s.status)).length ?? 0

  const lastSyncFormatted = query.dataUpdatedAt
    ? new Date(query.dataUpdatedAt).toLocaleTimeString('ru-RU')
    : 'Не синхронизировано'

  const currentInterval = query.data?.items?.every(s => s.status === 'DELIVERING')
    ? POLLING_CONFIG.deliveringInterval
    : POLLING_CONFIG.defaultInterval

  return {
    isPolling: query.isFetching || (enabled && !isPaused && activeCount > 0),
    isPaused,
    currentInterval,
    consecutiveErrors,
    changedSupplies,
    activeCount,
    lastSyncFormatted,
    nextSyncIn,
    error: query.error as Error | null,
    isSuccess: query.isSuccess,
    acknowledgeChanges,
  }
}
