/**
 * Expense Chart Skeleton Component
 * Story 63.9-FE: Expense Structure Pie Chart
 * Epic 63-FE: Dashboard Main Page Enhancement
 *
 * Loading skeleton for expense pie chart.
 * @see docs/stories/epic-63/story-63.9-fe-expense-structure-chart.md
 */

'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Skeleton loading state for expense structure chart
 */
export function ExpenseChartSkeleton() {
  return (
    <Card aria-busy="true">
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-56 mt-1" />
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        {/* Circular skeleton for donut chart */}
        <Skeleton className="h-[280px] w-[280px] rounded-full" />
        {/* Legend skeleton */}
        <div className="flex gap-4 mt-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-20" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
