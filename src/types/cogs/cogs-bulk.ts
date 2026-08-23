/** COGS assignment, bulk-upload, and bulk-result contracts. */

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

/**
 * Wire item for `POST /v1/products/cogs/bulk` (BE-A-1). The backend validator rejects
 * string `nm_id` (400 "nm_id must be an integer number"); the FE keeps nm_id as string
 * in its domain model (anti-pattern #10, `product.ts:7` "nm_id is STRING"), so this wire
 * shape carries the integer form used ONLY at the POST boundary. Produced by
 * `toBulkCogsWireItem` (`useBulkCogsAssignment-utils.ts`) — never constructed by hand.
 */
export interface BulkCogsWireItem extends Omit<BulkCogsItem, 'nm_id'> {
  nm_id: number
}

export interface BulkCogsWireRequest {
  items?: BulkCogsWireItem[]
  assignments?: BulkCogsWireItem[]
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
