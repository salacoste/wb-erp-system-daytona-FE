/** Funnel table WoW delta cell — extracted from funnel-table-columns.tsx for 200-line limit */

'use client'

import { TableCell } from '@/components/ui/table'
import { calculateFunnelDelta } from './funnel-comparison-utils'
import { DeltaIndicator } from './FunnelDeltaIndicator'

/** Delta cell for a single metric column (compare mode only). */
export function DeltaCell({
  current,
  previous,
  field,
  loading,
}: {
  current: number
  previous: number | undefined
  field: string
  loading: boolean
}) {
  const delta = previous !== undefined ? calculateFunnelDelta(current, previous) : null
  return (
    <TableCell className="text-xs">
      <DeltaIndicator delta={delta} field={field} loading={loading} />
    </TableCell>
  )
}
