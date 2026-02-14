/**
 * Daily Analytics API - Barrel Export
 * Story 61.9-FE: Daily Breakdown Support
 */

// Query keys
export { dailyAnalyticsQueryKeys } from './query-keys'

// Types
export type {
  OrdersVolumeResponse,
  OrdersTrendsResponse,
  FinanceSummaryResponse,
  AdvertisingResponse,
} from './types'

// API functions
export {
  getOrdersDailyData,
  getFinanceDailyData,
  getAdvertisingDailyData,
  getOrdersCogsDailyData,
  getAllDailyData,
} from './api'
