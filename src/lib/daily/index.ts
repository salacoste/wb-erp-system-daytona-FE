/**
 * Daily Helpers - Barrel Export
 * Story 61.9-FE: Daily Breakdown Support
 *
 * @see docs/epics/epic-61-fe-dashboard-data-integration.md
 */

// Day utilities
export { getDayOfWeek, createEmptyDailyMetrics } from './day-utils'

// Date range utilities
export { fillMissingDays, getDateRange, getDaysInRange } from './date-range'

// Aggregation
export { calculateDailyTheoreticalProfit, aggregateDailyMetrics } from './aggregation'
