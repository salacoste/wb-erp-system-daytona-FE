/**
 * Types for COGS assignment with margin polling
 * Story 4.8: Margin Recalculation Polling & Real-time Updates
 *
 * Extracted from useSingleCogsAssignmentWithPolling.ts (Epic 74, Story 74.4)
 * Pure types — no 'use client' needed
 */

import type { SingleCogsAssignmentParams } from './useSingleCogsAssignment'

/**
 * Mutation options passed to the mutate() wrapper
 */
export interface CogsMutationCallbackOptions {
  onSuccess?: (data: unknown) => void
  onError?: (error: Error) => void
}

/**
 * Return type from useSingleCogsAssignmentWithPolling hook
 */
export interface UseSingleCogsAssignmentWithPollingResult {
  /** Trigger COGS assignment with automatic margin polling */
  mutate: (params: SingleCogsAssignmentParams, options?: CogsMutationCallbackOptions) => void
  /** Whether COGS assignment mutation is pending */
  isPending: boolean
  /** Whether COGS assignment succeeded */
  isSuccess: boolean
  /** Whether COGS assignment failed */
  isError: boolean
  /** COGS assignment error */
  error: Error | null
  /** COGS assignment response data */
  data: unknown
  /** Whether margin polling is active */
  isPolling: boolean
  /** Number of polling attempts */
  pollingAttempts: number
  /** Whether polling timed out */
  pollingTimeout: boolean
  /** Calculated margin (null if not available yet) */
  margin: number | null
  /** Whether polling completed but margin was not available (no sales data, COGS date mismatch) */
  completedWithoutMargin: boolean
}
