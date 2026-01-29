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
