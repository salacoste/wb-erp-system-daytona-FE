/**
 * Supply Polling Constants, Query Keys & Types
 * Extracted from useSupplyPolling.ts for Story 74.4 (file size compliance)
 *
 * Pure data/config file - no React hooks, no 'use client' needed.
 */

import type { SupplyStatus, SupplyStatusChange, SyncSuppliesResponse } from '@/types/supplies'

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
