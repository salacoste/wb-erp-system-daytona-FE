/** Dashboard Metrics Grid — 20 P&L cards. Epic 66-FE: Tax + NetProfit + pre-tax labels. */

'use client'

import { cn } from '@/lib/utils'
import { DashboardMetricsGridSkeleton } from './DashboardMetricsGridSkeleton'
import { DashboardMetricsGridCards } from './DashboardMetricsGridCards'
import type { DashboardMetricsGridProps } from './DashboardMetricsGridTypes'

export type {
  DashboardMetricsGridProps,
  PreviousPeriodData,
  FinanceSummaryData,
} from './DashboardMetricsGridTypes'

const gridCls = cn(
  'grid gap-3 items-stretch [&>*]:h-full',
  'grid-cols-1',
  'sm:grid-cols-2',
  'lg:grid-cols-3',
  'xl:grid-cols-4'
)

export function DashboardMetricsGrid(props: DashboardMetricsGridProps): React.ReactElement {
  const { isLoading, className } = props

  if (isLoading) return <DashboardMetricsGridSkeleton cardCount={18} className={className} />

  return (
    <div className={cn(gridCls, className)} role="region" aria-label="Основные метрики P&L">
      <DashboardMetricsGridCards {...props} />
    </div>
  )
}
