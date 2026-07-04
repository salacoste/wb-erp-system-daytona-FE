/**
 * Orders Type Guards
 * Story 40.1-FE: TypeScript Types & API Client Foundation
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Runtime type guards for order types, status validation, and discriminated unions.
 */

import type { SupplierStatus, WbStatus, OrderOperationalStatus } from './orders'
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

/**
 * Valid WB status values — MUST stay in sync with the WbStatus union (orders.ts).
 * Validation F-11 review F1: ready_for_pickup + declined_by_client were added to
 * the union but omitted here, so isValidWbStatus() silently rejected ~13% of live
 * statuses. The `satisfies` check below makes any future union/array drift a
 * compile error.
 */
const VALID_WB_STATUSES = [
  'waiting',
  'sorted',
  'sold',
  'ready_for_pickup',
  'canceled',
  'canceled_by_client',
  'declined_by_client',
  'defect',
  'return_at_pvz',
  'returned_to_seller',
] as const satisfies readonly WbStatus[]

// Compile-time completeness: errors if a WbStatus union member is missing from
// VALID_WB_STATUSES above (the gap that F-11 review F1 caught). `satisfies` alone
// only rejects INVALID entries; this rejects MISSING ones too.
type _WbStatusesMissingFromGuard = Exclude<WbStatus, (typeof VALID_WB_STATUSES)[number]>
const _wbStatusGuardComplete: _WbStatusesMissingFromGuard extends never ? true : never = true
void _wbStatusGuardComplete

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

// --- Operational status guard (Story O1) ---

/** Valid operational status values — kept in sync with OrderOperationalStatus union */
const VALID_OPERATIONAL_STATUSES = [
  'NEW',
  'ASSEMBLED',
  'PACKED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'RETURNED',
] as const satisfies readonly OrderOperationalStatus[]

/**
 * Check if value is a valid OrderOperationalStatus.
 * Unknown backend values fall back to NEW at the normalizer layer.
 */
export function isValidOperationalStatus(value: unknown): value is OrderOperationalStatus {
  return (
    typeof value === 'string' && (VALID_OPERATIONAL_STATUSES as readonly string[]).includes(value)
  )
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
