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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { DashboardPeriodProvider, useDashboardPeriod } from '@/hooks/useDashboardPeriod'
import {
  getDashboardMonthCoverage,
  getDashboardMonthSummaryWeeks,
} from './dashboard-period-coverage'
import { CabinetDashboardSkeleton } from '@/components/custom/dashboard/CabinetDashboardSkeleton'
import { useDelayedLoadingState } from '@/hooks/useDelayedLoadingState'

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

  const monthSummaryWeeks = useMemo(() => {
    if (periodType !== 'month') return null
    return getDashboardMonthSummaryWeeks(selectedMonth, availableWeeks)
  }, [periodType, selectedMonth, availableWeeks])

  // Convert selected period → weekStart/weekEnd for the API
  const { weekStart, weekEnd } = useMemo(() => {
    if (periodType === 'week') {
      return { weekStart: selectedWeek, weekEnd: selectedWeek }
    }
    const weeks = monthSummaryWeeks?.weeks ?? []
    if (weeks.length === 0) {
      return { weekStart: selectedWeek, weekEnd: selectedWeek }
    }
    return { weekStart: weeks[0], weekEnd: weeks[weeks.length - 1] }
  }, [periodType, selectedWeek, monthSummaryWeeks])

  const monthCoverage = useMemo(() => {
    if (periodType !== 'month' || monthSummaryWeeks?.source !== 'available') return null
    return getDashboardMonthCoverage(selectedMonth, weekStart, weekEnd)
  }, [periodType, selectedMonth, weekStart, weekEnd, monthSummaryWeeks])

  const { data, isLoading, isError, error, refetch } = useCabinetSummary(
    { weekStart, weekEnd },
    { enabled: isFinanceAvailable }
  )
  const showSkeleton = isLoading && !data
  const showSlowLoading = useDelayedLoadingState(showSkeleton)

  // When finance not available, show banners instead of error
  if (!isFinanceAvailable) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Сводка по кабинету
            </h1>
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Сводка по кабинету</h1>
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Сводка по кабинету</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ключевые показатели эффективности и топ-товары
          </p>
        </div>
        <DashboardPeriodSelector />
      </div>

      {/* Month Coverage Notice */}
      {monthCoverage && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Месячная сводка построена по завершённым WB-неделям {monthCoverage.weekListLabel}:
            включены даты {monthCoverage.coveredRangeLabel}. Календарный месяц:{' '}
            {monthCoverage.calendarRangeLabel}.
            {monthCoverage.hasCalendarGap
              ? ' Часть календарных дней вне этих недель не включена.'
              : ''}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {showSkeleton && !showSlowLoading && <CabinetDashboardSkeleton />}

      {showSkeleton && showSlowLoading && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between gap-4">
              <span>
                Сводка по кабинету загружается дольше обычного. Можно подождать или повторить
                запрос.
              </span>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => void refetch()}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Повторить
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

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
