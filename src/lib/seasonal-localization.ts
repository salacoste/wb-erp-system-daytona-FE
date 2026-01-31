/**
 * Seasonal Patterns Localization
 * Story 63.8-FE: Orders Seasonal Patterns Analysis
 * Epic 63 - Dashboard Enhancements (Orders Analytics)
 *
 * Russian localization for month and weekday names.
 * Helper functions for formatting hours and pattern colors.
 *
 * @see docs/stories/epic-63/story-63.8-fe-orders-seasonal-patterns.md
 */

// =============================================================================
// Month Names
// =============================================================================

/** Full month names in Russian (nominative case) */
export const MONTH_NAMES_RU: Record<string, string> = {
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

/** Short month names in Russian for chart axes */
export const MONTH_SHORT_RU: Record<string, string> = {
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

// =============================================================================
// Weekday Names
// =============================================================================

/** Full weekday names in Russian */
export const WEEKDAY_NAMES_RU: Record<string, string> = {
  Monday: 'Понедельник',
  Tuesday: 'Вторник',
  Wednesday: 'Среда',
  Thursday: 'Четверг',
  Friday: 'Пятница',
  Saturday: 'Суббота',
  Sunday: 'Воскресенье',
}

/** Short weekday names in Russian for chart axes */
export const WEEKDAY_SHORT_RU: Record<string, string> = {
  Monday: 'Пн',
  Tuesday: 'Вт',
  Wednesday: 'Ср',
  Thursday: 'Чт',
  Friday: 'Пт',
  Saturday: 'Сб',
  Sunday: 'Вс',
}

// =============================================================================
// Localization Functions
// =============================================================================

/**
 * Convert English month name to Russian
 * @param month - English month name (e.g., "January")
 * @returns Russian month name or original if not found
 */
export function localizeMonth(month: string): string {
  return MONTH_NAMES_RU[month] ?? month
}

/**
 * Get short Russian month name for chart axis
 * @param month - English month name
 * @returns Short Russian month name (e.g., "Янв")
 */
export function localizeMonthShort(month: string): string {
  return MONTH_SHORT_RU[month] ?? month.slice(0, 3)
}

/**
 * Convert English weekday name to Russian
 * @param day - English day name (e.g., "Monday")
 * @returns Russian day name or original if not found
 */
export function localizeWeekday(day: string): string {
  return WEEKDAY_NAMES_RU[day] ?? day
}

/**
 * Get short Russian weekday name for chart axis
 * @param day - English day name
 * @returns Short Russian day name (e.g., "Пн")
 */
export function localizeWeekdayShort(day: string): string {
  return WEEKDAY_SHORT_RU[day] ?? day.slice(0, 2)
}

/**
 * Format hour number to 24-hour time string
 * @param hour - Hour number (0-23)
 * @returns Formatted time string (e.g., "14:00", "09:00")
 */
export function formatPeakHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`
}

// =============================================================================
// Color Configuration
// =============================================================================

/** Color configuration for seasonal pattern charts */
export const SEASONAL_COLORS = {
  /** Bar chart colors */
  bar: {
    default: '#3B82F6', // Blue - default bars
    peak: '#22C55E', // Green - peak highlight
    low: '#EF4444', // Red - low highlight
  },
  /** Heatmap gradient colors (light to dark) */
  heatmap: {
    low: '#E0F2FE', // Light blue
    medium: '#38BDF8', // Medium blue
    high: '#0284C7', // Dark blue
    peak: '#075985', // Darkest blue
  },
} as const

/**
 * Get bar color based on peak/low status
 * @param value - Current value name (month or day)
 * @param peakValue - Peak value name
 * @param lowValue - Low value name (optional)
 * @returns Hex color string
 */
export function getBarColor(value: string, peakValue: string, lowValue?: string): string {
  if (value === peakValue) return SEASONAL_COLORS.bar.peak
  if (lowValue && value === lowValue) return SEASONAL_COLORS.bar.low
  return SEASONAL_COLORS.bar.default
}

/**
 * Get heatmap cell color based on intensity ratio
 * @param value - Current value
 * @param maxValue - Maximum value in dataset
 * @returns Hex color string
 */
export function getHeatmapColor(value: number, maxValue: number): string {
  if (maxValue === 0) return SEASONAL_COLORS.heatmap.low
  const ratio = value / maxValue
  if (ratio >= 0.9) return SEASONAL_COLORS.heatmap.peak
  if (ratio >= 0.6) return SEASONAL_COLORS.heatmap.high
  if (ratio >= 0.3) return SEASONAL_COLORS.heatmap.medium
  return SEASONAL_COLORS.heatmap.low
}
