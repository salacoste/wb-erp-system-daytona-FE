/**
 * FBS Historical Analytics Types
 * Story 51.1-FE: FBS Analytics Types & API Module
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 * Reference: test-api/15-analytics-fbs.http
 */

// ============================================================================
// Aggregation & View Types
// ============================================================================

/** Уровень агрегации данных для трендов */
export type AggregationType = 'day' | 'week' | 'month'

/** Тип представления сезонных паттернов */
export type SeasonalViewType = 'monthly' | 'weekly' | 'quarterly'

/** Доступные метрики для запроса */
export type TrendMetric = 'orders' | 'revenue' | 'cancellations'

/** Статус задачи бэкфилла */
export type BackfillStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'paused'

/** Источник данных для бэкфилла */
export type BackfillDataSource = 'reports' | 'analytics' | 'both'

// ============================================================================
// GET /v1/analytics/orders/trends Types
// ============================================================================

/** Точка данных временного ряда */
export interface TrendDataPoint {
  date: string
  ordersCount: number
  revenue: number
  cancellations: number
  cancellationRate: number
  returns: number
  returnRate: number
  avgOrderValue: number
}

/** Сводная статистика за весь период */
export interface TrendsSummary {
  totalOrders: number
  totalRevenue: number
  avgDailyOrders: number
  cancellationRate: number
  returnRate: number
}

/** Информация об источнике данных */
export interface DataSourceInfo {
  primary: 'orders_fbs' | 'reports' | 'analytics'
}

/** Информация о периоде запроса */
export interface TrendsPeriodInfo {
  from: string
  to: string
  aggregation: AggregationType
  daysIncluded: number
}

/** Ответ GET /v1/analytics/orders/trends */
export interface TrendsResponse {
  trends: TrendDataPoint[]
  summary: TrendsSummary
  dataSource: DataSourceInfo
  period: TrendsPeriodInfo
}

// ============================================================================
// GET /v1/analytics/orders/seasonal Types
// ============================================================================

/** Месячный паттерн данных */
export interface MonthlyPattern {
  month: string
  avgOrders: number
  avgRevenue: number
}

/** Паттерн по дням недели */
export interface WeekdayPattern {
  dayOfWeek: string
  avgOrders: number
}

/** Квартальный паттерн данных */
export interface QuarterlyPattern {
  quarter: string
  avgOrders: number
  avgRevenue: number
}

/** Коллекция сезонных паттернов */
export interface SeasonalPatterns {
  monthly?: MonthlyPattern[]
  weekday?: WeekdayPattern[]
  quarterly?: QuarterlyPattern[]
}

/** Инсайты из сезонного анализа */
export interface SeasonalInsights {
  peakMonth: string
  lowMonth: string
  peakDayOfWeek: string
  seasonalityIndex: number
}

/** Ответ GET /v1/analytics/orders/seasonal */
export interface SeasonalResponse {
  patterns: SeasonalPatterns
  insights: SeasonalInsights
}

// ============================================================================
// GET /v1/analytics/orders/compare Types
// ============================================================================

/** Метрики одного периода в сравнении */
export interface PeriodMetrics {
  from: string
  to: string
  ordersCount: number
  revenue: number
  cancellationRate: number
  avgOrderValue: number
}

/** Рассчитанные различия между периодами */
export interface ComparisonMetrics {
  ordersChange: number
  ordersChangePercent: number
  revenueChange: number
  revenueChangePercent: number
  cancellationRateChange: number
  avgOrderValueChange: number
  avgOrderValueChangePercent: number
}

/** Ответ GET /v1/analytics/orders/compare */
export interface CompareResponse {
  period1: PeriodMetrics
  period2: PeriodMetrics
  comparison: ComparisonMetrics
}

// ============================================================================
// Query Parameter Types
// ============================================================================

/** Параметры GET /v1/analytics/orders/trends */
export interface FbsTrendsParams {
  from: string
  to: string
  aggregation?: AggregationType
  metrics?: TrendMetric[]
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
// Admin Backfill Types
// ============================================================================

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
