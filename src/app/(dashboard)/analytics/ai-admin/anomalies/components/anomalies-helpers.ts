/**
 * Shared constants for anomaly resolution UI.
 * Story 112.3-FE — extracted to keep AnomaliesList.tsx under 200-line cap.
 */
import type { AnomalyStatus, ResolutionCause } from '@/types/ai/system'

/**
 * UI-only filter sentinel: 'all' indicates "no status filter applied"
 * (translated to omitted `status` param when calling backend).
 * Separate from `AnomalyStatus` (server-side enum) per Boundary Normalizer Pattern.
 * Server never echoes 'all' — see AnomalyListResponse.status in system.ts.
 */
export type AnomalyFilter = AnomalyStatus | 'all'

export const RESOLUTION_CAUSE_LABELS: Record<ResolutionCause, string> = {
  seasonal: 'Сезонный фактор',
  pricing_error: 'Ошибка ценообразования',
  quality_issue: 'Проблема качества товара',
  tariff_change: 'Изменение тарифов',
  category_reclassification: 'Реклассификация категории',
  other: 'Прочее',
}

export const RESOLUTION_CAUSES = Object.keys(RESOLUTION_CAUSE_LABELS) as ResolutionCause[]
