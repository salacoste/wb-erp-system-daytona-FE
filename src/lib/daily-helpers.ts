/**
 * Daily Helpers Utility Functions
 * Story 61.9-FE: Daily Breakdown Support
 *
 * COMPATIBILITY LAYER - Re-exports from modular structure
 *
 * This file maintains backward compatibility for existing imports.
 * New code should import directly from '@/lib/daily'.
 *
 * @see docs/epics/epic-61-fe-dashboard-data-integration.md
 */

// Re-export everything from the modular structure
export {
  // Day utilities
  getDayOfWeek,
  createEmptyDailyMetrics,
  // Date range utilities
  fillMissingDays,
  getDateRange,
  getDaysInRange,
  // Aggregation
  calculateDailyTheoreticalProfit,
  aggregateDailyMetrics,
} from './daily'
