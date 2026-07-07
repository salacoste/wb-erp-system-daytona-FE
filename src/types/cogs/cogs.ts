/**
 * COGS — Core Types, Assignment & Bulk Upload
 * Extracted from cogs.ts (Story 99.1-FE)
 */

// History types live in cogs-history.ts; re-exported via barrel index.ts
export type {
  CogsHistoryItem,
  CogsHistoryResponse,
  VersionChainInfo,
  CogsSource,
} from './cogs-history'

// ============================================================================
// Core COGS Types
// ============================================================================

export type MissingDataReason =
  | 'NO_SALES_IN_PERIOD'
  | 'COGS_NOT_ASSIGNED'
  | 'NO_SALES_DATA'
  | 'ANALYTICS_UNAVAILABLE'
  | null

export type MarginCalculationStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'not_found'
  | 'failed'

export interface MarginCalculationStatusResponse {
  status: MarginCalculationStatus
  estimated_completion?: string
  weeks?: string[]
  enqueued_at?: string
  started_at?: string
  error?: string
}

export interface CogsRecord {
  id: string
  unit_cost_rub: string
  currency?: string
  valid_from: string
  valid_to: string | null
  version?: number
  source?: string
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface ApplicableCogs {
  unit_cost_rub: number
  valid_from: string
  applies_to_week: string
  is_same_as_current: boolean
}

// ============================================================================
// COGS Assignment & Bulk Upload
// ============================================================================

export interface CogsAssignmentRequest {
  unit_cost_rub: number
  valid_from: string
  currency?: string
  source?: string
  notes?: string
}

export interface BulkCogsItem {
  nm_id: string
  sa_name?: string
  unit_cost_rub: number
  valid_from: string
  currency?: string
  source?: string
  notes?: string
}

export interface BulkCogsUploadRequest {
  items?: BulkCogsItem[]
  assignments?: BulkCogsItem[]
}

export interface BulkCogsResult {
  nm_id: string
  sa_name?: string
  success: boolean
  cogs_id?: string
  version?: number
  error_code?: string
  error_message?: string
}

/** Margin recalculation status from bulk COGS v2 response (Request #186). */
export interface MarginRecalculationStatus {
  /** Whether the backend enqueued a margin-batch recalculation task */
  triggered: boolean
  /** ISO weeks affected by the COGS assignment — used for toast UX */
  affectedWeeks: string[]
  /** BullMQ job ID for the margin-batch task (e.g. "margin-batch-<cabinetId>-<ts>") */
  taskUuid: string
}

export interface BulkCogsUploadResponse {
  data: {
    succeeded: number
    failed: number
    results: BulkCogsResult[]
    message: string
    marginRecalculation?: MarginRecalculationStatus
  }
}

/**
 * Canonical frontend bulk-COGS result summary. Validation F-34:
 * `normalizeBulkCogsResponse` maps BOTH the legacy `{ totalItems, createdItems,
 * skippedItems, errors }` shape (what `/v1/products/cogs/bulk` actually returns today)
 * AND the v2 `{ succeeded, failed, results, message, marginRecalculation }` shape into
 * this single canonical shape, so hooks/components never touch raw backend shapes.
 */
export interface BulkCogsResultSummary {
  succeeded: number
  failed: number
  results: BulkCogsResult[]
  message: string
  marginRecalculation?: MarginRecalculationStatus
}

export interface BulkCogsUploadResponseLegacy {
  totalItems: number
  createdItems: number
  /** Backend NEVER increments skippedItems on this path (stays 0); `failed` derives from
   *  errors.length (iter-69). */
  skippedItems: number
  /** Real backend error-item shape (camelCase) — confirmed cogs.service.ts result.errors.push. */
  errors: Array<{
    index: number
    nmId: number
    code: string
    message: string
  }>
}

export interface CogsValidationError {
  field: string
  message: string
  code?: string
  value?: unknown
}
