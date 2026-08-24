/**
 * Storage Import — Boundary Normalizer
 *
 * Normalizes raw backend responses from import status endpoint.
 *
 * Endpoint: GET /v1/imports/{id}
 *
 * @see CLAUDE.md § Boundary Normalizer Pattern
 */

import { asRecord, toCount, toStr, toOptionalString } from './normalizer-helpers'
import type { ImportStatusResponse } from '@/types/storage-analytics'

/**
 * Normalizes the import status response into ImportStatusResponse.
 * Backend returns: { import_id, status, rows_imported?, error_message?, completed_at? }
 */
export function normalizeImportStatusResponse(raw: unknown): ImportStatusResponse {
  const r = asRecord(raw)
  const status = toStr(r.status)
  // Story 169.12 Task 0 (Defensive Frontend): an unrecognized backend status is
  // preserved distinguishably as 'unknown' instead of being coerced to 'failed'
  // (which rendered a false import error). 'unknown' is not a failure — consumers
  // keep polling, same as 'pending'.
  const statusMap: Record<string, ImportStatusResponse['status']> = {
    pending: 'pending',
    processing: 'processing',
    completed: 'completed',
    failed: 'failed',
  }
  const typedStatus: ImportStatusResponse['status'] = statusMap[status] ?? 'unknown'

  return {
    import_id: toStr(r.import_id ?? r.importId),
    status: typedStatus,
    rows_imported: toCount(r.rows_imported ?? r.rowsImported) || undefined,
    error_message: toOptionalString(r.error_message ?? r.errorMessage),
    completed_at: toOptionalString(r.completed_at ?? r.completedAt),
  }
}
