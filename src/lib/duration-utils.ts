/**
 * Duration Formatting Utilities
 * Story 40.5-FE: History Timeline Components
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Utility functions for formatting durations in Russian with proper pluralization.
 *
 * @see docs/stories/epic-40/story-40.5-fe-history-timeline-components.md
 */

/**
 * Russian pluralization for "день" (day)
 * Rules: 1, 21, 31 -> "день"; 2-4, 22-24 -> "дня"; 5-20, 25-30 -> "дней"; 11-14 -> "дней"
 */
export function pluralizeDays(n: number): string {
  const absN = Math.abs(n)
  const lastDigit = absN % 10
  const lastTwoDigits = absN % 100

  // 11-14 always use "дней"
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return 'дней'
  }

  if (lastDigit === 1) return 'день'
  if (lastDigit >= 2 && lastDigit <= 4) return 'дня'
  return 'дней'
}

/**
 * Calculate duration in minutes between two dates
 */
export function calculateDurationMinutes(from: Date | string, to: Date | string): number {
  const fromDate = typeof from === 'string' ? new Date(from) : from
  const toDate = typeof to === 'string' ? new Date(to) : to
  const diffMs = toDate.getTime() - fromDate.getTime()
  return Math.round(diffMs / 60000)
}

/**
 * Format duration in minutes to human-readable Russian format
 *
 * Rules from specification:
 * - null/undefined -> "—" (em-dash)
 * - < 1 minute -> "< 1 мин"
 * - 1-59 minutes -> "{n} мин"
 * - 1-23 hours -> "{h} ч {m} мин" (omit minutes if 0)
 * - 1-6 days -> "{d} д {h} ч" (omit hours if 0)
 * - 7+ days -> "{d} дней" (with proper Russian pluralization)
 *
 * @param minutes - Duration in minutes (null/undefined returns em-dash)
 * @returns Human-readable Russian duration string
 */
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return '—'
  if (!Number.isFinite(minutes)) return '—'
  if (minutes < 1) return '< 1 мин'

  const totalMinutes = Math.round(minutes)
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const mins = totalMinutes % 60

  // 7+ days: just show days with pluralization
  if (days >= 7) {
    return `${days} ${pluralizeDays(days)}`
  }

  // 1-6 days: show days and hours
  if (days >= 1) {
    return hours > 0 ? `${days} д ${hours} ч` : `${days} д`
  }

  // 1-23 hours: show hours and minutes
  if (hours >= 1) {
    return mins > 0 ? `${hours} ч ${mins} мин` : `${hours} ч`
  }

  // < 1 hour: show minutes only
  return `${mins} мин`
}

/**
 * Format duration in compact mode (shorter labels)
 * Used for dense UI displays
 */
export function formatDurationCompact(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return '—'
  if (!Number.isFinite(minutes)) return '—'
  if (minutes < 1) return '<1м'

  const totalMinutes = Math.round(minutes)
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const mins = totalMinutes % 60

  if (days >= 7) return `${days}д`
  if (days >= 1) return hours > 0 ? `${days}д${hours}ч` : `${days}д`
  if (hours >= 1) return mins > 0 ? `${hours}ч${mins}м` : `${hours}ч`
  return `${mins}м`
}
