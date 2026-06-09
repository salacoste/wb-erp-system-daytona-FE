'use client'

import { logger } from '@/lib/logger'

/**
 * Query function builder for margin polling
 * Story 4.8: Margin Recalculation Polling & Real-time Updates
 * Request #21: Uses lightweight margin-status endpoint (Epic 22)
 *
 * Extracted from useMarginPollingWithQuery.ts (Epic 74, Story 74.4)
 */

import { useCallback, type MutableRefObject } from 'react'
import { apiClient } from '@/lib/api-client'
import { getMarginCalculationStatus } from '@/lib/api'
import { ApiError } from '@/types/api'
import type { ProductWithCogs } from '@/types/cogs'
import type { MarginCalculationStatusResponse } from '@/types/cogs'

/**
 * Refs needed by the margin polling query function
 */
export interface MarginPollingRefs {
  marginRef: MutableRefObject<number | null>
  errorRef: MutableRefObject<Error | null>
  isFirstAttemptRef: MutableRefObject<boolean>
  onErrorRef: MutableRefObject<((error: Error) => void) | undefined>
  setCompletedWithoutMargin: (value: boolean) => void
}

/**
 * Hook that builds the queryFn for margin status polling.
 *
 * Handles:
 * - Fetching margin-status endpoint
 * - 404 fallback to full product fetch
 * - Status transitions: completed, failed, not_found, pending/in_progress
 * - Orphan product detection
 */
export function useMarginPollingQueryFn(nmId: string, enabled: boolean, refs: MarginPollingRefs) {
  const { marginRef, errorRef, isFirstAttemptRef, onErrorRef, setCompletedWithoutMargin } = refs

  return useCallback(async (): Promise<MarginCalculationStatusResponse> => {
    if (!nmId || !enabled) {
      throw new Error('Polling disabled or no nmId provided')
    }

    let statusResponse: MarginCalculationStatusResponse

    try {
      statusResponse = await getMarginCalculationStatus(nmId)
    } catch (error: unknown) {
      // If margin-status endpoint returns 404, fallback to full product fetch
      const is404Error =
        (error instanceof ApiError && error.status === 404) ||
        (error instanceof Error && error.message.includes('404')) ||
        (error instanceof Error && error.message.includes('NOT_FOUND'))

      if (is404Error) {
        logger.warn(
          '[Margin Polling] margin-status endpoint not available (404), falling back to full product fetch'
        )
        statusResponse = await fetchProductMarginFallback(nmId)
      } else {
        throw error
      }
    }

    // Handle different statuses
    if (statusResponse.status === 'completed') {
      return await handleCompletedStatus(nmId, statusResponse, marginRef, setCompletedWithoutMargin)
    } else if (statusResponse.status === 'failed') {
      const err = new Error(statusResponse.error || 'Margin calculation failed')
      errorRef.current = err
      onErrorRef.current?.(err)
      throw err
    } else if (statusResponse.status === 'not_found') {
      return handleNotFoundStatus(statusResponse, isFirstAttemptRef, errorRef, onErrorRef)
    }

    // Continue polling for 'pending' or 'in_progress'
    return statusResponse
  }, [nmId, enabled, marginRef, errorRef, isFirstAttemptRef, onErrorRef, setCompletedWithoutMargin])
}

/**
 * Fallback: fetch full product to check if margin is available
 * Used when margin-status endpoint returns 404
 */
async function fetchProductMarginFallback(nmId: string): Promise<MarginCalculationStatusResponse> {
  try {
    const product = await apiClient.get<ProductWithCogs>(`/v1/products/${nmId}?include_cogs=true`)
    const marginPct = product.current_margin_pct
    const hasMargin =
      marginPct != null && typeof marginPct === 'number' && Number.isFinite(marginPct)
    return { status: hasMargin ? 'completed' : 'pending' }
  } catch {
    // Orphan products exist in financial reports but not in WB API
    logger.warn(
      '[Margin Polling] Fallback product fetch also failed (orphan product?), marking as completed'
    )
    return { status: 'completed' }
  }
}

/**
 * Handle 'completed' status: fetch full product data for actual margin value
 */
async function handleCompletedStatus(
  nmId: string,
  statusResponse: MarginCalculationStatusResponse,
  marginRef: MutableRefObject<number | null>,
  setCompletedWithoutMargin: (value: boolean) => void
): Promise<MarginCalculationStatusResponse> {
  try {
    const product = await apiClient.get<ProductWithCogs>(`/v1/products/${nmId}?include_cogs=true`)
    const marginPct = product.current_margin_pct
    const hasMargin =
      marginPct != null && typeof marginPct === 'number' && Number.isFinite(marginPct)

    if (hasMargin) {
      marginRef.current = marginPct
      setCompletedWithoutMargin(false)
      logger.debug('[Margin Polling] Margin found:', marginPct)
    } else {
      // Expected when: no sales data, COGS date after week midpoint, etc.
      setCompletedWithoutMargin(true)
      logger.debug('[Margin Polling] Status completed but no margin available', {
        missingDataReason: product.missing_data_reason,
      })
    }
    return statusResponse
  } catch {
    // Product fetch failed (orphan product case)
    setCompletedWithoutMargin(true)
    logger.debug('[Margin Polling] Product fetch failed (orphan?), completed without margin')
    return statusResponse
  }
}

/**
 * Handle 'not_found' status: retry once for race condition, then error
 */
function handleNotFoundStatus(
  statusResponse: MarginCalculationStatusResponse,
  isFirstAttemptRef: MutableRefObject<boolean>,
  errorRef: MutableRefObject<Error | null>,
  onErrorRef: MutableRefObject<((error: Error) => void) | undefined>
): MarginCalculationStatusResponse {
  if (isFirstAttemptRef.current) {
    logger.debug('[Margin Polling] Status: not_found on first attempt, will retry')
    isFirstAttemptRef.current = false
    return statusResponse
  }
  // Not found on subsequent attempts - stop polling
  const error = new Error('Margin calculation not found.')
  errorRef.current = error
  onErrorRef.current?.(error)
  throw error
}
