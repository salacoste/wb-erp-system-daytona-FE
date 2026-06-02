import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx and tailwind-merge for conditional class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number as Russian Ruble currency
 * @param value - The numeric value to format
 * @returns Formatted currency string (e.g., "1 234 567,89 ₽")
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Formats a number as percentage in Russian locale (comma decimal + NBSP, e.g. "15,5 %").
 * @param value - The numeric value to format (already in percent units, 0-100; signed OK)
 * @param decimals - Optional FIXED decimal places. Omit for the default 1-2 decimals
 *   (minimumFractionDigits:1, maximumFractionDigits:2). Pass 0 for whole percents ("75 %").
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals?: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'percent',
    minimumFractionDigits: decimals ?? 1,
    maximumFractionDigits: decimals ?? 2,
  }).format(value / 100)
}

/**
 * Whole-percent Russian-locale variant (no decimals → "75 %", half-up rounding so 33.27→"33 %",
 * 33.7→"34 %"), for coverage/CTR/share displays that intentionally show integer percents.
 * Use instead of `${value.toFixed(0)}%` (dot-locale).
 * iter-67: the zero-decimal helper the locale-percent consolidation needs (see
 * docs/process/dot-locale-percent-consolidation-proposal.md).
 */
export function formatPercentageInt(value: number): string {
  return formatPercentage(value, 0)
}

/**
 * Formats a date as DD.MM.YYYY
 * @param date - Date string or Date object
 * @returns Formatted date string (e.g., "20.01.2025"), or '—' for invalid input
 *
 * Defensive guard (Story 96.11-FE 2nd-pass M2-2): invalid date strings (empty
 * string, malformed ISO, etc.) previously produced "NaN.NaN.NaN". Guard added
 * so all callers benefit — not just the FBS regions consumer.
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
 * Formats a date as ISO week (YYYY-Www)
 * @param date - Date string or Date object
 * @returns Formatted ISO week string (e.g., "2025-W03")
 */
export function formatIsoWeek(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const year = dateObj.getFullYear()

  // Calculate ISO week number
  const d = new Date(Date.UTC(year, dateObj.getMonth(), dateObj.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)

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
 * Cookie management utilities for authentication
 * Middleware runs on server and cannot access localStorage, so we use cookies
 */

/**
 * Set authentication token cookie
 * @param token - JWT token string
 * @param expiresInHours - Expiration time in hours (default: 24)
 */
export function setAuthCookie(token: string, expiresInHours = 24): void {
  if (typeof document === 'undefined') return

  const expires = new Date()
  expires.setTime(expires.getTime() + expiresInHours * 60 * 60 * 1000)
  document.cookie = `auth-token=${token}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
}

/**
 * Remove authentication token cookie
 */
export function removeAuthCookie(): void {
  if (typeof document === 'undefined') return

  document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax'
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
