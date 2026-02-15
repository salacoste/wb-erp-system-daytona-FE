/**
 * Analytics Comparison Hooks
 * Story 61.5-FE: Comparison Endpoint Integration
 *
 * COMPATIBILITY LAYER - Re-exports from modular structure
 *
 * This file maintains backward compatibility for existing imports.
 * New code should import directly from '@/hooks/comparison'.
 *
 * @see docs/stories/epic-61/story-61.5-fe-comparison-endpoint.md
 */

// Re-export everything from the modular structure
export {
  // Types
  type UseComparisonOptions,
  type UseDashboardComparisonResult,
  // Helpers
  extractMetricComparison,
  // Hooks
  useAnalyticsComparison,
  useDashboardComparison,
  useRangeComparison,
} from './comparison'
