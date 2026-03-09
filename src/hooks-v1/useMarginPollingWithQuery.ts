'use client'

/**
 * Hook for polling margin calculation status using TanStack Query
 * Story 4.8: Margin Recalculation Polling & Real-time Updates
 * Request #21: Updated to use lightweight margin-status endpoint (Epic 22)
 *
 * Uses useQuery with refetchInterval for efficient polling (TanStack Query best practice)
 * Uses GET /v1/products/:nmId/margin-status for efficient polling
 *
 * Split into:
 * - margin-polling-types.ts: interfaces, DEFAULT_POLLING_STRATEGY
 * - useMarginPollingCallbacks.ts: queryFn builder with status handlers
 * - margin-polling-interval.ts: refetchInterval computation logic
 * - this file: core hook with refs, effects, and useQuery
 */

import { useEffect, useRef, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { MarginCalculationStatusResponse } from '@/types/cogs'
import { useMarginPollingQueryFn } from './useMarginPollingCallbacks'
import { computeRefetchInterval } from './margin-polling-interval'

// Re-export types and constants for backward compatibility
export { DEFAULT_POLLING_STRATEGY } from './margin-polling-types'

import type {
  UseMarginPollingWithQueryOptions,
  UseMarginPollingWithQueryResult,
} from './margin-polling-types'

export type { UseMarginPollingWithQueryOptions, UseMarginPollingWithQueryResult }

/**
 * Hook to poll backend for margin calculation status using TanStack Query
 *
 * Polls GET /v1/products/:nmId/margin-status every N seconds (Request #21)
 * until status === 'completed' or maxAttempts reached
 */
export function useMarginPollingWithQuery(
  options: UseMarginPollingWithQueryOptions
): UseMarginPollingWithQueryResult {
  // Track attempts and timeout state
  const attemptsRef = useRef(0)
  const timeoutRef = useRef(false)
  const marginRef = useRef<number | null>(null)
  const errorRef = useRef<Error | null>(null)
  // CRITICAL: Use state (not ref) for completedWithoutMargin to trigger re-renders
  const [completedWithoutMargin, setCompletedWithoutMargin] = useState(false)
  const onSuccessRef = useRef(options.onSuccess)
  const onTimeoutRef = useRef(options.onTimeout)
  const onErrorRef = useRef(options.onError)
  const isFirstAttemptRef = useRef(true)
  const prevNmIdRef = useRef<string>('')
  const lastDataUpdatedAtRef = useRef<number>(0)

  // Update refs when callbacks change
  useEffect(() => {
    onSuccessRef.current = options.onSuccess
    onTimeoutRef.current = options.onTimeout
    onErrorRef.current = options.onError
  }, [options.onSuccess, options.onTimeout, options.onError])

  // Reset state when nmId or enabled changes
  useEffect(() => {
    if (prevNmIdRef.current !== options.nmId) {
      attemptsRef.current = 0
      timeoutRef.current = false
      marginRef.current = null
      errorRef.current = null
      setCompletedWithoutMargin(false)
      isFirstAttemptRef.current = true
      prevNmIdRef.current = options.nmId
    }
    if (!options.enabled || !options.nmId) {
      attemptsRef.current = 0
      timeoutRef.current = false
      marginRef.current = null
      errorRef.current = null
      setCompletedWithoutMargin(false)
      isFirstAttemptRef.current = true
      lastDataUpdatedAtRef.current = 0
    }
  }, [options.enabled, options.nmId])

  // Build queryFn from extracted hook
  const queryFn = useMarginPollingQueryFn(options.nmId, options.enabled, {
    marginRef,
    errorRef,
    isFirstAttemptRef,
    onErrorRef,
    setCompletedWithoutMargin,
  })

  // Compute queryEnabled reactively
  const queryEnabled = useMemo(() => {
    return options.enabled && !!options.nmId && options.nmId.trim() !== ''
  }, [options.enabled, options.nmId])

  // Refs bundle for refetchInterval
  const intervalRefs = {
    marginRef,
    errorRef,
    attemptsRef,
    timeoutRef,
    onErrorRef,
    onTimeoutRef,
    lastDataUpdatedAtRef,
  }

  // TanStack Query with refetchInterval for polling
  const query = useQuery({
    queryKey: ['margin-status', options.nmId],
    queryFn,
    enabled: queryEnabled,
    refetchInterval: query => computeRefetchInterval(query, queryEnabled, options, intervalRefs),
    refetchIntervalInBackground: true,
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })

  // Force query to start when enabled changes from false to true
  const prevEnabledRef = useRef(queryEnabled)
  useEffect(() => {
    const wasDisabled = !prevEnabledRef.current
    if (wasDisabled && queryEnabled && !query.isFetching && query.status !== 'pending') {
      query.refetch().catch(error => {
        console.error('[Margin Polling] Error forcing query start:', error)
      })
    }
    prevEnabledRef.current = queryEnabled
  }, [queryEnabled, query.isFetching, query.status, query.data, query])

  // Call onSuccess when margin is available (prevent multiple calls)
  const onSuccessCalledRef = useRef(false)
  useEffect(() => {
    if (
      marginRef.current !== null &&
      query.isSuccess &&
      query.data &&
      onSuccessRef.current &&
      !onSuccessCalledRef.current
    ) {
      const statusResponse = query.data as MarginCalculationStatusResponse
      if (statusResponse.status === 'completed') {
        const margin = marginRef.current
        console.log('[Margin Polling] Calling onSuccess callback with margin:', margin)
        onSuccessCalledRef.current = true
        onSuccessRef.current(margin)
      }
    }
  }, [query.isSuccess, query.data])

  // Reset onSuccessCalledRef when nmId or enabled changes
  useEffect(() => {
    if (!options.enabled || !options.nmId) {
      onSuccessCalledRef.current = false
    }
  }, [options.enabled, options.nmId])

  const isPolling =
    options.enabled &&
    !!options.nmId &&
    query.isFetching &&
    !timeoutRef.current &&
    marginRef.current === null &&
    errorRef.current === null

  return {
    isPolling,
    attempts: attemptsRef.current,
    timeout: timeoutRef.current,
    margin: marginRef.current,
    error: errorRef.current || (query.error as Error | null),
    completedWithoutMargin,
  }
}
