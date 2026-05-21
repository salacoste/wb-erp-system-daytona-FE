/**
 * Pure helpers for AdminModelsList — extracted for file-size compliance + testability.
 * Story 112.1-FE.
 */

import { formatPercentage } from '@/lib/utils'
import type { AiModel } from '@/types/ai/models'

export type SortCol = 'version' | 'mape' | 'createdAt'
export type SortDir = 'asc' | 'desc'

export const STATUS_LABELS: Record<string, string> = {
  active: 'Активна',
  training: 'Обучение',
  degraded: 'Деградация',
  retired: 'Архив',
  // F-5: 'Откачена' (from откатить = "roll back") — not 'Откатана' (from откатать = "roll out").
  // Must match RollbackDialog success toast text.
  rolled_back: 'Откачена',
  failed: 'Ошибка',
}

export const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> =
  {
    active: 'default',
    training: 'secondary',
    degraded: 'destructive',
    retired: 'outline',
    rolled_back: 'outline',
    failed: 'destructive',
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
