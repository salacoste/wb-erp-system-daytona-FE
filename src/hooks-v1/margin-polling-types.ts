/**
 * Types and constants for margin polling with TanStack Query
 * Story 4.8: Margin Recalculation Polling & Real-time Updates
 * Request #21: Updated to use lightweight margin-status endpoint (Epic 22)
 *
 * Extracted from useMarginPollingWithQuery.ts (Epic 74, Story 74.4)
 */

import type { PollingConfig } from '@/lib/margin-helpers'

/**
 * Default polling strategy configuration
 * Based on Request #21 recommendations:
 * - Interval: 2.5s (backend recommendation: 2-3s)
 * - Max attempts: 24 (60s total timeout for single product)
 * - Estimated time: 10s (typical calculation time)
 */
export const DEFAULT_POLLING_STRATEGY: PollingConfig = {
  interval: 2500,
  maxAttempts: 24,
  estimatedTime: 10000,
}

/**
 * Options for margin polling hook
 */
export interface UseMarginPollingWithQueryOptions {
  /** Product ID to poll for */
  nmId: string
  /** Whether polling is enabled */
  enabled: boolean
  /** Polling strategy configuration */
  strategy: PollingConfig
  /** Callback when margin becomes available */
  onSuccess?: (margin: number) => void
  /** Callback when polling times out */
  onTimeout?: () => void
  /** Callback on polling error */
  onError?: (error: Error) => void
}

/**
 * Result from margin polling hook
 */
export interface UseMarginPollingWithQueryResult {
  /** Whether polling is currently active */
  isPolling: boolean
  /** Current attempt number (1-based) */
  attempts: number
  /** Whether polling timed out */
  timeout: boolean
  /** Calculated margin percentage (null if not available yet) */
  margin: number | null
  /** Error if polling failed */
  error: Error | null
  /** Whether polling completed but margin was not available (no sales data, COGS date mismatch) */
  completedWithoutMargin: boolean
}
