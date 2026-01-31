/**
 * Advertising Analytics React Query Hooks
 * Epic 33-FE: Advertising Analytics
 *
 * COMPATIBILITY LAYER - Re-exports from modular structure
 *
 * This file maintains backward compatibility for existing imports.
 * New code should import directly from '@/hooks/advertising'.
 *
 * @see Story 33.1-fe: Types & API Client
 */

// Re-export everything from the modular structure
export {
  // Query keys
  advertisingQueryKeys,
  // Types
  type UseAdvertisingAnalyticsOptions,
  type UseAdvertisingCampaignsOptions,
  type UseAdvertisingSyncStatusOptions,
  // Core hooks
  useAdvertisingAnalytics,
  useAdvertisingCampaigns,
  useAdvertisingSyncStatus,
  useAdvertisingMergedGroups,
  useAdvertisingAnalyticsComparison,
  // Helper hooks
  useInvalidateAdvertisingQueries,
  useInvalidateAnalyticsQueries,
  usePrefetchAdvertisingAnalytics,
} from './advertising'
