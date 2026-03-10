/**
 * Bulk COGS Assignment with Polling - Polling State Helpers
 * Extracted from useBulkCogsAssignmentWithPolling.ts for file size compliance (Epic 74)
 */

import type { ProductListItem } from '@/types/cogs'

// ============================================================================
// Constants
// ============================================================================

/** Threshold percentage of sample products with margin to consider calculation complete */
export const MARGIN_COMPLETION_THRESHOLD = 0.5

/** Max sample products to poll */
export const MAX_SAMPLE_SIZE = 10

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a product has a valid calculated margin
 */
export function hasValidMargin(product: ProductListItem): boolean {
  return (
    product.current_margin_pct != null &&
    typeof product.current_margin_pct === 'number' &&
    Number.isFinite(product.current_margin_pct)
  )
}

/**
 * Check if margin calculation is complete for a sample of products
 * Complete when >= 50% of sample products have calculated margin
 */
export function isMarginCalculationComplete(
  sampleProducts: ProductListItem[],
): boolean {
  const withMargin = sampleProducts.filter(hasValidMargin).length
  return withMargin >= sampleProducts.length * MARGIN_COMPLETION_THRESHOLD
}

/**
 * Extract successful item IDs from bulk assignment response (first 10)
 */
export function extractSampleIds(
  results: Array<{ success: boolean; nm_id: string }>
): string[] {
  return results
    .filter(r => r.success)
    .slice(0, MAX_SAMPLE_SIZE)
    .map(r => r.nm_id)
}
