/**
 * Orders History Types
 * Story 40.1-FE: TypeScript Types & API Client Foundation
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Types for local status history, WB native status history, and merged full history.
 */

import type { SupplierStatus, WbStatus } from './orders'

// ============================================================================
// Local History Types (OrderStatusHistory table)
// ============================================================================

/**
 * Local status history entry (from OrderStatusHistory table)
 * Локальная запись истории статусов (наше отслеживание)
 */
export interface LocalHistoryEntry {
  /** Entry UUID */
  id: string
  /** Previous supplier status */
  oldSupplierStatus: SupplierStatus | null
  /** New supplier status */
  newSupplierStatus: SupplierStatus
  /** Previous WB status */
  oldWbStatus: WbStatus | null
  /** New WB status */
  newWbStatus: WbStatus
  /** Status change timestamp (ISO 8601) */
  changedAt: string
  /** Duration in this status (minutes, null for first entry) */
  durationMinutes: number | null
  /** User/system that changed the status (optional) */
  changedBy?: string
}

/**
 * Current order status info
 * Текущий статус заказа
 */
export interface CurrentOrderStatus {
  supplierStatus: SupplierStatus
  wbStatus: WbStatus
  /** True if order is in final state */
  isFinal: boolean
}

/**
 * Local history summary
 * Сводка по локальной истории статусов
 */
export interface LocalHistorySummary {
  /** Total number of status transitions */
  totalTransitions: number
  /** Total duration from first to last (minutes) */
  totalDurationMinutes: number | null
  /** Order creation timestamp */
  createdAt: string
  /** Completion timestamp (null if not completed) */
  completedAt: string | null
}

/**
 * Response from GET /v1/orders/:orderId/history
 * Локальная история статусов заказа
 */
export interface LocalHistoryResponse {
  orderId: string
  orderUid: string
  currentStatus: CurrentOrderStatus
  history: LocalHistoryEntry[]
  summary: LocalHistorySummary
}

// ============================================================================
// WB Native History Types (OrderWbStatusHistory table)
// ============================================================================

/**
 * WB native status history entry (from OrderWbStatusHistory table)
 * Uses 40+ detailed WB status codes
 * Запись нативной истории статусов WB
 */
export interface WbHistoryEntry {
  /** Entry UUID */
  id: string
  /** WB native status code (40+ possible values) */
  wbStatusCode: string
  /** Timestamp from WB API (ISO 8601) */
  wbStatusChangedAt: string
  /** Duration in this status (minutes, null for first entry) */
  durationMinutes: number | null
}

/**
 * WB history summary
 * Сводка по WB истории статусов
 */
export interface WbHistorySummary {
  /** Total number of status transitions */
  totalTransitions: number
  /** Total duration from first to last (minutes) */
  totalDurationMinutes: number | null
  /** Current WB status code (null if not synced) */
  currentWbStatus: string | null
  /** First status timestamp */
  createdAt: string
  /** Last status change timestamp */
  lastUpdatedAt: string | null
}

/**
 * Response from GET /v1/orders/:orderId/wb-history
 * Нативная WB история статусов
 */
export interface WbHistoryResponse {
  orderId: string
  orderUid: string
  wbHistory: WbHistoryEntry[]
  summary: WbHistorySummary
}

// ============================================================================
// Full (Merged) History Types
// ============================================================================

/**
 * Local history entry in full history format
 */
export interface FullHistoryLocalEntry {
  source: 'local'
  oldSupplierStatus: SupplierStatus | null
  newSupplierStatus: SupplierStatus
  oldWbStatus: WbStatus | null
  newWbStatus: WbStatus
  timestamp: string
}

/**
 * WB native history entry in full history format
 */
export interface FullHistoryWbNativeEntry {
  source: 'wb_native'
  wbStatusCode: string
  timestamp: string
}

/**
 * Full history entry - discriminated union of local and WB native
 * Объединённая запись истории (локальная или WB нативная)
 */
export type FullHistoryEntry = FullHistoryLocalEntry | FullHistoryWbNativeEntry

/**
 * Full history summary
 * Сводка по объединённой истории
 */
export interface FullHistorySummary {
  localEntriesCount: number
  wbNativeEntriesCount: number
  totalEntriesCount: number
}

/**
 * Response from GET /v1/orders/:orderId/full-history
 * Объединённая история статусов (локальная + WB нативная)
 */
export interface FullHistoryResponse {
  orderId: string
  orderUid: string
  fullHistory: FullHistoryEntry[]
  summary: FullHistorySummary
}

// Re-export status types for convenience
export type { SupplierStatus, WbStatus } from './orders'
