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
import { calculateAffectedWeeks } from '@/lib/margin-helpers'

interface PendingProduct {
  nmId: string
  detectedAt: number // Timestamp when state was first detected
  validFrom: string // COGS valid_from date for calculating affected weeks
}

/**
 * Hook to track products with pending margin calculation and poll for updates
 * 
 * Detects products where:
 * - current_margin_pct === null
 * - missing_data_reason === null
 * - has_cogs === true
 * 
 * This state means "margin calculation in progress" (Request #18)
 * 
 * @param products - Array of products to check for pending margin
 * @param enabled - Whether polling is enabled
 * @returns Object with pending products info and polling status
 */
export function usePendingMarginProducts(
  products: Array<{ nm_id: string; current_margin_pct?: number | null; missing_data_reason?: string | null; has_cogs: boolean; cogs?: { valid_from: string } | null }>,
  enabled: boolean = true
) {
  const queryClient = useQueryClient()
  const [pendingProducts, setPendingProducts] = useState<Map<string, PendingProduct>>(new Map())
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isPollingRef = useRef(false)
  const prevProductsKeyRef = useRef<string>('')

  // CRITICAL: Create stable reference for products to prevent infinite loops
  // Compare products by their key fields (nm_id, current_margin_pct, missing_data_reason, has_cogs)
  // Only update if actual data changed, not just array reference
  const productsKey = useMemo(() => {
    return products.map(p => 
      `${p.nm_id}:${p.current_margin_pct}:${p.missing_data_reason}:${p.has_cogs}:${p.cogs?.valid_from || ''}`
    ).join('|')
  }, [products])

  // Detect products with pending margin calculation
  useEffect(() => {
    if (!enabled) {
      return
    }

    // CRITICAL: Skip if products haven't actually changed (prevent infinite loop)
    // Compare by key string instead of array reference
    if (productsKey === prevProductsKeyRef.current) {
      return
    }
    prevProductsKeyRef.current = productsKey

    // CRITICAL: Use functional update to access current pendingProducts state
    // This avoids adding pendingProducts to dependencies and prevents infinite loops
    setPendingProducts((prevPending) => {
    const now = Date.now()
    const newPending = new Map<string, PendingProduct>()

    products.forEach((product) => {
      // Check if product is in "calculation in progress" state (Request #18)
      const isPending = 
        product.current_margin_pct === null &&
        product.missing_data_reason === null &&
        product.has_cogs === true &&
        product.cogs?.valid_from

      if (isPending && product.cogs?.valid_from) {
          const existing = prevPending.get(product.nm_id)
        
        if (existing) {
          // Product already tracked - keep existing timestamp
          newPending.set(product.nm_id, existing)
        } else {
          // New pending product - record detection time
          newPending.set(product.nm_id, {
            nmId: product.nm_id,
            detectedAt: now,
            validFrom: product.cogs.valid_from,
          })
        }
      }
    })

    // Remove products that are no longer pending
      prevPending.forEach((pending, nmId) => {
      const product = products.find((p) => p.nm_id === nmId)
      if (product && product.current_margin_pct !== null) {
        // Margin calculated - remove from pending
        return
      }
      if (newPending.has(nmId)) {
        // Still pending - keep it
        newPending.set(nmId, pending)
      }
    })

      // CRITICAL: Only return new Map if it actually changed
      // Compare Map sizes and keys to avoid unnecessary updates
      const currentKeys = Array.from(prevPending.keys()).sort().join(',')
      const newKeys = Array.from(newPending.keys()).sort().join(',')
      
      if (currentKeys !== newKeys || prevPending.size !== newPending.size) {
        return newPending
      }
      
      // No change - return previous state to prevent re-render
      return prevPending
    })
  }, [productsKey, enabled, products])

  // Polling logic: every 5-10 seconds for first 30 seconds, then every 30 seconds
  useEffect(() => {
    if (!enabled) {
      if (pollingIntervalRef.current) {
        clearTimeout(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      isPollingRef.current = false
      return
    }

    // Get current pending products from state
    const currentPending = Array.from(pendingProducts.values())
    
    if (currentPending.length === 0) {
      if (pollingIntervalRef.current) {
        clearTimeout(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      isPollingRef.current = false
      return
    }

    // Don't start multiple polling loops
    if (isPollingRef.current) {
      return
    }

    isPollingRef.current = true

    const poll = async () => {
      // Check if we still have pending products
      const stillPending = Array.from(pendingProducts.values())
      if (stillPending.length === 0) {
        isPollingRef.current = false
        if (pollingIntervalRef.current) {
          clearTimeout(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
        return
      }

      // Get the oldest pending product to determine elapsed time
      const oldestPending = stillPending.reduce((oldest, current) => {
        return current.detectedAt < oldest.detectedAt ? current : oldest
      }, stillPending[0])

      const elapsed = Date.now() - oldestPending.detectedAt

      // Stop polling after 5 minutes (backend recommendation)
      // But keep tracking for retry button display
      if (elapsed > 5 * 60 * 1000) {
        isPollingRef.current = false
        if (pollingIntervalRef.current) {
          clearTimeout(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
        return
      }

      // Determine polling interval based on elapsed time
      // First 30 seconds: every 7.5 seconds (average of 5-10s)
      // After 30 seconds: every 30 seconds
      const interval = elapsed < 30000 ? 7500 : 30000

      try {
        // Poll a sample of pending products (first 5 to avoid too many requests)
        const productsToPoll = stillPending.slice(0, 5)

        for (const pending of productsToPoll) {
          try {
            const product = await apiClient.get<ProductWithCogs>(
              `/v1/products/${pending.nmId}?include_cogs=true`
            )

            // Check if margin is now available
            if (product.current_margin_pct !== null && typeof product.current_margin_pct === 'number' && Number.isFinite(product.current_margin_pct)) {
              // Margin calculated - remove from pending
              setPendingProducts((prev) => {
                const next = new Map(prev)
                next.delete(pending.nmId)
                return next
              })

              // Invalidate queries to refresh UI
              queryClient.invalidateQueries({ queryKey: ['products'] })
              queryClient.invalidateQueries({ queryKey: ['products', pending.nmId] })
              queryClient.refetchQueries({ 
                queryKey: ['products'],
                exact: false,
                type: 'active'
              }).catch(() => {})
            }
          } catch (error) {
            // Silently handle individual product errors
            console.error(`[Pending Margin Polling] Error polling product ${pending.nmId}:`, error)
          }
        }

        // Schedule next poll with appropriate interval
        pollingIntervalRef.current = setTimeout(() => {
          poll()
        }, interval)

      } catch (error) {
        console.error('[Pending Margin Polling] Error:', error)
        // Continue polling even on error
        pollingIntervalRef.current = setTimeout(() => {
          poll()
        }, interval)
      }
    }

    // Start polling immediately
    poll()

    return () => {
      if (pollingIntervalRef.current) {
        clearTimeout(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      isPollingRef.current = false
    }
  }, [enabled, pendingProducts, queryClient])

  // Helper functions
  const isPending = (nmId: string): boolean => {
    return pendingProducts.has(nmId)
  }

  const getPendingTime = (nmId: string): number => {
    const pending = pendingProducts.get(nmId)
    if (!pending) {
      return 0
    }
    return Date.now() - pending.detectedAt
  }

  const shouldShowRetryButton = (nmId: string): boolean => {
    const pendingTime = getPendingTime(nmId)
    return pendingTime > 5 * 60 * 1000 // 5 minutes
  }

  const getAffectedWeeks = (nmId: string): string[] => {
    const pending = pendingProducts.get(nmId)
    if (!pending) {
      return []
    }
    return calculateAffectedWeeks(pending.validFrom)
  }

  return {
    pendingProducts: Array.from(pendingProducts.values()),
    isPending,
    getPendingTime,
    shouldShowRetryButton,
    getAffectedWeeks,
    pendingCount: pendingProducts.size,
  }
}

