/**
 * Daily Analytics API Client
 * Story 61.9-FE: Daily Breakdown Support
 *
 * COMPATIBILITY LAYER - Re-exports from modular structure
 *
 * This file maintains backward compatibility for existing imports.
 * New code should import directly from '@/lib/api/daily-analytics/'.
 *
 * @see docs/epics/epic-61-fe-dashboard-data-integration.md
 */

// Re-export everything from the modular structure
export {
  // Query keys
  dailyAnalyticsQueryKeys,
  // Types
  type OrdersVolumeResponse,
  type FinanceSummaryResponse,
  type AdvertisingResponse,
  // API functions
  getOrdersDailyData,
  getFinanceDailyData,
  getAdvertisingDailyData,
  getAllDailyData,
} from './daily-analytics/index'
