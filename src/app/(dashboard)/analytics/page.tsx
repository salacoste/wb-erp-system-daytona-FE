'use client'

/**
 * Financial Summary View (Analytics Hub)
 * Story 3.5: Financial Summary View
 * Updated: 2025-12-13 - Improved navigation UX
 *
 * Features:
 * - Quick navigation to all analytics pages (top of page)
 * - Week selector with available weeks
 * - Complete financial summary (all metrics)
 * - Period comparison (two weeks side-by-side)
 * - Responsive design with accessibility
 *
 * UX Improvements (Sally - UX Expert):
 * - Navigation cards moved to top for immediate access
 * - Visual hierarchy: primary actions prominent
 * - Grouped by purpose: Financial / Operational / Strategic
 * - Hover states and visual feedback
 */

import { formatWeekDisplay } from '@/hooks/useFinancialSummary'
import { FinancialSummaryTable } from '@/components/custom/FinancialSummaryTable'
import { ExpenseChart } from '@/components/custom/ExpenseChart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, RefreshCw, GitCompare } from 'lucide-react'
import { RequireWbToken } from '@/components/custom/RequireWbToken'
import { NavigationSection, analyticsNavigation } from './components/AnalyticsNavigation'
import { AnalyticsWeekSelector } from './components/AnalyticsWeekSelector'
import { useAnalyticsPageState } from './components/useAnalyticsPageState'
import { SearchPerformanceWidget } from './components/SearchPerformanceWidget'

export default function AnalyticsSummaryPage() {
  const {
    viewMode,
    selectedWeek,
    selectedWeeks,
    comparisonWeek,
    setSelectedWeek,
    setSelectedWeeks,
    setComparisonWeek,
    isLoading,
    isError,
    error,
    primarySummary,
    secondarySummary,
    handleRetry,
    cycleViewMode,
  } = useAnalyticsPageState()

  return (
    <RequireWbToken>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Аналитика</h1>
            <p className="text-muted-foreground mt-1">
              {viewMode === 'multi' && selectedWeeks.length > 1
                ? `Агрегированные данные за ${selectedWeeks.length} ${selectedWeeks.length >= 2 && selectedWeeks.length <= 4 ? 'недели' : 'недель'}`
                : 'Выберите раздел аналитики или просмотрите финансовую сводку ниже'}
            </p>
          </div>
          <Button
            variant={viewMode !== 'single' ? 'default' : 'outline'}
            size="sm"
            onClick={cycleViewMode}
            className="gap-2"
          >
            <GitCompare className="h-4 w-4" />
            {viewMode === 'single' && 'Несколько периодов'}
            {viewMode === 'multi' && 'Сравнить периоды'}
            {viewMode === 'comparison' && 'Один период'}
          </Button>
        </div>

        {/* Quick Navigation - UX: Primary action area at top */}
        <Card className="border-none shadow-none bg-gray-50/50">
          <CardContent className="p-4">
            <div className="grid gap-6 lg:grid-cols-4">
              <NavigationSection {...analyticsNavigation.financial} />
              <NavigationSection {...analyticsNavigation.operational} />
              <NavigationSection {...analyticsNavigation.marketing} />
              <NavigationSection {...analyticsNavigation.strategic} />
            </div>
          </CardContent>
        </Card>

        {/* Story 120.3-FE: Search Performance mini-widget (marketing quick stats) */}
        {selectedWeek && <SearchPerformanceWidget from={selectedWeek} to={selectedWeek} />}

        {/* Divider with title */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-4 text-muted-foreground font-medium">
              Финансовая сводка за период
            </span>
          </div>
        </div>

        {/* Week Selector - different UI based on view mode */}
        <AnalyticsWeekSelector
          viewMode={viewMode}
          selectedWeek={selectedWeek}
          selectedWeeks={selectedWeeks}
          comparisonWeek={comparisonWeek}
          onSelectedWeekChange={setSelectedWeek}
          onSelectedWeeksChange={setSelectedWeeks}
          onComparisonWeekChange={setComparisonWeek}
        />

        {/* Error State */}
        {isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                {error instanceof Error
                  ? error.message
                  : 'Не удалось загрузить финансовые данные. Пожалуйста, попробуйте еще раз.'}
              </span>
              <Button variant="outline" size="sm" onClick={handleRetry} className="ml-4">
                <RefreshCw className="mr-2 h-4 w-4" />
                Повторить
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6">
            <Skeleton className="h-[600px] w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        )}

        {/* Content */}
        {!isLoading && !isError && primarySummary && (
          <>
            {/* Financial Summary Table */}
            <FinancialSummaryTable summary={primarySummary} comparisonSummary={secondarySummary} />

            {/* Expense Chart - only for single week mode */}
            {viewMode === 'single' && (
              <Card>
                <CardHeader>
                  <CardTitle>Разбивка расходов</CardTitle>
                  <CardDescription>
                    Визуализация структуры расходов за {formatWeekDisplay(selectedWeek)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ExpenseChart weekOverride={selectedWeek} />
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Empty State */}
        {!isLoading && !isError && !primarySummary && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Нет данных для отображения. Пожалуйста, загрузите финансовые отчеты или выберите
              другой период.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </RequireWbToken>
  )
}
