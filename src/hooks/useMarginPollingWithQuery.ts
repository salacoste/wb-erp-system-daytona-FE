/**
 * Hook for polling margin calculation status using TanStack Query
 * Story 4.8: Margin Recalculation Polling & Real-time Updates
 * Request #21: Updated to use lightweight margin-status endpoint (Epic 22)
 * 
 * Uses useQuery with refetchInterval for efficient polling (TanStack Query best practice)
 * Uses GET /v1/products/:nmId/margin-status for efficient polling
 */

import { useEffect, useRef, useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { getMarginCalculationStatus } from '@/lib/api'
import { ApiError } from '@/types/api'
import type { ProductWithCogs } from '@/types/cogs'
import type { PollingConfig } from '@/lib/margin-helpers'
import type { MarginCalculationStatusResponse } from '@/types/cogs'

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

/**
 * Hook to poll backend for margin calculation status using TanStack Query
 *
 * Uses useQuery with refetchInterval for polling (TanStack Query best practice)
 * Polls GET /v1/products/:nmId/margin-status every N seconds (Request #21)
 * until status === 'completed' or maxAttempts reached
 *
 * Status values:
 * - 'pending': Task queued, continue polling
 * - 'in_progress': Task processing, continue polling
 * - 'completed': Margin calculated, fetch product data and call onSuccess
 * - 'failed': Task failed, call onError
 * - 'not_found': No task, continue polling (might get enqueued)
 *
 * @example
 * const { isPolling, margin } = useMarginPollingWithQuery({
 *   nmId: '12345678',
 *   enabled: true,
 *   strategy: { interval: 2500, maxAttempts: 24, estimatedTime: 60000 },
 *   onSuccess: (margin) => toast.success(`Margin: ${margin}%`),
 *   onTimeout: () => toast.warning('Calculation taking longer than expected'),
 * });
 */
export function useMarginPollingWithQuery(
  options: UseMarginPollingWithQueryOptions,
): UseMarginPollingWithQueryResult {
  // Track attempts and timeout state
  const attemptsRef = useRef(0)
  const timeoutRef = useRef(false)
  const marginRef = useRef<number | null>(null)
  const errorRef = useRef<Error | null>(null)
  // CRITICAL: Use state (not ref) for completedWithoutMargin to trigger re-renders
  // This ensures parent hooks see the change and can cleanup polling state
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
    // Check if nmId actually changed
    if (prevNmIdRef.current !== options.nmId) {
      attemptsRef.current = 0
      timeoutRef.current = false
      marginRef.current = null
      errorRef.current = null
      setCompletedWithoutMargin(false)
      isFirstAttemptRef.current = true
      prevNmIdRef.current = options.nmId
    }

    // Reset if disabled
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

  // Query function that fetches margin status
  const queryFn = useCallback(async (): Promise<MarginCalculationStatusResponse> => {
    if (!options.nmId || !options.enabled) {
      throw new Error('Polling disabled or no nmId provided')
    }

    let statusResponse: MarginCalculationStatusResponse

    try {
      statusResponse = await getMarginCalculationStatus(options.nmId)
    } catch (error: unknown) {
      // If margin-status endpoint returns 404, fallback to full product fetch
      const is404Error =
        (error instanceof ApiError && error.status === 404) ||
        (error instanceof Error && error.message.includes('404')) ||
        (error instanceof Error && error.message.includes('NOT_FOUND'))

      if (is404Error) {
        console.warn(
          '⚠️ [Margin Polling] margin-status endpoint not available (404), falling back to full product fetch',
        )
        // Fallback: Use full product endpoint to check margin
        try {
          const product = await apiClient.get<ProductWithCogs>(
            `/v1/products/${options.nmId}?include_cogs=true`,
          )
          const marginPct = product.current_margin_pct
          const marginCheck =
            marginPct != null && typeof marginPct === 'number' && Number.isFinite(marginPct)

          if (marginCheck) {
            statusResponse = { status: 'completed' }
          } else {
            statusResponse = { status: 'pending' } // Treat as pending if no margin yet
          }
        } catch (fallbackError) {
          // If fallback also fails (e.g., orphan product), consider it completed
          // Orphan products exist in financial reports but not in WB API,
          // so they can't have margin calculated
          console.warn(
            '⚠️ [Margin Polling] Fallback product fetch also failed (orphan product?), marking as completed',
          )
          statusResponse = { status: 'completed' }
        }
      } else {
        // Re-throw other errors
        throw error
      }
    }

    // Handle different statuses
    if (statusResponse.status === 'completed') {
      // Margin calculation completed, fetch full product data to get the actual margin value
      try {
        const product = await apiClient.get<ProductWithCogs>(
          `/v1/products/${options.nmId}?include_cogs=true`,
        )
        const marginPct = product.current_margin_pct
        const marginCheck =
          marginPct != null && typeof marginPct === 'number' && Number.isFinite(marginPct)

        if (marginCheck) {
          // Store margin in ref - onSuccess will be called in useEffect
          marginRef.current = marginPct
          setCompletedWithoutMargin(false)
          console.log('✅ [Margin Polling] Margin found:', marginPct)
          return statusResponse
        } else {
          // Status is completed but margin not available
          // This is expected when: no sales data, COGS date after week midpoint, etc.
          setCompletedWithoutMargin(true)
          console.log('ℹ️ [Margin Polling] Status completed but no margin available (expected for no sales data or COGS date mismatch)', {
            missingDataReason: product.missing_data_reason,
          })
          return statusResponse
        }
      } catch {
        // Product fetch failed (orphan product case)
        // Consider it completed without margin
        setCompletedWithoutMargin(true)
        console.log('ℹ️ [Margin Polling] Product fetch failed (orphan product?), marking as completed without margin')
        return statusResponse
      }
    } else if (statusResponse.status === 'failed') {
      // Task failed
      const error = new Error(statusResponse.error || 'Margin calculation failed')
      errorRef.current = error
      onErrorRef.current?.(error)
      throw error
    } else if (statusResponse.status === 'not_found') {
      // Handle not_found on first attempt (race condition)
      if (isFirstAttemptRef.current) {
        console.log(
          '⚠️ [Margin Polling] Status: not_found on first attempt, will retry on next poll',
        )
        isFirstAttemptRef.current = false
        // Return status to continue polling
        return statusResponse
      } else {
        // Not found on subsequent attempts - stop polling
        const error = new Error('Margin calculation not found.')
        errorRef.current = error
        onErrorRef.current?.(error)
        throw error
      }
    }

    // Continue polling for 'pending' or 'in_progress'
    return statusResponse
  }, [options.nmId, options.enabled])

  // Use TanStack Query with refetchInterval for polling
  // CRITICAL: Compute queryEnabled inside useMemo to ensure it's reactive
  const queryEnabled = useMemo(() => {
    const enabled = options.enabled && !!options.nmId && options.nmId.trim() !== ''
    console.log('🔍 [Margin Polling With Query] queryEnabled computed:', {
      enabled,
      optionsEnabled: options.enabled,
      nmId: options.nmId,
      nmIdTrimmed: options.nmId?.trim(),
    })
    return enabled
  }, [options.enabled, options.nmId])
  
  console.log('🔍 [Margin Polling With Query] useQuery initialization:', {
    enabled: queryEnabled,
    optionsEnabled: options.enabled,
    nmId: options.nmId,
    nmIdTrimmed: options.nmId?.trim(),
    strategy: options.strategy,
  })
  
  // CRITICAL: queryKey should NOT include queryEnabled - it should only include stable values
  // When enabled changes, useQuery will automatically start/stop based on enabled prop
  const query = useQuery({
    queryKey: ['margin-status', options.nmId],
    queryFn,
    enabled: queryEnabled,
    // refetchInterval as function to control polling based on query state
    refetchInterval: (query) => {
      // Don't poll if disabled or no nmId - use queryEnabled instead of options.enabled
      if (!queryEnabled || !options.nmId || options.nmId.trim() === '') {
        return false
      }

      // If we have margin data, stop polling
      if (marginRef.current !== null) {
        console.log('✅ [Margin Polling] Margin found, stopping polling')
        return false
      }

      // If query has error, stop polling (permanent errors)
      if (query.state.status === 'error') {
        const error = query.state.error as Error
        if (error instanceof ApiError) {
          // Stop polling for permanent errors (400, 403, 404)
          if ([400, 403, 404].includes(error.status)) {
            console.error(
              `❌ [Margin Polling] Permanent error (${error.status}), stopping polling`,
            )
            errorRef.current = error
            onErrorRef.current?.(error)
            return false
          }
          // For 500 errors, continue polling (transient errors)
          if (error.status >= 500) {
            console.warn(`⚠️ [Margin Polling] Transient error (${error.status}), continuing polling`)
            // Increment attempts for error retries
            attemptsRef.current += 1
            // Continue polling with same interval
            return options.strategy.interval
          }
        }
        // For other errors, stop polling
        errorRef.current = error
        onErrorRef.current?.(error)
        return false
      }

      // Increment attempts when query data is updated (each successful poll counts as an attempt)
      // Use dataUpdatedAt to track when data actually changes
      if (query.state.status === 'success' && query.state.data) {
        const statusResponse = query.state.data as MarginCalculationStatusResponse
        const dataUpdatedAt = query.state.dataUpdatedAt || 0
        
        // Only increment if data was actually updated (not on every refetchInterval call)
        if (dataUpdatedAt > lastDataUpdatedAtRef.current) {
          lastDataUpdatedAtRef.current = dataUpdatedAt
          attemptsRef.current += 1
          console.log(`🔍 [Margin Polling] Attempt ${attemptsRef.current}/${options.strategy.maxAttempts}:`, {
            status: statusResponse.status,
            hasMargin: marginRef.current !== null,
          })
        }
        
        // Check if status is 'completed' - stop polling regardless of margin availability
        // If margin is null after completion, it means no sales data or COGS date doesn't apply
        if (statusResponse.status === 'completed') {
          console.log('✅ [Margin Polling] Status completed, stopping polling', {
            hasMargin: marginRef.current !== null,
            margin: marginRef.current,
          })
          return false // Stop polling - task is done
        }
      }

      // Check if max attempts reached
      if (attemptsRef.current >= options.strategy.maxAttempts) {
        console.log('⏱️ [Margin Polling] Max attempts reached, stopping polling', {
          attempts: attemptsRef.current,
          maxAttempts: options.strategy.maxAttempts,
        })
        timeoutRef.current = true
        onTimeoutRef.current?.()
        return false // Stop polling
      }

      // Continue polling with configured interval
      return options.strategy.interval
    },
    // Poll even when tab is in background
    refetchIntervalInBackground: true,
    // Don't retry on error - we handle errors in refetchInterval
    retry: false,
    // Don't refetch on mount if we already have data
    refetchOnMount: false,
    // Don't refetch on window focus
    refetchOnWindowFocus: false,
  })

  // CRITICAL: Force query to start when enabled changes from false to true
  // TanStack Query should handle this automatically, but we add explicit refetch
  // to ensure polling starts immediately when enabled becomes true
  const prevEnabledRef = useRef(queryEnabled)
  useEffect(() => {
    const wasDisabled = !prevEnabledRef.current
    const isNowEnabled = queryEnabled
    
    console.log('🔄 [Margin Polling] queryEnabled state changed:', {
      queryEnabled,
      wasDisabled,
      isNowEnabled,
      isFetching: query.isFetching,
      status: query.status,
      hasData: !!query.data,
    })
    
    // If enabled changed from false to true, force refetch
    if (wasDisabled && isNowEnabled && !query.isFetching && query.status !== 'pending') {
      console.log('🚀 [Margin Polling] Forcing query start (enabled changed from false to true)')
      query.refetch().catch((error) => {
        console.error('❌ [Margin Polling] Error forcing query start:', error)
      })
    }
    
    prevEnabledRef.current = queryEnabled
  }, [queryEnabled, query.isFetching, query.status, query.data, query])

  // Call onSuccess when margin is available
  // Track if onSuccess was already called to prevent multiple calls
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
        console.log('✅ [Margin Polling] Calling onSuccess callback with margin:', margin)
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

  // Determine if polling is active
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

