/**
 * Date Range Utility Functions
 * Story 51.3-FE: Extended Date Range Picker Component
 * Epic 51: FBS Historical Analytics UI (365 Days)
 *
 * Provides utility functions for date range operations:
 * - Smart aggregation calculation
 * - Russian date formatting
 * - Russian pluralization
 * - Range validation
 * - Preset range generation
 *
 * @see docs/stories/epic-51/story-51.3-fe-extended-date-range-picker.md
 */

import { format, differenceInDays, subDays } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { AggregationLevel, DateRange } from '@/types/date-range'

// ============================================================================
// Aggregation Functions
// ============================================================================

/**
 * Get smart aggregation suggestion based on date range
 * - 1-90 days: daily (Ежедневно)
 * - 91-180 days: weekly (Еженедельно)
 * - 181-365 days: monthly (Ежемесячно)
 */
export function getSmartAggregation(days: number): AggregationLevel {
  if (days <= 90) return 'day'
  if (days <= 180) return 'week'
  return 'month'
}

/**
 * Get Russian label for aggregation level
 */
export function getAggregationLabel(level: AggregationLevel): string {
  const labels: Record<AggregationLevel, string> = {
    day: 'Ежедневно',
    week: 'Еженедельно',
    month: 'Ежемесячно',
  }
  return labels[level]
}

// ============================================================================
// Date Formatting Functions
// ============================================================================

/**
 * Format date in Russian locale (DD.MM.YYYY)
 * @example formatDateRu(new Date('2025-01-29')) -> "29.01.2025"
 */
export function formatDateRu(date: Date): string {
  return format(date, 'dd.MM.yyyy', { locale: ru })
}

/**
 * Format date range for display with em-dash separator
 * @example formatDateRangeRu(from, to) -> "01.01.2025 — 31.03.2025"
 */
export function formatDateRangeRu(from: Date, to: Date): string {
  return `${formatDateRu(from)} — ${formatDateRu(to)}`
}

// ============================================================================
// Pluralization Functions
// ============================================================================

/**
 * Pluralize "день" in Russian
 * Russian pluralization rules:
 * - 1, 21, 31... -> день (singular)
 * - 2, 3, 4, 22, 23, 24... -> дня (genitive singular)
 * - 5-20, 25-30, 0 -> дней (genitive plural)
 * - 11-19 always -> дней (special case for teens)
 */
export function pluralizeDays(count: number): string {
  const abs = Math.abs(count)
  const mod10 = abs % 10
  const mod100 = abs % 100

  // Special case: 11-19 always use дней
  if (mod100 >= 11 && mod100 <= 19) {
    return 'дней'
  }

  // Singular: 1, 21, 31, 41...
  if (mod10 === 1) {
    return 'день'
  }

  // Genitive singular: 2, 3, 4, 22, 23, 24...
  if (mod10 >= 2 && mod10 <= 4) {
    return 'дня'
  }

  // Genitive plural: 0, 5-9, 10-20, 25-30...
  return 'дней'
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate date range against max days limit
 * @param maxDays Maximum allowed days (default: 365)
 * @returns true if range is valid
 */
export function isRangeValid(from: Date, to: Date, maxDays: number = 365): boolean {
  // Check if dates are in correct order (from <= to)
  if (from > to) return false

  // Check if end date is not in the future
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  if (to > today) return false

  // Check if range is within max days
  const days = calculateDaysDiff(from, to)
  return days <= maxDays
}

// ============================================================================
// Calculation Functions
// ============================================================================

/**
 * Calculate number of days between two dates (inclusive)
 * @example calculateDaysDiff(Jan 1, Jan 3) -> 3
 */
export function calculateDaysDiff(from: Date, to: Date): number {
  return differenceInDays(to, from) + 1
}

/**
 * Get preset date range ending today
 * @param days Number of days for the preset
 * @returns DateRange with from and to dates
 */
export function getPresetRange(days: number): DateRange {
  const to = new Date()
  to.setHours(23, 59, 59, 999)
  const from = subDays(to, days - 1) // -1 because range is inclusive
  from.setHours(0, 0, 0, 0)
  return { from, to }
}
