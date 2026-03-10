/**
 * Pending Margin Products - Types & Helper Functions
 * Extracted from usePendingMarginProducts.ts for file size compliance (Epic 74)
 */

import { calculateAffectedWeeks } from '@/lib/margin-helpers'

// ============================================================================
// Types
// ============================================================================

export interface PendingProduct {
  nmId: string
  detectedAt: number
  validFrom: string
}

// ============================================================================
// Polling Constants
// ============================================================================

/** Polling interval for first 30 seconds (average of 5-10s recommendation) */
export const FAST_POLL_INTERVAL = 7500

/** Polling interval after 30 seconds */
export const SLOW_POLL_INTERVAL = 30000

/** Threshold for switching from fast to slow polling */
export const FAST_POLL_THRESHOLD = 30000

/** Maximum polling duration (5 minutes) */
export const MAX_POLL_DURATION = 5 * 60 * 1000

/** Maximum products to poll per cycle */
export const MAX_POLL_BATCH_SIZE = 5

// ============================================================================
// Helper Functions
// ============================================================================

/** Get polling interval based on elapsed time */
export function getPollingInterval(elapsed: number): number {
  return elapsed < FAST_POLL_THRESHOLD ? FAST_POLL_INTERVAL : SLOW_POLL_INTERVAL
}

/** Check if a product is in "calculation in progress" state (Request #18) */
export function isProductPending(product: {
  current_margin_pct?: number | null
  missing_data_reason?: string | null
  has_cogs: boolean
  cogs?: { valid_from: string } | null
}): boolean {
  return (
    product.current_margin_pct === null &&
    product.missing_data_reason === null &&
    product.has_cogs === true &&
    !!product.cogs?.valid_from
  )
}

/** Create a stable key from products for comparison (prevents infinite loops) */
export function createProductsKey(
  products: Array<{
    nm_id: string
    current_margin_pct?: number | null
    missing_data_reason?: string | null
    has_cogs: boolean
    cogs?: { valid_from: string } | null
  }>
): string {
  return products
    .map(
      p =>
        `${p.nm_id}:${p.current_margin_pct}:${p.missing_data_reason}:${p.has_cogs}:${p.cogs?.valid_from || ''}`
    )
    .join('|')
}

/** Check if a pending product should show retry button (>5 minutes) */
export function shouldShowRetry(
  pendingProducts: Map<string, PendingProduct>,
  nmId: string
): boolean {
  const pending = pendingProducts.get(nmId)
  if (!pending) return false
  return Date.now() - pending.detectedAt > MAX_POLL_DURATION
}

/** Get elapsed time since product was detected as pending */
export function getPendingElapsedTime(
  pendingProducts: Map<string, PendingProduct>,
  nmId: string
): number {
  const pending = pendingProducts.get(nmId)
  if (!pending) return 0
  return Date.now() - pending.detectedAt
}

/** Get affected weeks for a pending product */
export function getPendingAffectedWeeks(
  pendingProducts: Map<string, PendingProduct>,
  nmId: string
): string[] {
  const pending = pendingProducts.get(nmId)
  if (!pending) return []
  return calculateAffectedWeeks(pending.validFrom)
}

/** Compare two Maps by keys to determine if pending products changed */
export function hasPendingChanged(
  prev: Map<string, PendingProduct>,
  next: Map<string, PendingProduct>
): boolean {
  if (prev.size !== next.size) return true
  const currentKeys = Array.from(prev.keys()).sort().join(',')
  const newKeys = Array.from(next.keys()).sort().join(',')
  return currentKeys !== newKeys
}
