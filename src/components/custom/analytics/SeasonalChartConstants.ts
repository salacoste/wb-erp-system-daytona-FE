/**
 * SeasonalChart Constants & Label Helpers
 * Extracted from SeasonalChartStates.tsx for file-size compliance (Epic 134-FE)
 */

import type { SeasonalViewType } from '@/types/fbs-analytics'

// ============================================================================
// Constants (shared with SeasonalPatternsChart)
// ============================================================================

export const CHART_TITLE = 'Сезонность заказов'
export const DEFAULT_HEIGHT = 350

/** Russian month name mapping */
export const MONTH_LABELS: Record<string, string> = {
  January: 'Янв',
  February: 'Фев',
  March: 'Мар',
  April: 'Апр',
  May: 'Май',
  June: 'Июн',
  July: 'Июл',
  August: 'Авг',
  September: 'Сен',
  October: 'Окт',
  November: 'Ноя',
  December: 'Дек',
}

/** Russian day name mapping */
export const DAY_LABELS: Record<string, string> = {
  Monday: 'Пн',
  Tuesday: 'Вт',
  Wednesday: 'Ср',
  Thursday: 'Чт',
  Friday: 'Пт',
  Saturday: 'Сб',
  Sunday: 'Вс',
}

/** Quarter labels */
export const QUARTER_LABELS: Record<string, string> = {
  Q1: '1 квартал',
  Q2: '2 квартал',
  Q3: '3 квартал',
  Q4: '4 квартал',
}

/** Bar colors */
export const BAR_COLOR_DEFAULT = '#3B82F6'
export const BAR_COLOR_PEAK = '#22C55E'
export const BAR_COLOR_LOW = '#EF4444'

/** Tab configuration */
export const TAB_CONFIG: { value: SeasonalViewType; label: string }[] = [
  { value: 'monthly', label: 'Месяцы' },
  { value: 'weekly', label: 'Дни недели' },
  { value: 'quarterly', label: 'Кварталы' },
]

/** Week day order for sorting */
export const WEEK_ORDER = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

// ============================================================================
// Helper Functions
// ============================================================================

export function getMonthLabel(month: string): string {
  return MONTH_LABELS[month] ?? month
}

export function getDayLabel(day: string): string {
  return DAY_LABELS[day] ?? day
}

export function getQuarterLabel(quarter: string): string {
  return QUARTER_LABELS[quarter] ?? quarter
}
