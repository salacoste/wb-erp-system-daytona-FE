/**
 * FunnelDeltaIndicator — extracted from FunnelSummaryCards.tsx
 * Story 73.3-FE: WoW comparison delta display for funnel summary cards.
 */

import { Skeleton } from '@/components/ui/skeleton'
import {
  calculateFunnelDelta,
  formatDelta,
  getDeltaColor,
  isInvertedMetric,
} from './funnel-comparison-utils'

export function DeltaIndicator({
  delta,
  field,
  loading,
}: {
  delta: ReturnType<typeof calculateFunnelDelta> | null
  field: string
  loading: boolean
}) {
  if (loading) return <Skeleton className="h-4 w-16 mt-0.5" />

  if (!delta) {
    return (
      <p className="text-xs text-muted-foreground" title="Нет данных за предыдущий период">
        —
      </p>
    )
  }

  if (delta.direction === 'neutral') {
    return (
      <p className="text-xs text-muted-foreground" title="По сравнению с предыдущим периодом">
        {formatDelta(delta)}
      </p>
    )
  }

  const inverted = isInvertedMetric(field)
  return (
    <p
      className={`text-xs ${getDeltaColor(delta.direction, inverted)}`}
      title="По сравнению с предыдущим периодом"
    >
      {formatDelta(delta)}
    </p>
  )
}
