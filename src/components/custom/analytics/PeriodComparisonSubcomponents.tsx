/**
 * Period Comparison Sub-components
 * Story 51.7-FE: Period Comparison UI
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Sub-components for PeriodComparisonTable: DeltaCell and TableSkeleton.
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { getDeltaColor, getDeltaBgColor, formatDeltaPctWithSign } from './period-comparison-helpers'

/** Props for DeltaCell */
export interface DeltaCellProps {
  delta: number
  deltaPct: number
  formatDelta: (v: number) => string
  inverse: boolean
}

/** Delta cell component with icon and colors */
export function DeltaCell({ delta, deltaPct, formatDelta, inverse }: DeltaCellProps) {
  const colorClass = getDeltaColor(delta, inverse)
  const bgClass = getDeltaBgColor(delta, inverse)

  const Icon =
    delta === 0
      ? Minus
      : inverse
        ? delta < 0
          ? TrendingUp
          : TrendingDown
        : delta > 0
          ? TrendingUp
          : TrendingDown

  return (
    <div className={cn('flex items-center justify-center gap-2 px-2 py-1 rounded', bgClass)}>
      <Icon className={cn('h-4 w-4', colorClass)} />
      <span className={cn('font-medium text-sm', colorClass)}>{formatDelta(delta)}</span>
      <span className={cn('text-xs', colorClass)}>({formatDeltaPctWithSign(deltaPct)})</span>
    </div>
  )
}

/** Loading skeleton for comparison table */
export function ComparisonTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[180px]">Метрика</TableHead>
          <TableHead className="text-right">Период 1</TableHead>
          <TableHead className="text-right">Период 2</TableHead>
          <TableHead className="text-center">Изменение</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 4 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell>
              <Skeleton className="h-5 w-24" />
            </TableCell>
            <TableCell className="text-right">
              <Skeleton className="h-5 w-20 ml-auto" />
            </TableCell>
            <TableCell className="text-right">
              <Skeleton className="h-5 w-20 ml-auto" />
            </TableCell>
            <TableCell className="text-center">
              <Skeleton className="h-5 w-32 mx-auto" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
