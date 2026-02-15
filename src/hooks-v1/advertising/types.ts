/**
 * Advertising Analytics Hook Types
 * Epic 33-FE: Advertising Analytics
 *
 * TypeScript interfaces for advertising hooks options.
 */

export interface UseAdvertisingAnalyticsOptions {
  /** Enable/disable the query */
  enabled?: boolean
  /** Refetch interval in milliseconds */
  refetchInterval?: number
}

export interface UseAdvertisingCampaignsOptions {
  /** Enable/disable the query */
  enabled?: boolean
  /** Refetch interval in milliseconds */
  refetchInterval?: number
}

export interface UseAdvertisingSyncStatusOptions {
  /** Enable/disable the query */
  enabled?: boolean
  /**
   * Refetch interval in milliseconds.
   * Default: 60000 (1 minute) per Story 33.6-fe AC4.
   */
  refetchInterval?: number
  /**
   * Whether to continue polling in background.
   * Default: false (stop when tab is hidden).
   */
  refetchIntervalInBackground?: boolean
}
