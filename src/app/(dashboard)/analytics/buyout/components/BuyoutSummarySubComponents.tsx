/**
 * Buyout Summary sub-components — extracted for 200-line limit
 * Story 127.4-FE: DeltaTag added, ReturnBreakdownBar moved from BuyoutSummaryWidget
 */

import { Skeleton } from '@/components/ui/skeleton'
import { formatPercentageInt } from '@/lib/utils'
import type { ReturnBreakdown } from '@/types/fulfillment'
import {
  calculateBuyoutDelta,
  formatDelta,
  getDeltaColor,
  isInvertedMetric,
} from './buyout-comparison-utils'

/** Inline delta indicator — Story 127.4-FE */
export function DeltaTag({
  delta,
  field,
  loading,
}: {
  delta: ReturnType<typeof calculateBuyoutDelta>
  field: string
  loading: boolean
}) {
  if (loading) return <Skeleton className="inline-block h-3 w-12 ml-1.5 align-middle" />
  if (!delta) return null
  const inverted = isInvertedMetric(field)
  return (
    <span className={`ml-1.5 text-xs ${getDeltaColor(delta.direction, inverted)}`}>
      {formatDelta(delta)}
    </span>
  )
}

// Epic 169.4: categorical status triplet (information/warning/error) — mirrors table headers
// and ReasonCell (buyout-table-columns) to keep the 3 return-reason states visually distinct.
const REASON_COLORS = [
  {
    key: 'cancelBeforeShipment',
    label: 'До отправки',
    bg: 'bg-status-information',
    text: 'text-status-information',
  },
  {
    key: 'refusalAtPvz',
    label: 'Отказ на ПВЗ',
    bg: 'bg-status-warning',
    text: 'text-status-warning',
  },
  {
    key: 'returnAfterReceipt',
    label: 'После получения',
    bg: 'bg-status-error',
    text: 'text-status-error',
  },
] as const

export function ReturnBreakdownBar({ breakdown }: { breakdown: ReturnBreakdown }) {
  const total = breakdown.total
  const segments = REASON_COLORS.map(c => ({
    ...c,
    count: breakdown[c.key],
    pct: total > 0 ? (breakdown[c.key] / total) * 100 : 0,
  }))

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Причины возвратов (FBS)</p>
      <div className="h-2.5 rounded-full bg-muted overflow-hidden flex">
        {segments.map(s =>
          s.pct > 0 ? (
            <div key={s.key} className={`h-full ${s.bg}`} style={{ width: `${s.pct}%` }} />
          ) : null
        )}
      </div>
      <div className="flex gap-4 text-xs">
        {segments.map(s => (
          <span key={s.key} className={s.text}>
            {s.label}: {s.count}
          </span>
        ))}
      </div>
      {breakdown.classificationCoverage < 100 && (
        <p className="text-xs text-muted-foreground">
          Покрытие классификации: {formatPercentageInt(breakdown.classificationCoverage)}
        </p>
      )}
    </div>
  )
}
