/**
 * Pure helpers for AdminModelsList — extracted for file-size compliance + testability.
 * Story 112.1-FE.
 */

import { formatPercentage } from '@/lib/utils'
import { MODEL_TYPE_LABELS } from '@/types/ai/forecast'
import type { AiModel } from '@/types/ai/models'

export type SortCol = 'version' | 'mape' | 'createdAt'
export type SortDir = 'asc' | 'desc'

/**
 * Russian labels for the model types the admin endpoint returns (Validation F-40).
 * The admin table lists models of ALL types (anomaly_detection, return_prediction, …),
 * which is a wider set than the forecast-page ModelType union — so this is a dedicated,
 * string-keyed map (NOT the forecast ModelType union, to avoid polluting the forecast
 * model-type selector). Unknown types fall back to the raw value via getModelTypeLabel.
 */
export const ADMIN_MODEL_TYPE_LABELS: Record<string, string> = {
  // Shared forecast types reuse the canonical labels (single source of truth — so the
  // same model shows the SAME Russian label on the public /analytics/models page and here).
  ...MODEL_TYPE_LABELS,
  // Admin-only types (not in the forecast ModelType union / public selector):
  sales_forecast_daily: 'Прогноз продаж (день)',
  return_prediction: 'Прогноз возвратов',
  return_prediction_daily: 'Прогноз возвратов (день)',
  anomaly_detection: 'Детекция аномалий',
  anomaly_detection_daily: 'Детекция аномалий (день)',
}

/** Localized model-type label; falls back to the raw backend value for unknown types. */
export function getModelTypeLabel(modelType: string): string {
  return ADMIN_MODEL_TYPE_LABELS[modelType] ?? modelType
}

export const STATUS_LABELS: Record<string, string> = {
  active: 'Активна',
  training: 'Обучение',
  degraded: 'Деградация',
  retired: 'Архив',
  // F-5: 'Откачена' (from откатить = "roll back") — not 'Откатана' (from откатать = "roll out").
  // Must match RollbackDialog success toast text.
  rolled_back: 'Откачена',
  failed: 'Ошибка',
  // F-39: 'deprecated' is returned live by /v1/ai/models — label it like the public table.
  deprecated: 'Устарела',
}

export const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> =
  {
    active: 'default',
    training: 'secondary',
    degraded: 'destructive',
    retired: 'outline',
    rolled_back: 'outline',
    failed: 'destructive',
    deprecated: 'outline',
  }

export const STATUS_OPTIONS = [
  { value: 'all', label: 'Все статусы' },
  { value: 'active', label: 'Активна' },
  // F-4: added degraded + retired (all 6 statuses must appear per AC-5)
  { value: 'degraded', label: 'Деградация' },
  { value: 'training', label: 'Обучение' },
  // F-5: matches STATUS_LABELS correction (откатить verb stem)
  { value: 'rolled_back', label: 'Откачена' },
  { value: 'failed', label: 'Ошибка' },
  { value: 'retired', label: 'Архив' },
]

/** AP#8: null MAPE → '—'; formatPercentage when non-null. */
export function formatMapeDisplay(mape: number | null): string {
  if (mape == null) return '—'
  return formatPercentage(mape)
}

/** Client-side sort for the models table. */
export function sortModels(models: AiModel[], col: SortCol, dir: SortDir): AiModel[] {
  return [...models].sort((a, b) => {
    let cmp = 0
    if (col === 'version') {
      cmp = a.version - b.version
    } else if (col === 'mape') {
      const ma = a.metrics.mape ?? -Infinity
      const mb = b.metrics.mape ?? -Infinity
      cmp = ma - mb
    } else {
      const da = a.trainedAt ?? ''
      const db = b.trainedAt ?? ''
      cmp = da.localeCompare(db)
    }
    return dir === 'asc' ? cmp : -cmp
  })
}
