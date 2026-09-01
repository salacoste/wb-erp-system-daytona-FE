/**
 * Pure helper functions for ModelListSection.
 * Extracted per proactive-extraction discipline (Story 99.2-FE) — testable without React render.
 * Story 109.3-FE. Migrated Story 171.6-FE: palette badge classes → semantic status tokens.
 */

import type { ModelEngine, ModelStatus } from '@/types/ai/models'
import { formatDate, formatPercentage } from '@/lib/utils'

/** Capitalised engine display names per backend integration guide convention. */
export const ENGINE_LABELS: Record<ModelEngine, string> = {
  mindsdb: 'MindsDB',
  prophet: 'Prophet',
}

/**
 * Status badge configuration — Russian label + pulse flag (registry-owned).
 * Exported for direct unit testing (pure-function discipline, Epic 89-FE lesson).
 * WCAG 2.1 AA: text label is the accessible name; colour is supplementary (Epic 108-FE retro § C-3).
 *
 * Story 171.6-FE: raw light-only palette classes replaced with semantic status
 * tokens — hue mapping preserved 1:1 (green→success, blue→information,
 * amber→warning, red→error, gray→muted).
 * Story 174.2-FE: the `className` field was REMOVED from this registry config
 * (all [id]/ subroutes detached via route-local maps in Stories 171.7/171.9);
 * colour overlays now live exclusively in route-local maps —
 * MODEL_LIST_BADGE_CLASS below (registry root) and the [id] subroute maps.
 * Labels remain the single source of truth here.
 */
export const STATUS_BADGE_CONFIG: Record<ModelStatus, { label: string; pulse: boolean }> = {
  active: {
    label: 'Активна',
    pulse: false,
  },
  training: {
    label: 'Обучается',
    pulse: true,
  },
  degraded: {
    label: 'Деградировала',
    pulse: false,
  },
  retired: {
    label: 'Снята',
    pulse: false,
  },
  // F-10: statuses added to ModelStatus union — provide badge config for public model list.
  rolled_back: {
    label: 'Откачена',
    pulse: false,
  },
  failed: {
    label: 'Ошибка',
    pulse: false,
  },
  // F-39: 'deprecated' is returned live by GET /v1/ai/models — without an entry the
  // Record lookup was undefined → crash. Grey "Устарела" badge.
  deprecated: {
    label: 'Устарела',
    pulse: false,
  },
}

/**
 * Registry-root status badge overlay for ModelListSection (Story 174.2-FE).
 * Hue-preserving mirror of the 171.6 semantic canon — green→success,
 * blue→information, amber→warning, red→error, gray→muted. Same shape as the
 * [id] subroute maps (EVALUATION_STATUS_BADGE_CLASS / PERFORMANCE_STATUS_BADGE_CLASS);
 * labels stay sourced from STATUS_BADGE_CONFIG (single label source of truth).
 */
export const MODEL_LIST_BADGE_CLASS: Record<ModelStatus, string> = {
  active: 'border-status-success bg-status-success text-status-success-foreground',
  training: 'border-status-information bg-status-information text-status-information-foreground',
  degraded: 'border-status-warning bg-status-warning text-status-warning-foreground',
  retired: 'border-border bg-muted text-foreground',
  rolled_back: 'border-border bg-muted text-foreground',
  failed: 'border-status-error bg-status-error text-status-error-foreground',
  deprecated: 'border-border bg-muted text-foreground',
}

/**
 * Format MAPE value for display.
 * Backend sends 0-100 magnitude (e.g. 12 = 12% MAPE); formatPercentage divides by 100.
 * Anti-Pattern #8 compliance: null → '—', never '0%'.
 * Source: docs/AI-FRONTEND-INTEGRATION-GUIDE.md ("MAPE degraded from 12% to 45%").
 *
 * 0-guard field-semantics (do NOT generalise to the evaluations page):
 *   - model-level `metrics.mape` → 0 is the #185 train-time un-evaluated SENTINEL
 *     (a real 0.0% MAPE is statistically implausible), so guard 0 → '—' here.
 *   - shadow-eval cabinetMape / per-eval MAPE → 0 is a real measurement, so those
 *     renders guard null only (see EvaluationsHeaderCard / ModelPerformanceDetail).
 */
export function formatMape(mape: number | null): string {
  // F-39: backend hardcodes mape:0 as a placeholder for un-evaluated models (see #185).
  // A real 0.0% MAPE is statistically impossible, so 0 means "not evaluated" → '—'
  // (rendering "0,0 %" would imply a perfect model). Treat 0 like null.
  if (mape === null || mape === 0) return '—'
  // 0-100 magnitude → formatPercentage (Russian comma+NBSP "12,4 %"); not dot-locale.
  return formatPercentage(mape)
}

/**
 * Format trainedAt date for display.
 * undefined (never trained) → '—'.
 */
export function formatTrainedAt(trainedAt: string | undefined): string {
  if (trainedAt === undefined) return '—'
  return formatDate(trainedAt)
}
