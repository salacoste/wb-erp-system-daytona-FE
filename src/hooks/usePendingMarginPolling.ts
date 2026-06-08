/**
 * Pending Margin Polling Effect — extracted from usePendingMarginProducts.ts
 *
 * Handles the polling loop for products with pending margin calculation.
 * Polls every 5-10 seconds for the first 30 seconds, then shows retry button.
 */

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ProductWithCogs } from '@/types/cogs'
import {
  type PendingProduct,
  MAX_POLL_DURATION,
  MAX_POLL_BATCH_SIZE,
  getPollingInterval,
} from './usePendingMarginProducts-utils'
import { logger } from '@/lib/logger'

/**
 * Manages the polling lifecycle for pending products.
 * Polls individual products and removes them from the pending set once margin is calculated.
 */
export function usePendingMarginPollingEffect(
  enabled: boolean,
  pendingProducts: Map<string, PendingProduct>,
  setPendingProducts: React.Dispatch<React.SetStateAction<Map<string, PendingProduct>>>
) {
  const queryClient = useQueryClient()
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isPollingRef = useRef(false)

  useEffect(() => {
    if (!enabled) {
      if (pollingIntervalRef.current) {
        clearTimeout(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      isPollingRef.current = false
      return
    }
    const currentPending = Array.from(pendingProducts.values())
    if (currentPending.length === 0) {
      if (pollingIntervalRef.current) {
        clearTimeout(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      isPollingRef.current = false
      return
    }
    if (isPollingRef.current) return
    isPollingRef.current = true

    const poll = async () => {
      const stillPending = Array.from(pendingProducts.values())
      if (stillPending.length === 0) {
        isPollingRef.current = false
        if (pollingIntervalRef.current) {
          clearTimeout(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
        return
      }
      const oldestPending = stillPending.reduce(
        (oldest, current) => (current.detectedAt < oldest.detectedAt ? current : oldest),
        stillPending[0]
      )
      const elapsed = Date.now() - oldestPending.detectedAt
      if (elapsed > MAX_POLL_DURATION) {
        isPollingRef.current = false
        if (pollingIntervalRef.current) {
          clearTimeout(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
        return
      }
      const interval = getPollingInterval(elapsed)
      try {
        const productsToPoll = stillPending.slice(0, MAX_POLL_BATCH_SIZE)
        for (const pending of productsToPoll) {
          try {
            const product = await apiClient.get<ProductWithCogs>(
              `/v1/products/${pending.nmId}?include_cogs=true`
            )
            if (
              product.current_margin_pct !== null &&
              typeof product.current_margin_pct === 'number' &&
              Number.isFinite(product.current_margin_pct)
            ) {
              setPendingProducts(prev => {
                const next = new Map(prev)
                next.delete(pending.nmId)
                return next
              })
              queryClient.invalidateQueries({ queryKey: ['products'] })
              queryClient.invalidateQueries({ queryKey: ['products', pending.nmId] })
              queryClient
                .refetchQueries({
                  queryKey: ['products'],
                  exact: false,
                  type: 'active',
                })
                .catch(() => {})
            }
          } catch (error) {
            logger.error(`[Pending Margin Polling] Error polling product ${pending.nmId}:`, error)
          }
        }
        pollingIntervalRef.current = setTimeout(() => poll(), interval)
      } catch (error) {
        logger.error('[Pending Margin Polling] Error:', error)
        pollingIntervalRef.current = setTimeout(() => poll(), interval)
      }
    }
    poll()
    return () => {
      if (pollingIntervalRef.current) {
        clearTimeout(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      isPollingRef.current = false
    }
  }, [enabled, pendingProducts, queryClient, setPendingProducts])
}
