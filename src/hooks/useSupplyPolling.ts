/**
 * Hook for supply status polling and manual sync
 * Story 53.7-FE: Status Polling & Sync
 * Epic 53-FE: Supply Management UI
 *
 * Auto-polling for CLOSED/DELIVERING supplies with manual sync support.
 * Rate limited: 1 manual sync per 5 minutes.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupplies, syncSupplies, suppliesQueryKeys } from '@/lib/api/supplies'
import type {
  SupplyStatus,
  SuppliesListResponse,
  SyncSuppliesResponse,
  SupplyStatusChange,
} from '@/types/supplies'

// =============================================================================
// Constants
// =============================================================================

/** Polling configuration constants */
export const POLLING_CONFIG = {
  /** Default polling interval (30 seconds) */
  defaultInterval: 30000,
  /** Interval for DELIVERING status (60 seconds) */
  deliveringInterval: 60000,
  /** Terminal statuses - stop polling when reached */
  terminalStatuses: ['DELIVERED', 'CANCELLED'] as SupplyStatus[],
  /** Active statuses - poll while in these states */
  activeStatuses: ['CLOSED', 'DELIVERING'] as SupplyStatus[],
  /** Max polling attempts before auto-stop */
  maxAttempts: 120,
  /** Max consecutive errors before stopping */
  maxConsecutiveErrors: 3,
  /** Rate limit for manual sync (5 minutes) */
  manualSyncRateLimitMs: 5 * 60 * 1000,
} as const

// =============================================================================
// Query Keys
// =============================================================================

/** Query keys for supply polling */
export const supplyPollingQueryKeys = {
  all: ['supply-polling'] as const,
  active: () => [...supplyPollingQueryKeys.all, 'active'] as const,
  sync: () => [...supplyPollingQueryKeys.all, 'sync'] as const,
}

// =============================================================================
// Types
// =============================================================================

export interface UseSupplyPollingOptions {
  /** Enable/disable polling */
  enabled?: boolean
  /** Pause polling when window loses focus */
  pauseOnBlur?: boolean
  /** Max consecutive errors before stopping */
  maxConsecutiveErrors?: number
  /** Callback when status changes */
  onStatusChange?: (change: SupplyStatusChange) => void
}

export interface UseSupplyPollingResult {
  /** Whether polling is active */
  isPolling: boolean
  /** Whether polling is paused (window blur) */
  isPaused: boolean
  /** Current polling interval in ms */
  currentInterval: number
  /** Count of consecutive errors */
  consecutiveErrors: number
  /** List of supplies with changed status */
  changedSupplies: SupplyStatusChange[]
  /** Active supplies count (CLOSED/DELIVERING) */
  activeCount: number
  /** Last sync timestamp (formatted) */
  lastSyncFormatted: string
  /** Seconds until next sync */
  nextSyncIn: number
  /** Query error */
  error: Error | null
  /** Query success state */
  isSuccess: boolean
  /** Acknowledge and clear changed supplies */
  acknowledgeChanges: () => void
}

// =============================================================================
// useSupplyPolling Hook
// =============================================================================

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

      // Check if any supplies are in active status
      const hasActive = data.items.some(s => POLLING_CONFIG.activeStatuses.includes(s.status))
      if (!hasActive) return false

      // Use longer interval if all active are DELIVERING
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
      // Invalidate supplies list on status change
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

// =============================================================================
// Types for useManualSync
// =============================================================================

export interface UseManualSyncResult {
  /** Trigger manual sync */
  sync: () => void
  /** Whether sync is in progress */
  isSyncing: boolean
  /** Whether sync can be triggered (not rate limited) */
  canSync: boolean
  /** Last sync timestamp */
  lastSyncAt: Date | null
  /** Seconds until rate limit resets */
  rateLimitCountdown: number
  /** Sync response data */
  data: SyncSuppliesResponse | null
  /** Sync error */
  error: Error | null
  /** Whether last sync was successful */
  isSuccess: boolean
  /** Whether last sync had error */
  isError: boolean
}

// =============================================================================
// useManualSync Hook
// =============================================================================

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
