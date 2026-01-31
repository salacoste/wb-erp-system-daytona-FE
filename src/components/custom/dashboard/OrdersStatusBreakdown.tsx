'use client'

/** Orders Status Breakdown - Story 63.7-FE: Bar/pie chart toggle with click-to-filter */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart3, PieChart, AlertCircle, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { useOrdersStatusBreakdown } from '@/hooks/useOrdersStatusBreakdown'
import { useDashboardPeriod } from '@/hooks/useDashboardPeriod'
import type { OrderStatus } from '@/lib/orders-status-config'
import { StatusPieChart } from './StatusPieChart'
import { StatusStackedBar } from './StatusStackedBar'
import { StatusLegend } from './StatusLegend'

export interface OrdersStatusBreakdownProps {
  /** Additional CSS classes */
  className?: string
  /** Chart height */
  height?: number
}

type ChartView = 'bar' | 'pie'

/** Orders status breakdown widget with chart toggle */
export function OrdersStatusBreakdown({ className, height = 200 }: OrdersStatusBreakdownProps) {
  const router = useRouter()
  const [view, setView] = useState<ChartView>('bar')
  const { periodType, selectedWeek, selectedMonth } = useDashboardPeriod()

  const period = periodType === 'week' ? selectedWeek : selectedMonth
  const { data, isLoading, error, refetch } = useOrdersStatusBreakdown({
    periodType,
    period,
  })

  const handleStatusClick = (status: OrderStatus) => {
    router.push(`/orders?status=${status}`)
  }

  if (isLoading) {
    return (
      <Card className={cn('min-h-[280px]', className)}>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[180px] w-full rounded-lg" />
          <div className="mt-4 grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn('min-h-[280px]', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Распределение заказов по статусам</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Ошибка загрузки данных</span>
              <Button variant="ghost" size="sm" onClick={() => refetch()}>
                <RefreshCw className="mr-1 h-3 w-3" />
                Повторить
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.total === 0) {
    return (
      <Card className={cn('min-h-[280px]', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Распределение заказов по статусам</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-sm text-muted-foreground">Нет заказов за выбранный период</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('min-h-[280px]', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Распределение заказов по статусам</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Всего: {data.total.toLocaleString('ru-RU')} заказов
            </span>
            <div className="inline-flex rounded-md border border-gray-200" role="radiogroup">
              <ViewToggleButton
                active={view === 'bar'}
                onClick={() => setView('bar')}
                label="График"
                icon={<BarChart3 className="h-4 w-4" />}
              />
              <ViewToggleButton
                active={view === 'pie'}
                onClick={() => setView('pie')}
                label="Круговая"
                icon={<PieChart className="h-4 w-4" />}
                isLast
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          role="img"
          aria-label={`Распределение ${data.total} заказов по статусам`}
          className="mb-4"
        >
          {view === 'bar' ? (
            <StatusStackedBar
              data={data.items}
              height={height / 3}
              onSegmentClick={handleStatusClick}
            />
          ) : (
            <StatusPieChart
              data={data.items}
              total={data.total}
              height={height}
              onSegmentClick={handleStatusClick}
            />
          )}
        </div>
        <StatusLegend
          items={data.items}
          onStatusClick={handleStatusClick}
          direction={view === 'bar' ? 'horizontal' : 'vertical'}
        />
      </CardContent>
    </Card>
  )
}

interface ViewToggleButtonProps {
  active: boolean
  onClick: () => void
  label: string
  icon: React.ReactNode
  isLast?: boolean
}

function ViewToggleButton({ active, onClick, label, icon, isLast }: ViewToggleButtonProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 text-xs font-medium transition-colors',
        isLast ? 'rounded-r-md' : 'rounded-l-md',
        !isLast && '-mr-px',
        active ? 'bg-[#E53935] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
      )}
    >
      {icon}
      <span className="sr-only md:not-sr-only">{label}</span>
    </button>
  )
}
