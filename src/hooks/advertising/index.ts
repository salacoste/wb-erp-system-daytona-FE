/**
 * Advertising Analytics Hooks - Barrel Export
 * Epic 33-FE: Advertising Analytics
 *
 * @see Story 33.1-fe: Types & API Client
 */

// Query keys
export { advertisingQueryKeys } from './query-keys'

// Types
export type {
  UseAdvertisingAnalyticsOptions,
  UseAdvertisingCampaignsOptions,
  UseAdvertisingSyncStatusOptions,
} from './types'

// Core hooks
export {
  useAdvertisingAnalytics,
  useAdvertisingCampaigns,
  useAdvertisingSyncStatus,
  useAdvertisingMergedGroups,
  useAdvertisingAnalyticsComparison,
} from './hooks'

// Helper hooks
export {
  useInvalidateAdvertisingQueries,
  useInvalidateAnalyticsQueries,
  usePrefetchAdvertisingAnalytics,
} from './helpers'
