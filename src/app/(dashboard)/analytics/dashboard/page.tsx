// Cabinet Summary Dashboard Page (Story 6.4-FE)
'use client'

import { Suspense, useMemo } from 'react'
import { useCabinetSummary } from '@/hooks/useCabinetSummary'
import { useAvailableWeeks } from '@/hooks/useFinancialSummary'
import { useDataAvailability } from '@/hooks/useDataAvailability'
import { TopProductsTable } from '@/components/custom/TopProductsTable'
import { TopBrandsTable } from '@/components/custom/TopBrandsTable'
import { PnLWaterfall } from '@/components/custom/PnLWaterfall'
import { DashboardPeriodSelector } from '@/components/custom/DashboardPeriodSelector'
import { IncompleteWeekBanner } from '@/components/custom/dashboard'
import { ReportPendingBanner } from '@/app/(dashboard)/dashboard/components/ReportPendingBanner'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { DashboardPeriodProvider, useDashboardPeriod } from '@/hooks/useDashboardPeriod'
import { getWeeksInMonth } from '@/lib/period-helpers'

export default function CabinetDashboardPage() {
  return (
    <Suspense fallback={<CabinetDashboardSkeleton />}>
      <DashboardPeriodProvider>
        <CabinetDashboardContent />
      </DashboardPeriodProvider>
    </Suspense>
  )
}

function CabinetDashboardContent() {
  const { periodType, selectedWeek, selectedMonth } = useDashboardPeriod()
  const selectedPeriod = periodType === 'week' ? selectedWeek : selectedMonth

  // Finance availability check — P&L waterfall requires finance data
  const { data: availableWeeks } = useAvailableWeeks()
  const { isFinanceAvailable, latestAvailableWeek } = useDataAvailability(
    periodType,
    selectedWeek,
    selectedMonth,
    availableWeeks
  )

  // Convert selected period → weekStart/weekEnd for the API
  const { weekStart, weekEnd } = useMemo(() => {
    if (periodType === 'week') {
      return { weekStart: selectedWeek, weekEnd: selectedWeek }
    }
    const weeks = getWeeksInMonth(selectedMonth)
    if (weeks.length === 0) {
      return { weekStart: selectedWeek, weekEnd: selectedWeek }
    }
    return { weekStart: weeks[0], weekEnd: weeks[weeks.length - 1] }
  }, [periodType, selectedWeek, selectedMonth])

  const { data, isLoading, isError, error, refetch } = useCabinetSummary(
    { weekStart, weekEnd },
    { enabled: isFinanceAvailable }
  )

  // When finance not available, show banners instead of error
  if (!isFinanceAvailable) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Сводка по кабинету</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Ключевые показатели эффективности и топ-товары
            </p>
          </div>
          <DashboardPeriodSelector />
        </div>
        <IncompleteWeekBanner period={selectedPeriod} periodType={periodType} />
        <ReportPendingBanner week={selectedWeek} latestAvailableWeek={latestAvailableWeek} />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Сводка по кабинету</h1>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>{error instanceof Error ? error.message : 'Ошибка загрузки данных'}</span>
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
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Сводка по кабинету</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ключевые показатели эффективности и топ-товары
          </p>
        </div>
        <DashboardPeriodSelector />
      </div>

      {/* Loading State */}
      {isLoading && <CabinetDashboardSkeleton />}

      {/* Content */}
      {!isLoading && data && (
        <>
          {/* P&L Waterfall - Complete Financial Overview (Story 28) */}
          <PnLWaterfall data={data.summary.totals} products={data.summary.products} />

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
            Нет данных для отображения. Загрузите финансовые отчеты для получения аналитики.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

function CabinetDashboardSkeleton() {
  return (
    <div className="space-y-6">
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
  )
}
