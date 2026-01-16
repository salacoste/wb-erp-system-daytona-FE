/**
 * Cabinet Summary Dashboard Page
 * Story 6.4-FE: Cabinet Summary Dashboard
 *
 * Features:
 * - Cabinet-level KPI cards with trend indicators
 * - Period selector (4, 8, 12, 13 weeks)
 * - Top 10 products by revenue
 * - Top 5 brands by revenue
 * - Navigation to detailed analytics
 */

'use client'

import { useState } from 'react'
import { useCabinetSummary } from '@/hooks/useCabinetSummary'
import { TopProductsTable } from '@/components/custom/TopProductsTable'
import { TopBrandsTable } from '@/components/custom/TopBrandsTable'
import { PnLWaterfall } from '@/components/custom/PnLWaterfall'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, RefreshCw } from 'lucide-react'

/**
 * Period options for dashboard
 */
const PERIOD_OPTIONS = [
  { value: '4', label: 'Последние 4 недели' },
  { value: '8', label: 'Последние 8 недель' },
  { value: '12', label: 'Последние 12 недель' },
  { value: '13', label: 'Последний квартал (13 недель)' },
] as const

/**
 * Format period label for display
 */
function formatPeriodInfo(
  period: { start: string; end: string; weeks_count: number } | undefined
): string {
  if (!period) return ''

  const startWeek = period.start.replace(/^\d{4}-W/, 'W')
  const endWeek = period.end.replace(/^\d{4}-W/, 'W')

  return `${startWeek} — ${endWeek} (${period.weeks_count} нед.)`
}

/**
 * Cabinet Summary Dashboard Page
 */
export default function CabinetDashboardPage() {
  // Story 6.4-FE: Period selector state (default: 4 weeks)
  const [weeks, setWeeks] = useState(4)

  // Fetch cabinet summary data
  const { data, isLoading, isError, error, refetch } = useCabinetSummary({ weeks })

  // Handle period change
  const handlePeriodChange = (value: string) => {
    setWeeks(parseInt(value, 10))
  }

  // Error state
  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Сводка по кабинету
          </h1>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>
                {error instanceof Error ? error.message : 'Ошибка загрузки данных'}
              </span>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Повторить
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Period Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Сводка по кабинету
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ключевые показатели эффективности и топ-товары
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period info */}
          {data?.meta?.period && (
            <span className="text-sm text-muted-foreground hidden md:inline">
              {formatPeriodInfo(data.meta.period)}
            </span>
          )}

          {/* Period Selector */}
          <Select value={String(weeks)} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Выберите период" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-6">
          {/* KPI Cards Skeleton */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-20" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tables Skeleton */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Content */}
      {!isLoading && data && (
        <>
          {/* P&L Waterfall - Complete Financial Overview */}
          {/* Story 28: Unified P&L Report with CFO-oriented metrics
              Replaces: Expenses Section, COGS/Profit Section, Operating Profit Section,
              Products Stats Card, and Additional Metrics - all consolidated into one component */}
          <PnLWaterfall
            data={data.summary.totals}
            products={data.summary.products}
          />

          {/* Top Products and Brands Tables - Story 6.4-FE AC3, AC4 */}
          <div className="grid gap-6 lg:grid-cols-2">
            <TopProductsTable products={data.top_products} />
            <TopBrandsTable brands={data.top_brands} />
          </div>
        </>
      )}

      {/* Empty State */}
      {!isLoading && !data && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Нет данных для отображения. Загрузите финансовые отчеты для получения
            аналитики.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
