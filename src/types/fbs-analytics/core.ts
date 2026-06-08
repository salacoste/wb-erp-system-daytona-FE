/**
 * FBS Analytics Core Types — Aggregation, Trends, Seasonal, Compare
 * Split from fbs-analytics.ts for file size compliance
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
