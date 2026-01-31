/**
 * Analytics Comparison API Client
 * Story 61.5-FE: Comparison Endpoint Integration
 * Epic 61-FE: Dashboard Data Integration (API Layer)
 *
 * API client for period comparison endpoint.
 * GET /v1/analytics/weekly/comparison
 *
 * @see docs/stories/epic-61/story-61.5-fe-comparison-endpoint.md
 */

import { apiClient } from '@/lib/api-client'
import type {
  ComparisonParams,
  ComparisonResponse,
  MetricComparison,
  ChangeDirection,
  DeltaValue,
} from '@/types/analytics-comparison'

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch comparison analytics between two periods
 *
 * @param params - Period specifications
 * @returns Comparison data with calculated deltas
 *
 * @example
 * // Single week comparison
 * const data = await getAnalyticsComparison({
 *   period1: '2026-W05',
 *   period2: '2026-W04',
 * })
 *
 * @example
 * // Range comparison with breakdown
 * const data = await getAnalyticsComparison({
 *   period1: '2026-W01:W05',
 *   period2: '2025-W49:W52',
 *   groupBy: 'brand',
 * })
 */
export async function getAnalyticsComparison(
  params: ComparisonParams
): Promise<ComparisonResponse> {
  const searchParams = new URLSearchParams({
    period1: params.period1,
    period2: params.period2,
  })

  if (params.groupBy) {
    searchParams.set('groupBy', params.groupBy)
  }

  return apiClient.get<ComparisonResponse>(
    `/v1/analytics/weekly/comparison?${searchParams.toString()}`
  )
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Determine change direction from delta value
 * @param delta - Delta value with percent
 * @returns Direction indicator
 */
export function getChangeDirection(delta: DeltaValue): ChangeDirection {
  if (delta.percent > 0) return 'up'
  if (delta.percent < 0) return 'down'
  return 'neutral'
}

/**
 * Transform delta to UI-friendly MetricComparison
 *
 * @param current - Current period value
 * @param previous - Previous period value
 * @param delta - Delta object from API
 * @returns MetricComparison for UI components
 */
export function deltaToComparison(
  current: number,
  previous: number,
  delta: DeltaValue
): MetricComparison {
  return {
    current,
    previous,
    change: delta.absolute,
    changePercent: delta.percent,
    direction: getChangeDirection(delta),
  }
}

/**
 * Calculate delta from two values (client-side fallback)
 * Use when API doesn't provide pre-calculated delta
 *
 * @param current - Current value
 * @param previous - Previous/baseline value
 * @returns DeltaValue object
 */
export function calculateDelta(current: number, previous: number): DeltaValue {
  const absolute = current - previous
  const percent = previous !== 0 ? (absolute / Math.abs(previous)) * 100 : 0

  return { absolute, percent }
}

/**
 * Build comparison period string for week arrays
 * Formats weeks into range string for API
 *
 * @param weeks - Array of ISO week strings (sorted chronologically)
 * @returns Period string (single week or range)
 *
 * @example
 * buildPeriodRange(['2026-W05']) // "2026-W05"
 * buildPeriodRange(['2026-W01', '2026-W02', '2026-W03']) // "2026-W01:W03"
 * buildPeriodRange(['2025-W50', '2025-W51', '2025-W52', '2026-W01']) // "2025-W50:2026-W01"
 */
export function buildPeriodRange(weeks: string[]): string {
  if (weeks.length === 0) return ''
  if (weeks.length === 1) return weeks[0]

  const first = weeks[0]
  const last = weeks[weeks.length - 1]

  // Extract year from first and last weeks
  const firstYear = first.split('-W')[0]
  const lastYear = last.split('-W')[0]

  if (firstYear === lastYear) {
    // Short format: 2026-W01:W05
    const lastWeekNum = last.split('-W')[1]
    return `${first}:W${lastWeekNum}`
  }

  // Full format: 2025-W49:2026-W04
  return `${first}:${last}`
}

// ============================================================================
// Query Keys Factory
// ============================================================================

/**
 * Query keys for comparison data
 * Used with TanStack Query for cache management
 */
export const comparisonQueryKeys = {
  /** Base key for all comparison queries */
  all: ['analytics-comparison'] as const,

  /** Key for specific period comparison */
  periods: (period1: string, period2: string) =>
    [...comparisonQueryKeys.all, period1, period2] as const,

  /** Key for period comparison with groupBy */
  withGroupBy: (period1: string, period2: string, groupBy: string) =>
    [...comparisonQueryKeys.periods(period1, period2), groupBy] as const,
}
