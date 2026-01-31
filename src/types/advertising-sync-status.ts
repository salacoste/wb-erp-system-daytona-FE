/**
 * Advertising Sync Status Types
 * Story 63.3-FE: Advertising Sync Status Badge
 *
 * Extended sync status types for dashboard widget.
 * Adds 'partial_success' status not present in original SyncTaskStatus.
 */

/**
 * Extended sync task status with partial_success state.
 * Extends original SyncTaskStatus from advertising-analytics.ts
 *
 * - idle: No sync running
 * - syncing: Sync in progress
 * - completed: Sync finished successfully
 * - partial_success: Sync finished with some errors
 * - failed: Sync failed completely
 */
export type ExtendedSyncTaskStatus = 'idle' | 'syncing' | 'completed' | 'partial_success' | 'failed'

/**
 * Extended sync status response for dashboard badge.
 * Compatible with backend GET /v1/analytics/advertising/sync-status
 */
export interface ExtendedSyncStatusResponse {
  /** Last sync timestamp (null if never synced) */
  lastSyncAt: string | null
  /** Next scheduled sync timestamp (ISO datetime) */
  nextScheduledSync: string
  /** Current sync status (extended with partial_success) */
  status: ExtendedSyncTaskStatus
  /** Number of campaigns synced */
  campaignsSynced: number
  /** Data available from date (YYYY-MM-DD) */
  dataAvailableFrom: string | null
  /** Data available to date (YYYY-MM-DD) */
  dataAvailableTo: string | null
}

/**
 * Status configuration for sync badge display.
 */
export interface SyncStatusConfig {
  /** Russian label for the status */
  label: string
  /** Text color class */
  color: string
  /** Background color class */
  bgColor: string
  /** Description for tooltip */
  description: string
  /** Whether to animate the icon */
  animate?: boolean
}

/**
 * Sync status configuration map.
 */
export type SyncStatusConfigMap = Record<ExtendedSyncTaskStatus, SyncStatusConfig>
