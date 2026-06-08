/**
 * Dashboard Period localStorage & URL helpers.
 * Extracted from dashboard-period-state.ts for file size compliance.
 */

import type { PeriodType } from './dashboard-period-types'

/** localStorage key for persisting the selected period type */
export const PERIOD_STORAGE_KEY = 'dashboard-period-type'

/** URL search-param names used by the dashboard period state */
export const PERIOD_URL_PARAMS = { week: 'week', month: 'month', type: 'type' } as const

/** Read the persisted period type from localStorage. Returns null if unavailable. */
export function getStoredPeriodType(): PeriodType | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(PERIOD_STORAGE_KEY)
    if (stored === 'week' || stored === 'month') return stored
  } catch {
    /* ignore storage errors */
  }
  return null
}

/** Persist the period type to localStorage. */
export function setStoredPeriodType(type: PeriodType): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(PERIOD_STORAGE_KEY, type)
  } catch {
    /* ignore storage errors */
  }
}

/**
 * Build the dashboard period URL search params string.
 * Sets week or month param depending on period type, and always sets the type param.
 */
export function buildPeriodUrlParams(
  week: string,
  month: string,
  type: PeriodType,
  existingParams: string
): string {
  const params = new URLSearchParams(existingParams)
  if (type === 'week') {
    params.set(PERIOD_URL_PARAMS.week, week)
    params.delete(PERIOD_URL_PARAMS.month)
  } else {
    params.set(PERIOD_URL_PARAMS.month, month)
    params.delete(PERIOD_URL_PARAMS.week)
  }
  params.set(PERIOD_URL_PARAMS.type, type)
  return params.toString()
}
