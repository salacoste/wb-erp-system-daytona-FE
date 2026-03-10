/**
 * AdvertisingEmptyState helpers - period range generation
 * Extracted from AdvertisingEmptyState.tsx for file size compliance
 */

import { subDays, format, min, max } from 'date-fns'

/** Date range with ISO date strings */
export interface DateRange {
  /** Start date in YYYY-MM-DD format */
  from: string
  /** End date in YYYY-MM-DD format */
  to: string
}

/** Predefined period option */
export type PeriodOption = '7d' | '14d' | '30d'

export interface PeriodOptionConfig {
  value: PeriodOption
  label: string
  days: number
}

/** Predefined period options (sorted by duration) */
export const PERIOD_OPTIONS: PeriodOptionConfig[] = [
  { value: '7d', label: 'Последние 7 дней', days: 7 },
  { value: '14d', label: 'Последние 14 дней', days: 14 },
  { value: '30d', label: 'Последние 30 дней', days: 30 },
]

/**
 * Generate predefined date ranges that fit within available range.
 * Filters out ranges that would extend beyond available data.
 */
export function getPredefinedRanges(
  availableRange?: DateRange
): Array<PeriodOptionConfig & { dateRange: DateRange }> {
  if (!availableRange) {
    return []
  }

  const today = new Date()
  const yesterday = subDays(today, 1)
  const availableFrom = new Date(availableRange.from)
  const availableTo = new Date(availableRange.to)

  return PERIOD_OPTIONS.map(option => {
    const to = yesterday
    const from = subDays(to, option.days)

    const clampedFrom = max([from, availableFrom])
    const clampedTo = min([to, availableTo])

    return {
      ...option,
      dateRange: {
        from: format(clampedFrom, 'yyyy-MM-dd'),
        to: format(clampedTo, 'yyyy-MM-dd'),
      },
    }
  }).filter(option => {
    const rangeStart = new Date(option.dateRange.from)
    const rangeEnd = new Date(option.dateRange.to)
    const daysInRange = Math.ceil(
      (rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)
    )
    return daysInRange >= 3
  })
}

/** Get period label in Russian */
export function getPeriodLabel(period: PeriodOption): string {
  switch (period) {
    case '7d':
      return '7 дней'
    case '14d':
      return '14 дней'
    case '30d':
      return '30 дней'
  }
}
