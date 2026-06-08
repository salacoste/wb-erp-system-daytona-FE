/** Russian-locale formatters (ru-RU: comma decimal, NBSP, space thousands). Extracted from utils.ts. */
import { getISOWeek, getISOWeekYear } from 'date-fns'

/** Formats a number as Russian Ruble currency (e.g., "1 234 567,89 ₽") */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * COGS unit-cost formatter — 2 fixed decimal places, null/NaN/undefined → "—".
 * Consolidates 5 former duplicates (cogs-edit-helpers, useCogsHistoryDisplay,
 * CogsHistoryMeta, sku-table-formatters, financial-summary-formatters).
 * COGS is a per-unit cost so 2 decimal places are always shown (e.g. "1 250,50 ₽").
 */
export function formatCogsCost(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Formats a number as percentage in Russian locale (e.g. "15,5 %").
 * @param value - Already in percent units (0-100; signed OK)
 * @param decimals - Fixed decimal places. Omit for 1-2 decimals. Pass 0 for "75 %".
 */
export function formatPercentage(value: number, decimals?: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'percent',
    minimumFractionDigits: decimals ?? 1,
    maximumFractionDigits: decimals ?? 2,
  }).format(value / 100)
}

/** Whole-percent variant ("75 %"). Use instead of `${value.toFixed(0)}%` (dot-locale). */
export function formatPercentageInt(value: number): string {
  return formatPercentage(value, 0)
}

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
 * Formats a number as ROAS (Return on Ad Spend)
 * @param value - The numeric ROAS value
 * @returns Formatted ROAS string (e.g., "2,5x")
 */
export function formatRoas(value: number): string {
  return `${value.toFixed(1).replace('.', ',')}x`
}

/**
 * Formats a percentage-points (п.п.) delta with an explicit sign for gains.
 * Used for margin/gross-margin period-over-period comparisons (a difference of two
 * percentages is in п.п., NOT %). Russian locale: comma decimal ("+1,5 п.п.", not "+1.5 п.п.").
 * Not %-suffixed, so the dot-locale-percent ratchet doesn't catch it — guarded by unit test.
 * Extracted from MarginCard/GrossMarginCard (were byte-identical duplicates) to remove drift risk.
 * @param diff - Difference in percentage points
 * @returns Formatted string (e.g., "+1,5 п.п.", "-2,0 п.п.", "0,0 п.п.")
 */
export function formatPercentagePoints(diff: number): string {
  const sign = diff > 0 ? '+' : ''
  return `${sign}${diff.toFixed(1).replace('.', ',')} п.п.`
}

/**
 * Formats a number with Russian grouping (space separator), rounded to integer.
 * Use for counts and quantities. NOT for opaque IDs (use String(id) instead).
 * @param value - The numeric value to format
 * @returns Formatted string (e.g., "1 234 567")
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value))
}

/**
 * Formats a FRACTIONAL number with Russian locale (comma decimal), fixed decimal places.
 * For bare unitless decimals (rates, velocities, multipliers) — NOT percents (use formatPercentage)
 * or currency (formatCurrency). No NBSP unless thousands-grouping applies. Replaces ad-hoc
 * `value.toFixed(n)` (dot-locale) and `.toFixed(n).replace('.', ',')` patterns.
 * Rounding is Intl halfExpand (e.g. 1.45 → "1,5"), unlike toFixed's FP half-to-even.
 * @param value - The numeric value to format
 * @param decimals - Exact number of fraction digits (default 1)
 * @returns Formatted string (e.g., "12,5"; whole numbers keep the trailing zero → "2,0";
 *   values ≥1000 get NBSP thousands-grouping → "1 234,5")
 */
export function formatDecimal(value: number, decimals = 1): string {
  return value.toLocaleString('ru-RU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
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
