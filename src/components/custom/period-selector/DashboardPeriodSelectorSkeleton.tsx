/**
 * Dashboard Period Selector Skeleton Component
 * Story 60.2-FE: Period Selector Component
 *
 * Loading skeleton for the period selector.
 */

import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import type { PeriodType } from '@/contexts/dashboard-period-types'

interface DashboardPeriodSelectorSkeletonProps {
  periodType?: PeriodType
  selectedPeriod?: string
}

/**
 * Skeleton placeholder for loading state
 */
export function DashboardPeriodSelectorSkeleton({
  periodType = 'week',
  selectedPeriod,
}: DashboardPeriodSelectorSkeletonProps): React.ReactElement {
  return (
    <div
      data-testid="period-selector-skeleton"
      aria-busy="true"
      className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4"
    >
      <div className="min-w-0">
        <span className="block text-sm font-medium">
          {periodType === 'week' ? 'Неделя' : 'Месяц'}
        </span>
        {selectedPeriod && (
          <span className="block break-words text-sm text-muted-foreground">{selectedPeriod}</span>
        )}
      </div>
      <Skeleton aria-hidden="true" className="h-10 w-full md:w-80" />
      <span role="status" className="text-sm text-muted-foreground">
        Загрузка доступных периодов
      </span>
    </div>
  )
}

export default DashboardPeriodSelectorSkeleton
