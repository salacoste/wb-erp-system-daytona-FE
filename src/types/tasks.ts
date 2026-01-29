/**
 * Task Queue TypeScript Types
 * Story 42.1-FE: TypeScript Types Update
 * Epic 42-FE: Task Handlers Adaptation
 *
 * Types for task queue API including sanity check, margin recalculation, and weekly aggregation.
 * @see docs/stories/epic-42/story-42.1-fe-typescript-types-update.md
 */

// =============================================================================
// Task Type Union
// =============================================================================

/**
 * All supported task types in the system
 * Used for type-safe task_type field in EnqueueTaskRequest
 */
export type TaskType =
  | 'finances_weekly_ingest'
  | 'products_sync'
  | 'recalculate_weekly_margin'
  | 'weekly_margin_aggregate'
  | 'weekly_sanity_check'
  | 'publish_weekly_views'
  /** @deprecated Use recalculate_weekly_margin instead */
  | 'enrich_cogs'

// =============================================================================
// Task Status Types
// =============================================================================

/** Task execution status */
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'dlq' | 'cancelled'

// =============================================================================
// Sanity Check Types
// =============================================================================

/** Payload for weekly_sanity_check task */
export interface SanityCheckPayload {
  /** Optional: specific week to validate (ISO format, e.g., "2025-W49") */
  week?: string
}

/** Result from weekly_sanity_check task */
export interface SanityCheckResult {
  /** Task completion status */
  status: 'completed'
  /** Number of weeks validated */
  weeks_validated: number
  /** Number of checks that passed */
  checks_passed: number
  /** Number of checks that failed */
  checks_failed: number
  /** Warning messages with details */
  warnings: string[]
  /** First 100 nm_ids of products without COGS */
  missing_cogs_products: string[]
  /** Total count of products without COGS */
  missing_cogs_total: number
  /** Execution duration in milliseconds */
  duration_ms: number
}

// =============================================================================
// Margin Recalculation Types
// =============================================================================

/** Payload for recalculate_weekly_margin task */
export interface MarginRecalcPayload {
  /** ISO weeks to recalculate (e.g., ["2025-W49", "2025-W50"]) */
  weeks: string[]
  /** Optional: limit recalculation to specific products */
  nm_ids?: string[]
}

/** Result from recalculate_weekly_margin task */
export interface MarginRecalcResult {
  /** Task completion status */
  status: 'completed'
  /** Number of successfully recalculated records */
  successCount: number
  /** Number of failed recalculations */
  failureCount: number
  /** Weeks that were processed */
  weeks: string[]
}

// =============================================================================
// Weekly Aggregate Types
// =============================================================================

/** Payload for weekly_margin_aggregate task */
export interface WeeklyAggregatePayload {
  /** Single week to aggregate (ISO format) */
  week?: string
  /** Multiple weeks to aggregate */
  weeks?: string[]
  /** Date range start (ISO date string) */
  dateFrom?: string
  /** Date range end (ISO date string) */
  dateTo?: string
}

/** Result from weekly_margin_aggregate task */
export interface WeeklyAggregateResult {
  /** Task completion status */
  status: 'completed'
  /** Number of weeks processed */
  weeks_processed: number
  /** Number of summary records created */
  summaries_created: number
  /** Number of total records created */
  totals_created: number
  /** Execution duration in milliseconds */
  duration_ms: number
}

// =============================================================================
// Enqueue Task Request/Response Types
// =============================================================================

/** Request to enqueue a new task */
export interface EnqueueTaskRequest<T = unknown> {
  /** Task type to execute */
  task_type: TaskType
  /** Task-specific payload */
  payload: T
  /** Optional priority (1=critical, 5=normal, 9=bulk) */
  priority?: number
}

/** Response from task enqueue endpoint */
export interface EnqueueTaskResponse {
  /** Unique task identifier */
  task_uuid: string
  /** Initial task status */
  status: 'pending' | 'processing' | 'completed' | 'failed'
  /** Timestamp when task was enqueued */
  enqueued_at: string
  /** True if using deprecated task type */
  deprecated?: boolean
}

// =============================================================================
// Task Status Response Types
// =============================================================================

/** Response from task status endpoint */
export interface TaskStatusResponse<T = unknown> {
  /** Current task status */
  status: TaskStatus
  /** Task result (when completed) */
  metrics?: T
  /** Error message (when failed) */
  error?: string
  /** Task progress percentage (0-100) */
  progress?: number
}
