/**
 * Return Reasons Pie Chart
 * Epic 70-FE: Visual breakdown of 3 return categories
 * Sub-components: ReturnReasonsChartParts (StackedBar, CategoryRow, DonutChart)
 */

'use client'

import { useReturnReasons } from '@/hooks/use-return-analytics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { StackedBar, CategoryRow, DonutChart } from './ReturnReasonsChartParts'

interface ReturnReasonsPieChartProps {
  from?: string
  to?: string
}

export function ReturnReasonsPieChart({ from, to }: ReturnReasonsPieChartProps) {
  const { data, isLoading, isError } = useReturnReasons(from, to)

  if (isLoading) return <Skeleton className="h-64 w-full" />

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Не удалось загрузить причины возвратов</AlertDescription>
      </Alert>
    )
  }

  const categories = data?.byCategory ?? []
  const total = data?.summary?.totalReturns ?? 0

  if (categories.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Нет данных о причинах возвратов</AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          Причины возвратов ({total.toLocaleString('ru-RU')})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-3">
            <StackedBar categories={categories} />
            <div className="space-y-2">
              {categories.map(cat => (
                <CategoryRow key={cat.category} item={cat} />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center">
            <DonutChart categories={categories} total={total} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
