/**
 * Legacy Period Presets (Date-Based)
 * Story 51.7-FE: Period Comparison UI
 *
 * Legacy date-range format functions for backward compatibility.
 */

import type { PeriodRange, ComparisonPreset } from './types'

/** Format date range for display in Russian */
export function formatDateRangeRu(from: string, to: string): string {
  const fromDate = new Date(from)
  const toDate = new Date(to)
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }

  return `${fromDate.toLocaleDateString('ru-RU', options)} – ${toDate.toLocaleDateString('ru-RU', options)}`
}

/** Convert Date to YYYY-MM-DD string */
const toDateStr = (d: Date): string => d.toISOString().split('T')[0]

/** Calculate preset periods from current date */
export function calculatePresetPeriods(preset: ComparisonPreset): {
  period1: PeriodRange
  period2: PeriodRange
} {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()

  switch (preset) {
    case 'mom':
      return {
        period1: {
          from: toDateStr(new Date(year, month - 1, 1)),
          to: toDateStr(new Date(year, month, 0)),
        },
        period2: {
          from: toDateStr(new Date(year, month, 1)),
          to: toDateStr(new Date(year, month + 1, 0)),
        },
      }
    case 'qoq': {
      const q = Math.floor(month / 3)
      return {
        period1: {
          from: toDateStr(new Date(year, (q - 1) * 3, 1)),
          to: toDateStr(new Date(year, q * 3, 0)),
        },
        period2: {
          from: toDateStr(new Date(year, q * 3, 1)),
          to: toDateStr(new Date(year, (q + 1) * 3, 0)),
        },
      }
    }
    case 'yoy':
      return {
        period1: {
          from: toDateStr(new Date(year - 1, month, 1)),
          to: toDateStr(new Date(year - 1, month + 1, 0)),
        },
        period2: {
          from: toDateStr(new Date(year, month, 1)),
          to: toDateStr(new Date(year, month + 1, 0)),
        },
      }
    default: {
      const d30 = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
      const d60 = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000)
      return {
        period1: { from: toDateStr(d60), to: toDateStr(d30) },
        period2: { from: toDateStr(d30), to: toDateStr(today) },
      }
    }
  }
}
