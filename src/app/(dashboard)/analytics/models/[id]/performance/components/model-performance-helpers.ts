/**
 * Pure helper functions for ModelPerformanceDetail.
 * Extracted per proactive-extraction discipline (Story 99.2-FE) — testable without React render.
 * Story 109.5-FE.
 */

import type { DriftStatus } from '@/types/ai/models'

/** Drift badge config — colour + Russian label per AC-4. Exported for direct unit testing. */
export const DRIFT_BADGE_CONFIG: Record<
  NonNullable<DriftStatus>,
  { className: string; label: string }
> = {
  improving: {
    className: 'bg-green-100 text-green-800 border-green-200',
    label: 'Улучшается',
  },
  stable: {
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    label: 'Стабильно',
  },
  degrading: {
    className: 'bg-red-100 text-red-800 border-red-200',
    label: 'Деградирует',
  },
}

/** Config for the null drift case (insufficient history). */
export const DRIFT_NULL_CONFIG = {
  className: 'bg-gray-100 text-gray-600 border-gray-200',
  label: 'Недостаточно данных',
}

/**
 * Map delta sign to Tailwind text colour class.
 * delta < 0 → green (MAPE decreased = improvement).
 * delta > 0 → red (MAPE increased = regression).
 * delta === 0 → neutral.
 * Exported for direct unit testing (pure-function discipline, Story 99.2-FE).
 */
export function getMapeDeltaColor(
  delta: number
): 'text-green-600' | 'text-red-600' | 'text-muted-foreground' {
  if (delta < 0) return 'text-green-600'
  if (delta > 0) return 'text-red-600'
  return 'text-muted-foreground'
}

/**
 * Returns the MAPE delta string for display, or null when either input is
 * null. Null returned (not '—' or '0%') so the caller can defer rendering
 * decisions — AP#8 Defensive Frontend: never coerce missing data to zero.
 * Exported for direct unit testing (pure-function discipline, Story 99.2-FE).
 */
export function formatMapeDelta(prev: number | null, current: number | null): string | null {
  if (prev === null || current === null) return null
  const delta = current - prev
  const sign = delta > 0 ? '+' : ''
  return `${sign}${delta.toFixed(1)}%`
}

/**
 * Format a MAPE numeric tick value for the Y-axis: rounds and appends '%'.
 * Extracted as top-level helper for direct unit testing (F-13, Story 109.5-FE).
 */
export function formatMapeTick(v: number): string {
  return `${Math.round(v)}%`
}

/**
 * Extract the most recent cabinetMape from the mapeTrend array.
 * Sorts by evaluationDate DESC defensively — backend claims pre-sorted but FE
 * must not silently break on contract drift (Defensive Frontend Principle).
 * Returns null when array is empty or most-recent entry has null cabinetMape (AP#8).
 * Exported for direct unit testing.
 */
export function getCurrentMape(
  mapeTrend: Array<{ evaluationDate: string; cabinetMape: number | null }>
): number | null {
  if (mapeTrend.length === 0) return null
  const sorted = [...mapeTrend].sort((a, b) => b.evaluationDate.localeCompare(a.evaluationDate))
  return sorted[0].cabinetMape
}

/**
 * Returns mapeTrend entries sorted DESC by evaluationDate (most recent first).
 * Extracted post-2nd-pass to keep ModelPerformanceDetail under the 200-line cap.
 */
export function sortMapeTrendDesc<T extends { evaluationDate: string }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => b.evaluationDate.localeCompare(a.evaluationDate))
}
