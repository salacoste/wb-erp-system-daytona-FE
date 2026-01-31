/**
 * Daily Analytics Query Keys
 * Story 61.9-FE: Daily Breakdown Support
 *
 * TanStack Query v5 query keys factory.
 */

/**
 * Query keys for daily analytics.
 * Follows TanStack Query v5 patterns with factory functions.
 */
export const dailyAnalyticsQueryKeys = {
  /** Base key for all daily analytics queries */
  all: ['daily-analytics'] as const,

  /** Key for combined daily metrics queries */
  metrics: (from: string, to: string) =>
    [...dailyAnalyticsQueryKeys.all, 'metrics', from, to] as const,

  /** Key for orders daily data */
  orders: (from: string, to: string) =>
    [...dailyAnalyticsQueryKeys.all, 'orders', from, to] as const,

  /** Key for finance daily data */
  finance: (from: string, to: string) =>
    [...dailyAnalyticsQueryKeys.all, 'finance', from, to] as const,

  /** Key for advertising daily data */
  advertising: (from: string, to: string) =>
    [...dailyAnalyticsQueryKeys.all, 'advertising', from, to] as const,
}
