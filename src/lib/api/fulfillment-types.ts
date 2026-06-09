/**
 * Fulfillment API Parameter Types & Query Keys
 * Extracted from fulfillment.ts for 200-line compliance.
 */

// =============================================================================
// Parameter Types
// =============================================================================

/** Parameters for GET /v1/analytics/fulfillment/summary */
export interface FulfillmentSummaryParams {
  from: string // YYYY-MM-DD
  to: string // YYYY-MM-DD (max 90 days)
}

/** Parameters for GET /v1/analytics/fulfillment/trends */
export interface FulfillmentTrendsParams {
  from: string // YYYY-MM-DD
  to: string // YYYY-MM-DD
  type?: 'fbo' | 'fbs' | 'all'
  metric?: 'orders' | 'sales' | 'revenue' | 'returns'
}

/** Parameters for GET /v1/analytics/fulfillment/products */
export interface FulfillmentProductsParams {
  from: string // YYYY-MM-DD
  to: string // YYYY-MM-DD
  type?: 'fbo' | 'fbs' | 'all'
  limit?: number // default: 50
  sort?: 'revenue' | 'orders' | 'returns'
}

// =============================================================================
// Query Keys Factory
// =============================================================================

/** Query keys for React Query cache management */
export const fulfillmentQueryKeys = {
  all: ['fulfillment'] as const,

  summary: (from: string, to: string) =>
    [...fulfillmentQueryKeys.all, 'summary', from, to] as const,

  trends: (from: string, to: string, type?: string, metric?: string) =>
    [...fulfillmentQueryKeys.all, 'trends', from, to, type, metric] as const,

  syncStatus: ['fulfillment', 'sync-status'] as const,

  products: (from: string, to: string, type?: string, sort?: string) =>
    [...fulfillmentQueryKeys.all, 'products', from, to, type, sort] as const,
}
