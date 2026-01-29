/**
 * Dashboard Period Selector Skeleton Component
 * Story 60.2-FE: Period Selector Component
 *
 * Loading skeleton for the period selector.
 */

import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Skeleton placeholder for loading state
 */
export function DashboardPeriodSelectorSkeleton(): React.ReactElement {
  return (
    <div
      data-testid="period-selector-skeleton"
      className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4"
    >
      <Skeleton className="h-10 w-[160px]" />
      <Skeleton className="h-10 w-full md:w-[320px]" />
      <Skeleton className="h-10 w-[120px]" />
    </div>
  )
}

export default DashboardPeriodSelectorSkeleton
