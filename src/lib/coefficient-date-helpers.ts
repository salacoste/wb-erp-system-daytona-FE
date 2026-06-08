/**
 * Coefficient date formatting helpers
 * Stories 44.9-FE, 44.26a-FE
 */

import { formatDate, formatDecimal } from '@/lib/utils'
import type { NormalizedCoefficient } from './coefficient-types'

/** Format coefficient for display (Russian comma decimal, e.g. "1,25") */
export function formatCoefficient(coefficient: number): string {
  return formatDecimal(coefficient, 2)
}

/** Format date for coefficient display (Russian locale) */
export function formatCoefficientDate(dateString: string): string {
  return formatDate(dateString)
}

/** Get day of month from date string */
export function getDayFromDate(dateString: string): number {
  return new Date(dateString).getDate()
}

/** Check if date is today */
export function isToday(dateString: string): boolean {
  const today = new Date().toISOString().split('T')[0]
  return dateString === today
}

/** Format date in long Russian format: "21 января 2026" - Story 44.26a-FE */
export function formatDateLongRu(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** Get tomorrow's date in ISO format - Story 44.26a-FE */
export function getTomorrowDate(): string {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
}

/** Get first available date from coefficients - Story 44.26a-FE */
export function getFirstAvailableDate(
  coefficients: NormalizedCoefficient[]
): NormalizedCoefficient | null {
  // Use isAvailable flag: coefficient=0 with isAvailable=true means FREE slot
  return coefficients.find(c => c.isAvailable) ?? null
}
