/**
 * Backfill Admin Types
 * Story 51.10-FE: Backfill Admin Types & Hooks
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Extended types for backfill management (Owner role only).
 * @see docs/stories/epic-51/story-51.10-fe-backfill-admin-types.md
 */

// ============================================================================
// Status & Source Types (AC1)
// ============================================================================

/** Possible backfill status states */
export type BackfillStatus = 'idle' | 'pending' | 'in_progress' | 'completed' | 'failed' | 'paused'

/** Data source type for backfill */
export type DataSource = 'api' | 'report' | 'none'

/** Backfill action discriminated union */
export type BackfillActionType = 'start' | 'pause' | 'resume'

// ============================================================================
// Progress & Error Types (AC1)
// ============================================================================

/** Detailed progress information for backfill */
export interface BackfillProgress {
  total_days: number
  completed_days: number
  current_date: string | null
  percentage: number
  estimated_remaining_seconds: number | null
}

/** Error information for failed backfill */
export interface BackfillError {
  code: string
  message: string
  timestamp: string
  details?: Record<string, unknown>
}

// ============================================================================
// Cabinet Status Types
// ============================================================================

/** Status of backfill for a single cabinet */
export interface BackfillCabinetStatus {
  cabinet_id: string
  cabinet_name: string
  status: BackfillStatus
  data_source: DataSource
  oldest_available_date: string | null
  newest_available_date: string | null
  progress: BackfillProgress | null
  last_error: string | null
  started_at: string | null
  completed_at: string | null
  updated_at: string
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/** Request to start backfill */
export interface StartBackfillRequest {
  cabinet_id: string
  from_date?: string
  to_date?: string
}

/** Response after starting backfill */
export interface StartBackfillResponse {
  cabinet_id: string
  status: BackfillStatus
  message: string
  estimated_duration_minutes: number
}

/** Request for pause/resume actions */
export interface BackfillActionRequest {
  cabinet_id: string
}

/** Response for pause/resume actions */
export interface BackfillActionResponse {
  cabinet_id: string
  status: BackfillStatus
  message: string
}

// ============================================================================
// API Response Types
// ============================================================================

/** Response from GET /v1/admin/backfill/status */
export type BackfillStatusResponse = BackfillCabinetStatus[]

// ============================================================================
// Hook Option Types
// ============================================================================

/** Options for useBackfillStatus hook */
export interface UseBackfillStatusOptions {
  enabled?: boolean
  polling?: boolean
  pollingInterval?: number
}

/** Options for mutation hooks with callbacks */
export interface UseBackfillMutationOptions<TResponse> {
  onSuccess?: (data: TResponse) => void
  onError?: (error: Error) => void
}

// ============================================================================
// Status Configuration Types
// ============================================================================

/** Configuration for status display */
export interface BackfillStatusConfig {
  label: string
  color: string
  bgColor: string
  icon?: string
}

/** Status configuration map */
export type BackfillStatusConfigMap = Record<BackfillStatus, BackfillStatusConfig>
