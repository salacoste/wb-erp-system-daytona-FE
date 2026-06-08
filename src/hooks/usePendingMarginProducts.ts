/**
 * Hook for tracking products with pending margin calculation and polling for updates
 * Request #18: Missing Margin and Missing Data Reason - Edge Case Scenarios
 *
 * Polling logic extracted to ./usePendingMarginPolling.ts
 */

import { useEffect, useRef, useState, useMemo } from 'react'
import {
  type PendingProduct,
  isProductPending,
  createProductsKey,
  shouldShowRetry,
  getPendingElapsedTime,
  getPendingAffectedWeeks,
  hasPendingChanged,
} from './usePendingMarginProducts-utils'
import { usePendingMarginPollingEffect } from './usePendingMarginPolling'

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
  const [pendingProducts, setPendingProducts] = useState<Map<string, PendingProduct>>(new Map())
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

  // Polling logic — extracted to separate file
  usePendingMarginPollingEffect(enabled, pendingProducts, setPendingProducts)

  return {
    pendingProducts: Array.from(pendingProducts.values()),
    isPending: (nmId: string) => pendingProducts.has(nmId),
    getPendingTime: (nmId: string) => getPendingElapsedTime(pendingProducts, nmId),
    shouldShowRetryButton: (nmId: string) => shouldShowRetry(pendingProducts, nmId),
    getAffectedWeeks: (nmId: string) => getPendingAffectedWeeks(pendingProducts, nmId),
    pendingCount: pendingProducts.size,
  }
}
