'use client'

/**
 * Hook for manual sync with rate limiting (5 minutes)
 * Extracted from useSupplyPolling.ts for Story 74.4 (file size compliance)
 *
 * Story 53.7-FE: Status Polling & Sync
 * Epic 53-FE: Supply Management UI
 */

import { useState, useEffect, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { syncSupplies, suppliesQueryKeys } from '@/lib/api/supplies'
import {
  POLLING_CONFIG,
  supplyPollingQueryKeys,
  type UseManualSyncResult,
} from './supply-polling-constants'

/**
 * Hook for manual sync with rate limiting (5 minutes)
 */
export function useManualSync(): UseManualSyncResult {
  const queryClient = useQueryClient()
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null)
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0)

  // Rate limit countdown timer
  useEffect(() => {
    if (rateLimitCountdown <= 0) return

    const interval = setInterval(() => {
      setRateLimitCountdown(prev => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(interval)
  }, [rateLimitCountdown])

  const mutation = useMutation({
    mutationFn: syncSupplies,
    onSuccess: data => {
      const now = new Date()
      setLastSyncAt(now)
      setRateLimitCountdown(POLLING_CONFIG.manualSyncRateLimitMs / 1000)

      // Invalidate supplies queries to refresh data
      queryClient.invalidateQueries({ queryKey: suppliesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: supplyPollingQueryKeys.all })

      // Update individual supply caches if status changed
      for (const change of data.statusChanges) {
        queryClient.invalidateQueries({
          queryKey: suppliesQueryKeys.detail(change.supplyId),
        })
      }
    },
  })

  const canSync = rateLimitCountdown === 0 && !mutation.isPending

  const sync = useCallback(() => {
    if (canSync) {
      mutation.mutate()
    }
  }, [canSync, mutation])

  return {
    sync,
    isSyncing: mutation.isPending,
    canSync,
    lastSyncAt,
    rateLimitCountdown,
    data: mutation.data ?? null,
    error: mutation.error as Error | null,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
  }
}
