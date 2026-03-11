/**
 * Types and Query Keys for Orders with COGS
 * Story 61.4-FE: COGS for Orders Integration
 *
 * Extracted from useOrdersCogs.ts for file size compliance (Epic 74).
 */

// =============================================================================
// Query Keys Factory
// =============================================================================

/**
 * Query keys factory for orders COGS data
 */
export const ordersCogsQueryKeys = {
  all: ['orders-cogs'] as const,

  byRange: (from: string, to: string) => [...ordersCogsQueryKeys.all, from, to] as const,

  byRangeWithOptions: (from: string, to: string, aggregation: string, includeCogs: boolean) =>
    [...ordersCogsQueryKeys.byRange(from, to), aggregation, includeCogs] as const,
}

// =============================================================================
// Hook Options
// =============================================================================

export interface UseOrdersCogsOptions {
  /** Period type: 'week' or 'month' */
  periodType: 'week' | 'month'
  /** ISO week (YYYY-Www) or month (YYYY-MM) */
  period: string
  /** Include daily breakdown */
  withDailyBreakdown?: boolean
  /** Enable/disable query */
  enabled?: boolean
}
