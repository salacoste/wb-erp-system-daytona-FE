/**
 * Seasonal Pattern Label Utilities
 * Story 51.6-FE: Seasonal Patterns Components
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Shared Russian labels for months, days, and quarters.
 */

// ============================================================================
// Full Russian Month Names
// ============================================================================

export const MONTH_FULL_LABELS: Record<string, string> = {
  January: 'Январь',
  February: 'Февраль',
  March: 'Март',
  April: 'Апрель',
  May: 'Май',
  June: 'Июнь',
  July: 'Июль',
  August: 'Август',
  September: 'Сентябрь',
  October: 'Октябрь',
  November: 'Ноябрь',
  December: 'Декабрь',
}

// ============================================================================
// Full Russian Day Names
// ============================================================================

export const DAY_FULL_LABELS: Record<string, string> = {
  Monday: 'Понедельник',
  Tuesday: 'Вторник',
  Wednesday: 'Среда',
  Thursday: 'Четверг',
  Friday: 'Пятница',
  Saturday: 'Суббота',
  Sunday: 'Воскресенье',
}

// ============================================================================
// Quarter Month Ranges
// ============================================================================

export const QUARTER_RANGES: Record<string, string> = {
  Q1: 'Янв - Мар',
  Q2: 'Апр - Июн',
  Q3: 'Июл - Сен',
  Q4: 'Окт - Дек',
}

// ============================================================================
// Translation Functions
// ============================================================================

/**
 * Translate English month name to full Russian
 */
export function translateMonth(month: string): string {
  return MONTH_FULL_LABELS[month] ?? month
}

/**
 * Translate English day name to full Russian
 */
export function translateDay(day: string): string {
  return DAY_FULL_LABELS[day] ?? day
}

/**
 * Get quarter month range string
 */
export function getQuarterRange(quarter: string): string {
  return QUARTER_RANGES[quarter] ?? ''
}

// ============================================================================
// Seasonality Color Utilities
// ============================================================================

/**
 * Get color class based on seasonality index
 * High (>=0.7) = red (strong fluctuations)
 * Medium (>=0.4) = yellow
 * Low (<0.4) = green (stable)
 */
export function getSeasonalityColor(index: number): string {
  if (index >= 0.7) return 'text-red-600'
  if (index >= 0.4) return 'text-yellow-600'
  return 'text-green-600'
}
