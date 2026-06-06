/**
 * Hook for tracking products with pending margin calculation and polling for updates
 * Request #18: Missing Margin and Missing Data Reason - Edge Case Scenarios
 *
 * Backend recommendation:
 * - Polling every 5-10 seconds for first 30 seconds
 * - Show manual retry button if state persists > 5 minutes
 */

import { useEffect, useRef, useState, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ProductWithCogs } from '@/types/cogs'
import {
  type PendingProduct,
  MAX_POLL_DURATION,
  MAX_POLL_BATCH_SIZE,
  getPollingInterval,
  isProductPending,
  createProductsKey,
  shouldShowRetry,
  getPendingElapsedTime,
  getPendingAffectedWeeks,
  hasPendingChanged,
} from './usePendingMarginProducts-utils'
import { logger } from '@/lib/logger'

// Re-export types for consumers
export type { PendingProduct } from './usePendingMarginProducts-utils'

/**
 * Hook to track products with pending margin calculation and poll for updates
 */
export function usePendingMarginProducts(
  products: Array<{
    nm_id: string
    current_margin_pct?: number | null
    missing_data_reason?: string | null
    has_cogs: boolean
    cogs?: { valid_from: string } | null
  }>,
  enabled: boolean = true
) {
  const queryClient = useQueryClient()
  const [pendingProducts, setPendingProducts] = useState<Map<string, PendingProduct>>(new Map())
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isPollingRef = useRef(false)
  const prevProductsKeyRef = useRef<string>('')

  // Create stable reference for products to prevent infinite loops
  const productsKey = useMemo(() => createProductsKey(products), [products])

  // Detect products with pending margin calculation
  useEffect(() => {
    if (!enabled) return
    if (productsKey === prevProductsKeyRef.current) return
    prevProductsKeyRef.current = productsKey

    setPendingProducts(prevPending => {
      const now = Date.now()
      const newPending = new Map<string, PendingProduct>()

      products.forEach(product => {
        if (isProductPending(product) && product.cogs?.valid_from) {
          const existing = prevPending.get(product.nm_id)
          if (existing) {
            newPending.set(product.nm_id, existing)
          } else {
            newPending.set(product.nm_id, {
              nmId: product.nm_id,
              detectedAt: now,
              validFrom: product.cogs.valid_from,
            })
          }
        }
      })

      prevPending.forEach((pending, nmId) => {
        const product = products.find(p => p.nm_id === nmId)
        if (product && product.current_margin_pct !== null) return
        if (newPending.has(nmId)) {
          newPending.set(nmId, pending)
        }
      })

      return hasPendingChanged(prevPending, newPending) ? newPending : prevPending
    })
  }, [productsKey, enabled, products])

  // Polling logic
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
  }, [enabled, pendingProducts, queryClient])

  return {
    pendingProducts: Array.from(pendingProducts.values()),
    isPending: (nmId: string) => pendingProducts.has(nmId),
    getPendingTime: (nmId: string) => getPendingElapsedTime(pendingProducts, nmId),
    shouldShowRetryButton: (nmId: string) => shouldShowRetry(pendingProducts, nmId),
    getAffectedWeeks: (nmId: string) => getPendingAffectedWeeks(pendingProducts, nmId),
    pendingCount: pendingProducts.size,
  }
}
