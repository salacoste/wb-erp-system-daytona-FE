'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

export interface MetricCardProps {
  title: string
  value: number | undefined
  isLoading?: boolean
  error?: string | null
  className?: string
}

/**
 * Metric card component for displaying key metrics
 * Story 3.2: Key Metric Cards Display
 */
export function MetricCard({
  title,
  value,
  isLoading = false,
  error = null,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn('bg-white', className)}>
      <CardHeader>
        <CardTitle className="text-base font-medium text-gray-600">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-sm text-destructive">{error}</div>
        ) : isLoading ? (
          <Skeleton className="h-12 w-32" />
        ) : value !== undefined ? (
          <div className="text-4xl font-bold text-blue-600">
            {formatCurrency(value)}
          </div>
        ) : (
          <div className="text-2xl font-semibold text-gray-400">
            Нет данных
          </div>
        )}
      </CardContent>
    </Card>
  )
}

