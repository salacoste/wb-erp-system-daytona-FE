/**
 * Analytics Comparison Helpers
 * Story 61.5-FE: Comparison Endpoint Integration
 */

import { deltaToComparison } from '@/lib/api/analytics-comparison'
import type { ComparisonResponse, MetricComparison } from '@/types/analytics-comparison'

/**
 * Extract single metric comparison from raw response.
 * Utility for components that need one specific metric.
 *
 * @param data - Raw comparison response
 * @param metric - Metric key to extract
 * @returns MetricComparison or null
 */
export function extractMetricComparison(
  data: ComparisonResponse | undefined,
  metric: keyof ComparisonResponse['delta']
): MetricComparison | null {
  if (!data) return null

  const period1Value = data.period1[metric as keyof typeof data.period1] as number
  const period2Value = data.period2[metric as keyof typeof data.period2] as number
  const delta = data.delta[metric]

  return deltaToComparison(period1Value, period2Value, delta)
}
