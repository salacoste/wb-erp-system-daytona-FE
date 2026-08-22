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
  error = false,
}: {
  delta: ReturnType<typeof calculateFunnelDelta> | null
  field: string
  loading: boolean
  error?: boolean
}) {
  if (loading) return <Skeleton className="h-4 w-16 mt-0.5" />

  if (error) return <p className="text-xs text-muted-foreground">Сравнение недоступно</p>

  if (!delta) {
    return <p className="text-xs text-muted-foreground">Нет данных</p>
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
