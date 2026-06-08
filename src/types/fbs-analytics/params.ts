/**
 * FBS Analytics Query Parameter & Backfill Types
 * Split from fbs-analytics.ts for file size compliance
 */

import type { AggregationType, SeasonalViewType } from './core'

// ============================================================================
// Query Parameter Types
// ============================================================================

/** Параметры GET /v1/analytics/orders/trends */
export interface FbsTrendsParams {
  from: string
  to: string
  aggregation?: AggregationType
  metrics?: ('orders' | 'revenue' | 'cancellations')[]
}

/** Параметры GET /v1/analytics/orders/seasonal */
export interface FbsSeasonalParams {
  months?: number
  view?: SeasonalViewType
}

/** Параметры GET /v1/analytics/orders/compare */
export interface FbsCompareParams {
  period1From: string
  period1To: string
  period2From: string
  period2To: string
}

// ============================================================================
// Backfill Status Types
// ============================================================================

/** Статус задачи бэкфилла */
export type BackfillStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'paused'

/** Источник данных для бэкфилла */
export type BackfillDataSource = 'reports' | 'analytics' | 'both'

/** Запрос на запуск бэкфилла - POST /v1/admin/backfill/start */
export interface StartBackfillRequest {
  cabinetId?: string
  dataSource: BackfillDataSource
  dateFrom?: string
  dateTo?: string
  priority?: number
}

/** Ответ на запуск бэкфилла */
export interface StartBackfillResponse {
  success: boolean
  message: string
  jobCount: number
  jobIds: string[]
}

/** Статус бэкфилла для одного кабинета */
export interface BackfillCabinetStatus {
  cabinetId: string
  cabinetName: string
  reportsStatus: BackfillStatus
  analyticsStatus: BackfillStatus
  overallProgress: number
  estimatedEta: string | null
  errors: string[]
}

/** Ответ GET /v1/admin/backfill/status */
export type BackfillStatusResponse = BackfillCabinetStatus[]

/** Запрос для pause/resume действий */
export interface BackfillActionRequest {
  cabinetId: string
}

/** Ответ на pause/resume действия */
export interface BackfillActionResponse {
  success: boolean
  message: string
}

// ============================================================================
// Error Types
// ============================================================================

/** Коды ошибок API FBS аналитики */
export type FbsAnalyticsErrorCode =
  | 'INVALID_DATE_FORMAT'
  | 'INVALID_DATE_RANGE'
  | 'DATE_RANGE_EXCEEDED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CABINET_NOT_FOUND'

/** Структурированный ответ об ошибке */
export interface FbsAnalyticsError {
  error: {
    code: FbsAnalyticsErrorCode
    message: string
  }
}
