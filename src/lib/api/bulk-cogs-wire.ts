/**
 * Bulk COGS request wire-boundary helpers.
 *
 * Frontend domain objects keep `nm_id` as a string, but the bulk COGS API
 * requires a JSON number. Keep strict parsing here so invalid identifiers never
 * silently become NaN, Infinity, rounded unsafe integers, or truncated decimals
 * in the serialized request body.
 */

import type {
  BulkCogsItem,
  BulkCogsUploadRequest,
  BulkCogsWireItem,
  BulkCogsWireRequest,
} from '@/types/api'

export type BulkCogsNmIdParseErrorCode =
  | 'required'
  | 'non_digit'
  | 'non_finite'
  | 'non_integer'
  | 'unsafe_integer'

export type BulkCogsNmIdParseResult =
  | { ok: true; value: number }
  | { ok: false; code: BulkCogsNmIdParseErrorCode; message: string }

const DIGITS_ONLY = /^\d+$/

function invalidNmId(code: BulkCogsNmIdParseErrorCode, message: string): BulkCogsNmIdParseResult {
  return { ok: false, code, message }
}

/** Strictly parse an nm_id that is safe to serialize as a JSON integer. */
export function parseBulkCogsNmId(nmId: unknown): BulkCogsNmIdParseResult {
  if (typeof nmId === 'string') {
    const normalized = nmId.trim()

    if (normalized === '') {
      return invalidNmId('required', 'Артикул обязателен')
    }

    if (!DIGITS_ONLY.test(normalized)) {
      return invalidNmId('non_digit', 'Артикул должен содержать только цифры')
    }

    const value = Number(normalized)

    if (!Number.isFinite(value)) {
      return invalidNmId('non_finite', 'Артикул должен быть конечным числом')
    }

    if (!Number.isInteger(value)) {
      return invalidNmId('non_integer', 'Артикул должен быть целым числом')
    }

    if (!Number.isSafeInteger(value)) {
      return invalidNmId('unsafe_integer', 'Артикул превышает безопасный диапазон чисел')
    }

    return { ok: true, value }
  }

  if (typeof nmId === 'number') {
    if (!Number.isFinite(nmId)) {
      return invalidNmId('non_finite', 'Артикул должен быть конечным числом')
    }

    if (!Number.isInteger(nmId)) {
      return invalidNmId('non_integer', 'Артикул должен быть целым числом')
    }

    if (!Number.isSafeInteger(nmId)) {
      return invalidNmId('unsafe_integer', 'Артикул превышает безопасный диапазон чисел')
    }

    if (!DIGITS_ONLY.test(String(nmId))) {
      return invalidNmId('non_digit', 'Артикул должен содержать только цифры')
    }

    return { ok: true, value: nmId }
  }

  if (nmId === null || nmId === undefined) {
    return invalidNmId('required', 'Артикул обязателен')
  }

  return invalidNmId('non_digit', 'Артикул должен содержать только цифры')
}

function formatInvalidNmIdError(
  item: BulkCogsItem,
  result: Exclude<BulkCogsNmIdParseResult, { ok: true }>
) {
  return `Invalid bulk COGS nm_id "${String(item.nm_id)}": ${result.message}`
}

/**
 * Convert a FE-canonical bulk-COGS item (string `nm_id`) to the wire shape the
 * `POST /v1/products/cogs/bulk` endpoint requires (integer `nm_id`).
 */
export function toBulkCogsWireItem(item: BulkCogsItem): BulkCogsWireItem {
  const parsedNmId = parseBulkCogsNmId(item.nm_id)

  if (!parsedNmId.ok) {
    throw new Error(formatInvalidNmIdError(item, parsedNmId))
  }

  return { ...item, nm_id: parsedNmId.value }
}

/** Map a full bulk-COGS request to its wire shape (converts `items` + `assignments`). */
export function toBulkCogsWireRequest(request: BulkCogsUploadRequest): BulkCogsWireRequest {
  return {
    items: request.items?.map(toBulkCogsWireItem),
    assignments: request.assignments?.map(toBulkCogsWireItem),
  }
}
