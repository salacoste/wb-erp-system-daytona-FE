/**
 * Pure helper functions for ModelListSection.
 * Extracted per proactive-extraction discipline (Story 99.2-FE) — testable without React render.
 * Story 109.3-FE.
 */

import type { ModelEngine, ModelStatus } from '@/types/ai/models'
import { formatDate, formatPercentage } from '@/lib/utils'

/** Capitalised engine display names per backend integration guide convention. */
export const ENGINE_LABELS: Record<ModelEngine, string> = {
  mindsdb: 'MindsDB',
  prophet: 'Prophet',
}

/**
 * Status badge configuration — colour + Russian label.
 * Exported for direct unit testing (pure-function discipline, Epic 89-FE lesson).
 * WCAG 2.1 AA: text label is the accessible name; colour is supplementary (Epic 108-FE retro § C-3).
 */
export const STATUS_BADGE_CONFIG: Record<
  ModelStatus,
  { className: string; label: string; pulse: boolean }
> = {
  active: {
    className: 'border-transparent bg-green-100 text-green-800',
    label: 'Активна',
    pulse: false,
  },
  training: {
    className: 'border-transparent bg-blue-100 text-blue-800',
    label: 'Обучается',
    pulse: true,
  },
  degraded: {
    className: 'border-transparent bg-amber-100 text-amber-800',
    label: 'Деградировала',
    pulse: false,
  },
  retired: {
    className: 'border-transparent bg-gray-100 text-gray-600',
    label: 'Снята',
    pulse: false,
  },
  // F-10: statuses added to ModelStatus union — provide badge config for public model list.
  rolled_back: {
    className: 'border-transparent bg-gray-100 text-gray-600',
    label: 'Откачена',
    pulse: false,
  },
  failed: {
    className: 'border-transparent bg-red-100 text-red-800',
    label: 'Ошибка',
    pulse: false,
  },
  // F-39: 'deprecated' is returned live by GET /v1/ai/models — without an entry the
  // Record lookup was undefined → crash. Grey "Устарела" badge.
  deprecated: {
    className: 'border-transparent bg-gray-100 text-gray-600',
    label: 'Устарела',
    pulse: false,
  },
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
