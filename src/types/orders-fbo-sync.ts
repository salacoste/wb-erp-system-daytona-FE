/**
 * FBO Orders Sync, Backfill, and Query Types
 * Extracted from orders-fbo.ts for file-size compliance.
 *
 * Endpoints:
 *   POST /v1/orders/fbo/sync      — manual sync trigger
 *   GET  /v1/orders/fbo/sync-status — sync status
 *   POST /v1/orders/fbo/backfill  — historical backfill
 */

// =============================================================================
// FBO Orders Sync
// =============================================================================

/** Response from GET /v1/orders/fbo/sync-status */
export interface FboOrdersSyncStatusResponse {
  /** Whether sync is enabled */
  enabled: boolean
  /** Schedule description (e.g., "Every 15 minutes") */
  schedule: string
  /** Timezone for the schedule */
  timezone: string
}

/** Response from POST /v1/orders/fbo/sync */
export interface FboOrdersSyncTriggerResponse {
  /** Job ID for tracking */
  jobId: string
  /** Confirmation message */
  message: string
  /** Job priority */
  priority: string
}

/** Request body for POST /v1/orders/fbo/backfill */
export interface FboOrdersBackfillParams {
  /** Start date YYYY-MM-DD */
  dateFrom: string
  /** End date YYYY-MM-DD */
  dateTo: string
}

/** Response from POST /v1/orders/fbo/backfill */
export interface FboOrdersBackfillResponse {
  jobId: string
  message: string
}

// =============================================================================
// Query Parameters
// =============================================================================

/** Query parameters for GET /v1/orders/fbo and GET /v1/sales/fbo */
export interface FboOrdersListParams {
  /** Start date YYYY-MM-DD */
  from?: string
  /** End date YYYY-MM-DD */
  to?: string
  /** Filter by nm_id */
  nm_id?: number
  /** Sort field */
  sort_by?: string
  /** Sort direction */
  sort_order?: 'asc' | 'desc'
  /** Items per page (1-1000, default 100) */
  limit?: number
  /** Pagination offset */
  offset?: number
}
