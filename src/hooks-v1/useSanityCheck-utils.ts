/**
 * Sanity Check - Types, Constants & Query Keys
 * Extracted from useSanityCheck.ts for file size compliance (Epic 74)
 */

import type { SanityCheckResult } from '@/types/tasks'

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
export const DEFAULT_POLL_INTERVAL = 2000

/** Default max polling attempts */
export const DEFAULT_MAX_ATTEMPTS = 30

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
