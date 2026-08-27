/**
 * Storage Import — Boundary Normalizer
 *
 * Normalizes raw backend responses from import status endpoint.
 *
 * Endpoint: GET /v1/imports/{id}
 *
 * @see CLAUDE.md § Boundary Normalizer Pattern
 */

import { logger } from '@/lib/logger'
import { asRecord, toOptionalString, toStr } from './normalizer-helpers'
import type { ImportStatusResponse } from '@/types/storage-analytics'

/**
 * Normalizes the import status response into ImportStatusResponse.
 * Backend returns canonical snake_case fields and a nested error object.
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
  const typedStatus: ImportStatusResponse['status'] = Object.hasOwn(statusMap, status)
    ? statusMap[status as keyof typeof statusMap]
    : 'unknown'
  if (typedStatus === 'unknown') {
    logger.warn('[Storage Import] Unrecognized import status received', {
      status: status ? '<unrecognized>' : '<missing>',
    })
  }

  const rawRowsImported = r.rows_imported
  const rowsImported =
    typedStatus === 'completed' &&
    typeof rawRowsImported === 'number' &&
    Number.isSafeInteger(rawRowsImported) &&
    rawRowsImported >= 0
      ? rawRowsImported
      : undefined

  const rawError = asRecord(r.error)
  const errorCode = toOptionalString(rawError.code)
  const errorMessage = toOptionalString(rawError.message)
  const error =
    typedStatus === 'failed' && errorCode && errorMessage
      ? {
          code: errorCode,
          message: errorMessage,
          ...(rawError.details === undefined ? {} : { details: rawError.details }),
        }
      : undefined

  const rawDateRange = asRecord(r.date_range)
  const dateRangeStart = toOptionalString(rawDateRange.start)
  const dateRangeEnd = toOptionalString(rawDateRange.end)
  const dateRange =
    dateRangeStart && dateRangeEnd
      ? {
          start: dateRangeStart,
          end: dateRangeEnd,
        }
      : undefined

  return {
    import_id: toStr(r.import_id),
    status: typedStatus,
    rows_imported: rowsImported,
    error,
    error_message: error?.message,
    completed_at: toOptionalString(r.completed_at),
    date_range: dateRange,
  }
}
