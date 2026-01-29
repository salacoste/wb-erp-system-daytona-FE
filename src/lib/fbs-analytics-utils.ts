/**
 * FBS Analytics Utility Functions
 * Story 51.1-FE: Types & API Module
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Вспомогательные функции для работы с FBS аналитикой
 */

import type { AggregationType, BackfillStatus } from '@/types/fbs-analytics'

// ============================================================================
// Aggregation Utilities
// ============================================================================

/**
 * Определение оптимального уровня агрегации на основе количества дней
 * Следует стратегии tiered resolution бэкенда
 *
 * @param days - Количество дней в периоде
 * @returns Оптимальный тип агрегации
 *
 * @example
 * getSmartAggregation(30)  // 'day'
 * getSmartAggregation(120) // 'week'
 * getSmartAggregation(365) // 'month'
 */
export function getSmartAggregation(days: number): AggregationType {
  if (days <= 90) return 'day'
  if (days <= 180) return 'week'
  return 'month'
}

/**
 * Русские метки для типов агрегации
 */
const AGGREGATION_LABELS: Record<AggregationType, string> = {
  day: 'По дням',
  week: 'По неделям',
  month: 'По месяцам',
}

/**
 * Получение русской метки для типа агрегации
 */
export function getAggregationLabel(aggregation: AggregationType): string {
  return AGGREGATION_LABELS[aggregation] ?? aggregation
}

// ============================================================================
// Data Source Utilities
// ============================================================================

/**
 * Русские метки для источников данных
 */
const DATA_SOURCE_LABELS: Record<string, string> = {
  orders_fbs: 'Реалтайм',
  reports: 'Отчёты',
  analytics: 'Аналитика',
}

/**
 * Получение русской метки для источника данных
 *
 * @param source - Идентификатор источника данных
 * @returns Человекочитаемая метка на русском
 */
export function getDataSourceLabel(source: string): string {
  return DATA_SOURCE_LABELS[source] ?? source
}

// ============================================================================
// Seasonal Index Utilities
// ============================================================================

/**
 * Форматирование индекса сезонности для отображения
 *
 * @param index - Значение индекса (0-1)
 * @returns Отформатированная строка с процентом
 *
 * @example
 * formatSeasonalIndex(0.72) // '72%'
 * formatSeasonalIndex(0.15) // '15%'
 */
export function formatSeasonalIndex(index: number): string {
  return `${Math.round(index * 100)}%`
}

/**
 * Интерпретация уровня сезонности
 *
 * @param index - Значение индекса (0-1)
 * @returns Текстовое описание уровня сезонности
 */
export function getSeasonalityLevel(index: number): string {
  if (index >= 0.7) return 'Высокая'
  if (index >= 0.4) return 'Средняя'
  return 'Низкая'
}

// ============================================================================
// Backfill Status Utilities
// ============================================================================

/**
 * Русские метки для статусов бэкфилла
 */
const BACKFILL_STATUS_LABELS: Record<BackfillStatus, string> = {
  pending: 'Ожидает',
  in_progress: 'Выполняется',
  completed: 'Завершено',
  failed: 'Ошибка',
  paused: 'Приостановлено',
}

/**
 * Получение русской метки для статуса бэкфилла
 */
export function getBackfillStatusLabel(status: BackfillStatus): string {
  return BACKFILL_STATUS_LABELS[status] ?? status
}

/**
 * Цвета для статусов бэкфилла (Tailwind classes)
 */
const BACKFILL_STATUS_COLORS: Record<BackfillStatus, string> = {
  pending: 'text-gray-500 bg-gray-100',
  in_progress: 'text-blue-600 bg-blue-100',
  completed: 'text-green-600 bg-green-100',
  failed: 'text-red-600 bg-red-100',
  paused: 'text-yellow-600 bg-yellow-100',
}

/**
 * Получение CSS классов цвета для статуса бэкфилла
 */
export function getBackfillStatusColor(status: BackfillStatus): string {
  return BACKFILL_STATUS_COLORS[status] ?? 'text-gray-500 bg-gray-100'
}

// ============================================================================
// Trends Chart Utilities
// ============================================================================

/**
 * Metric visibility state type for chart legend toggle
 */
export interface MetricVisibility {
  orders: boolean
  revenue: boolean
  cancellations: boolean
}

/**
 * Default metric visibility - orders and revenue visible, cancellations hidden
 */
export const DEFAULT_METRIC_VISIBILITY: MetricVisibility = {
  orders: true,
  revenue: true,
  cancellations: false,
}

/**
 * Chart line colors for each metric
 */
export const CHART_LINE_COLORS = {
  orders: '#3B82F6', // Blue
  revenue: '#22C55E', // Green
  cancellations: '#EF4444', // Red
} as const

/**
 * Russian labels for chart metrics
 */
export const METRIC_LABELS = {
  orders: 'Заказы',
  revenue: 'Выручка',
  cancellations: 'Отмены',
} as const

/**
 * Get metric label in Russian
 */
export function getMetricLabel(metric: keyof typeof METRIC_LABELS): string {
  return METRIC_LABELS[metric]
}

// ============================================================================
// Chart Date Formatting
// ============================================================================

/**
 * Format date for X-axis display (DD.MM)
 *
 * @param dateStr - ISO date string or week string (YYYY-Www)
 * @returns Formatted date string
 *
 * @example
 * formatChartDate('2026-01-15') // '15.01'
 * formatChartDate('2026-W03') // 'W03'
 */
export function formatChartDate(dateStr: string): string {
  // Handle week format (YYYY-Www)
  if (dateStr.includes('-W')) {
    return dateStr.replace(/^\d{4}-/, '') // Remove year prefix, keep Www
  }

  // Handle ISO date format
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr

  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  return `${day}.${month}`
}

/**
 * Format date for tooltip display (DD.MM.YYYY)
 *
 * @param dateStr - ISO date string or week string
 * @returns Formatted date string
 *
 * @example
 * formatTooltipDate('2026-01-15') // '15.01.2026'
 * formatTooltipDate('2026-W03') // 'Неделя 03, 2026'
 */
export function formatTooltipDate(dateStr: string): string {
  // Handle week format (YYYY-Www)
  if (dateStr.includes('-W')) {
    const [year, week] = dateStr.split('-W')
    return `Неделя ${week}, ${year}`
  }

  // Handle ISO date format
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr

  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}.${month}.${year}`
}

/**
 * Format large numbers with Russian grouping (space separator)
 *
 * @param value - Number to format
 * @returns Formatted string
 *
 * @example
 * formatNumber(1234567) // '1 234 567'
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value))
}

/**
 * Format percentage for display
 *
 * @param value - Percentage value (0-100)
 * @returns Formatted percentage string
 *
 * @example
 * formatPercentValue(6.67) // '6,67%'
 */
export function formatPercentValue(value: number): string {
  return (
    new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value) + '%'
  )
}
