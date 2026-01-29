/**
 * Orders Type Guards
 * Story 40.1-FE: TypeScript Types & API Client Foundation
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Runtime type guards for order types, status validation, and discriminated unions.
 */

import type { SupplierStatus, WbStatus } from './orders'
import type {
  FullHistoryEntry,
  FullHistoryLocalEntry,
  FullHistoryWbNativeEntry,
} from './orders-history'

// ============================================================================
// Status Validation Guards
// ============================================================================

/** Valid supplier status values */
const VALID_SUPPLIER_STATUSES: readonly SupplierStatus[] = ['new', 'confirm', 'complete', 'cancel']

/** Valid WB status values */
const VALID_WB_STATUSES: readonly WbStatus[] = [
  'waiting',
  'sorted',
  'sold',
  'canceled',
  'canceled_by_client',
  'defect',
]

/**
 * Check if value is a valid SupplierStatus
 * Проверка валидности статуса продавца
 */
export function isValidSupplierStatus(value: unknown): value is SupplierStatus {
  return typeof value === 'string' && VALID_SUPPLIER_STATUSES.includes(value as SupplierStatus)
}

/**
 * Check if value is a valid WbStatus
 * Проверка валидности WB статуса
 */
export function isValidWbStatus(value: unknown): value is WbStatus {
  return typeof value === 'string' && VALID_WB_STATUSES.includes(value as WbStatus)
}

// ============================================================================
// History Entry Type Guards
// ============================================================================

/**
 * Check if entry is a local history entry
 * Проверка типа записи - локальная история
 */
export function isLocalHistoryEntry(entry: unknown): entry is FullHistoryLocalEntry {
  if (!entry || typeof entry !== 'object') {
    return false
  }

  const e = entry as Record<string, unknown>

  return e.source === 'local' && 'newSupplierStatus' in e && 'newWbStatus' in e && 'timestamp' in e
}

/**
 * Check if entry is a WB native history entry
 * Проверка типа записи - WB нативная история
 */
export function isWbNativeHistoryEntry(entry: unknown): entry is FullHistoryWbNativeEntry {
  if (!entry || typeof entry !== 'object') {
    return false
  }

  const e = entry as Record<string, unknown>

  return e.source === 'wb_native' && 'wbStatusCode' in e && 'timestamp' in e
}

/**
 * Check if value is a valid FullHistoryEntry (either local or wb_native)
 * Проверка валидности объединённой записи истории
 */
export function isFullHistoryEntry(value: unknown): value is FullHistoryEntry {
  return isLocalHistoryEntry(value) || isWbNativeHistoryEntry(value)
}
