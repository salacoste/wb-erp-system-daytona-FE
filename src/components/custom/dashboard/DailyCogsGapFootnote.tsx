/**
 * DailyCogsGapFootnote — Story 88.2-FE
 *
 * Disclosure footnote shown when one or more days in the daily breakdown have
 * unknown COGS (salesCogs or ordersCogs is null). Theoretical profit for those
 * days is computed without cost subtraction and should not be read as P&L.
 *
 * Same pattern as Story 87.3-FE `SummaryFooter` for SKU-level COGS disclosure.
 */

import type { DailyMetrics } from '@/types/daily-metrics'

interface DailyCogsGapFootnoteProps {
  data: DailyMetrics[]
}

export function DailyCogsGapFootnote({ data }: DailyCogsGapFootnoteProps) {
  // Gate on activity: a day with zero sales AND zero orders is not a data gap, it's a non-event.
  // Matches the `console.warn` gate in src/lib/daily/aggregation.ts.
  // Uses `== null` (not `===`) to catch both null and undefined defensively.
  const daysMissingCogs = data.filter(d => {
    const hasActivity = d.sales > 0 || d.orders > 0
    const missingCogs = d.salesCogs == null || d.ordersCogs == null
    return hasActivity && missingCogs
  }).length

  if (daysMissingCogs === 0) return null

  return (
    <p className="mt-2 text-xs text-amber-700">
      * COGS неизвестна для {daysMissingCogs} дн. — теоретическая прибыль за эти дни рассчитана без
      учёта себестоимости.
    </p>
  )
}
