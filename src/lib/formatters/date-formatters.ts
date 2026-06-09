/**
 * Date/time formatters (Russian locale, Europe/Moscow timezone)
 * Extracted from formatters.ts — barrel re-exported from formatters.ts for backward compat.
 */

import { getISOWeek, getISOWeekYear } from 'date-fns'

/**
 * Formats a date as DD.MM.YYYY. Returns '—' for invalid input.
 * Defensive guard (Story 96.11-FE): prevents "NaN.NaN.NaN" on bad input.
 */
export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (isNaN(dateObj.getTime())) return '—'
  const day = dateObj.getDate().toString().padStart(2, '0')
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0')
  const year = dateObj.getFullYear()
  return `${day}.${month}.${year}`
}

/**
 * Formats a date+time in Europe/Moscow (the project's canonical business timezone) as
 * "DD.MM.YYYY, HH:mm". Use for DISPLAYED timestamps (created_at, updated_at, event times) so a
 * non-Moscow viewer sees Moscow wall-clock, not their browser-local tz (project rule: all times
 * are Europe/Moscow). Returns '—' for invalid input. (formatDate is date-only; this adds time.)
 * @param date - Date string (UTC ISO) or Date object
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (date == null) return '—'
  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (isNaN(dateObj.getTime())) return '—'
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj)
}

/**
 * Formats a date as ISO week (YYYY-Www)
 * @param date - Date string or Date object
 * @returns Formatted ISO week string (e.g., "2025-W03"), or '—' for invalid input
 */
export function formatIsoWeek(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  // Defensive guard mirroring formatDate (above): bad input previously yielded "NaN-WNaN"
  // (getISOWeek/getISOWeekYear return NaN on an Invalid Date). Indicate, don't emit garbage.
  if (isNaN(dateObj.getTime())) return '—'
  // iter-86: use the ISO-week-YEAR (NOT the calendar getFullYear()) paired with the ISO week
  // number — both from date-fns so they share one basis. The old code hard-coded getFullYear(),
  // so at year boundaries it emitted the wrong year + a nonexistent week (2024-12-30 → "2024-W01"
  // instead of ISO "2025-W01"), silently corrupting getLastCompletedWeek → COGS → margin once/year.
  const year = getISOWeekYear(dateObj)
  const weekNo = getISOWeek(dateObj)
  return `${year}-W${weekNo.toString().padStart(2, '0')}`
}

/**
 * Story 4.9: Formats weeks since last sale with proper Russian pluralization
 * @param weeks - Number of weeks since last sale
 * @returns Formatted string (e.g., "1 неделю назад", "3 недели назад", "5 недель назад")
 * Reference: docs/stories/4.9.historical-margin-discovery.md#pluralization-weeks_ago
 */
export function formatWeeksAgo(weeks: number | null | undefined): string {
  if (weeks === null || weeks === undefined) return ''
  if (weeks === 0) return 'на этой неделе'
  if (weeks > 52) return 'более года назад'

  // Russian pluralization rules:
  // 1 → "неделю"
  // 2-4 → "недели"
  // 5-20 → "недель"
  // 21 → "неделю", 22-24 → "недели", 25-30 → "недель", etc.
  const lastDigit = weeks % 10
  const lastTwoDigits = weeks % 100

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return `${weeks} недель назад`
  }
  if (lastDigit === 1) {
    return `${weeks} неделю назад`
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${weeks} недели назад`
  }
  return `${weeks} недель назад`
}

/**
 * Story 4.9: Shorthand format for weeks ago (e.g., "3 нед. назад")
 * @param weeks - Number of weeks since last sale
 * @returns Shortened format string
 */
export function formatWeeksAgoShort(weeks: number | null | undefined): string {
  if (weeks === null || weeks === undefined) return ''
  if (weeks === 0) return 'на этой нед.'
  if (weeks > 52) return '>1 года'

  return `${weeks} нед. назад`
}
