/**
 * DeltaIndicator — WoW comparison delta display for Returns Summary Cards.
 * Extracted from ReturnsSummaryCards.tsx for 200-line compliance.
 */

import { Skeleton } from '@/components/ui/skeleton'
import { formatDelta, getDeltaColor, isInvertedMetric } from './returns-comparison-utils'
import type { ReturnsDelta } from './returns-comparison-utils'

export function DeltaIndicator({
  delta,
  field,
  loading,
}: {
  delta: ReturnsDelta | null
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
