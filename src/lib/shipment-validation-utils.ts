/**
 * Shipment validation error extraction utility
 * Extracted from ShipmentActions.tsx for reuse and file size compliance
 * Epic 76-FE, Story 76.4
 */

import { ApiError } from '@/types/api'
import type { ValidationError } from '@/types/shipment-cost'

/** Extract validation errors from ApiError 400 response (collect-all pattern) */
export function extractValidationErrors(err: unknown): ValidationError[] | null {
  if (!(err instanceof ApiError) || err.status !== 400) return null
  const data = err.data as
    | { errors?: Array<{ errorCode: string; message: string; affectedIds?: (string | number)[] }> }
    | undefined
  if (!data?.errors?.length) return null
  return data.errors.map(e => ({
    code: e.errorCode,
    message: e.message,
    affectedIds: e.affectedIds?.map(String),
  }))
}
