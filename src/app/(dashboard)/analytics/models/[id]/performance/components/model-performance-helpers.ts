/**
 * Pure helper functions for ModelPerformanceDetail.
 * Extracted per proactive-extraction discipline (Story 99.2-FE) — testable without React render.
 * Story 109.5-FE. Migrated Story 171.9-FE: drift badges + MAPE-delta valence → semantic
 * status tokens (hue-preserving, 171.6 canon; light-only palette eliminated, dark-mode fixed);
 * route-local status-badge map detaches this route from the shared registry overlay field.
 */

import { formatPercentage } from '@/lib/utils'
import type { DriftStatus, ModelStatus } from '@/types/ai/models'

/** Drift badge config — colour + Russian label per AC-4. Exported for direct unit testing. */
export const DRIFT_BADGE_CONFIG: Record<
  NonNullable<DriftStatus>,
  { className: string; label: string }
> = {
  improving: {
    className: 'border-status-success/40 bg-status-success/10 text-status-success',
    label: 'Улучшается',
  },
  stable: {
    className: 'border-status-information/40 bg-status-information/10 text-status-information',
    label: 'Стабильно',
  },
  degrading: {
    className: 'border-status-error/40 bg-status-error/10 text-status-error',
    label: 'Деградирует',
  },
}

/** Config for the null drift case (insufficient history). */
export const DRIFT_NULL_CONFIG = {
  className: 'border-border bg-muted text-muted-foreground',
  label: 'Недостаточно данных',
}

/**
 * Route-local status badge overlay for the model-identity row (Story 171.9-FE).
 * Hue-preserving mirror of the registry badge tokens (171.6 semantic canon) —
 * detaches this route from the shared config's className field (the field itself
 * still has the registry-root consumer; its removal is a registry-owner carry-out).
 * Labels stay sourced from STATUS_BADGE_CONFIG (single label source of truth).
 */
export const PERFORMANCE_STATUS_BADGE_CLASS: Record<ModelStatus, string> = {
  active: 'border-status-success/40 bg-status-success/10 text-status-success',
  training: 'border-status-information/40 bg-status-information/10 text-status-information',
  degraded: 'border-status-warning/40 bg-status-warning/10 text-status-warning',
  retired: 'border-border bg-muted text-muted-foreground',
  rolled_back: 'border-border bg-muted text-muted-foreground',
  failed: 'border-status-error/40 bg-status-error/10 text-status-error',
  deprecated: 'border-border bg-muted text-muted-foreground',
}

/**
 * Map delta sign to semantic status text colour class (valence, 171.4 canon).
 * delta < 0 → success (MAPE decreased = improvement).
 * delta > 0 → error (MAPE increased = regression).
 * delta === 0 → neutral.
 * Exported for direct unit testing (pure-function discipline, Story 99.2-FE).
 */
export function getMapeDeltaColor(
  delta: number
): 'text-status-success' | 'text-status-error' | 'text-muted-foreground' {
  if (delta < 0) return 'text-status-success'
  if (delta > 0) return 'text-status-error'
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
  // formatPercentage renders Russian comma+NBSP locale (e.g. "4,0 %"); the '+' prefix
  // is added only for strictly-positive deltas (Intl already adds '-' for negatives).
  return (delta > 0 ? '+' : '') + formatPercentage(delta)
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
