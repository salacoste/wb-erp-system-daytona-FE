/**
 * Refetch interval logic for margin polling with TanStack Query
 * Story 4.8: Margin Recalculation Polling & Real-time Updates
 *
 * Extracted from useMarginPollingWithQuery.ts (Epic 74, Story 74.4)
 * Pure function — no React hooks, no 'use client' needed
 */

import type { MutableRefObject } from 'react'
import { ApiError } from '@/types/api'
import type { MarginCalculationStatusResponse } from '@/types/cogs'
import type { UseMarginPollingWithQueryOptions } from './margin-polling-types'
import { logger } from '@/lib/logger'

/** Query state shape passed by TanStack Query's refetchInterval callback */
export interface RefetchIntervalQueryState {
  state: {
    status: string
    error: Error | null
    data: unknown
    dataUpdatedAt: number
  }
}

/** Refs needed by the refetch interval computation */
export interface RefetchIntervalRefs {
  marginRef: MutableRefObject<number | null>
  errorRef: MutableRefObject<Error | null>
  attemptsRef: MutableRefObject<number>
  timeoutRef: MutableRefObject<boolean>
  onErrorRef: MutableRefObject<((error: Error) => void) | undefined>
  onTimeoutRef: MutableRefObject<(() => void) | undefined>
  lastDataUpdatedAtRef: MutableRefObject<number>
}

/**
 * Compute refetchInterval for TanStack Query polling control.
 * Returns interval in ms to continue polling, or false to stop.
 *
 * Handles: margin found, permanent/transient errors, attempt tracking,
 * completed status, and max attempts timeout.
 */
export function computeRefetchInterval(
  query: RefetchIntervalQueryState,
  queryEnabled: boolean,
  options: UseMarginPollingWithQueryOptions,
  refs: RefetchIntervalRefs
): number | false {
  const {
    marginRef,
    errorRef,
    attemptsRef,
    timeoutRef,
    onErrorRef,
    onTimeoutRef,
    lastDataUpdatedAtRef,
  } = refs

  if (!queryEnabled || !options.nmId || options.nmId.trim() === '') return false
  if (marginRef.current !== null) return false

  // Handle error states
  if (query.state.status === 'error') {
    const error = query.state.error as Error
    if (error instanceof ApiError && error.status >= 500) {
      logger.warn(`[Margin Polling] Transient error (${error.status}), continuing polling`)
      attemptsRef.current += 1
      return options.strategy.interval
    }
    if (error instanceof ApiError && [400, 403, 404].includes(error.status)) {
      errorRef.current = error
      onErrorRef.current?.(error)
      return false
    }
    errorRef.current = error
    onErrorRef.current?.(error)
    return false
  }

  // Track attempts on successful polls
  if (query.state.status === 'success' && query.state.data) {
    const statusResponse = query.state.data as MarginCalculationStatusResponse
    const dataUpdatedAt = query.state.dataUpdatedAt || 0
    if (dataUpdatedAt > lastDataUpdatedAtRef.current) {
      lastDataUpdatedAtRef.current = dataUpdatedAt
      attemptsRef.current += 1
    }
    if (statusResponse.status === 'completed') {
      logger.debug('[Margin Polling] Status completed, stopping polling')
      return false
    }
  }

  // Check max attempts
  if (attemptsRef.current >= options.strategy.maxAttempts) {
    logger.debug(
      `[Margin Polling] Max attempts reached (${attemptsRef.current}/${options.strategy.maxAttempts}), stopping`
    )
    timeoutRef.current = true
    onTimeoutRef.current?.()
    return false
  }

  return options.strategy.interval
}
