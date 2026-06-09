/**
 * Brand margin analysis page content (client component)
 * Extracted from page.tsx for file-size compliance (Epic 134-FE)
 */

'use client'

import { useMarginAnalyticsByBrand, useCabinetLevelExpenses } from '@/hooks/useMarginAnalytics'
import { MarginByBrandTable } from '@/components/custom/MarginByBrandTable'
import { formatPeriodLabel } from '@/components/custom/DateRangePicker'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Info, AlertCircle, CalendarRange, GitCompare, Download } from 'lucide-react'
import { ExportDialog } from '@/components/custom/ExportDialog'
import { useMarginPageState } from '@/app/(dashboard)/analytics/shared/useMarginPageState'
import { StorageComparisonCard } from '@/app/(dashboard)/analytics/shared/StorageComparisonCard'
import { MarginFilterSection } from '@/app/(dashboard)/analytics/shared/MarginFilterSection'
import { MarginSummaryCards } from '@/app/(dashboard)/analytics/shared/MarginSummaryCards'
import { calculateMarginStats } from '@/app/(dashboard)/analytics/shared/calculate-margin-stats'
import { BrandHelpSection } from './BrandHelpSection'

/**
 * Margin Analysis by Brand Page
 * Story 4.6: Margin Analysis by Brand & Category
 * Story 6.1-FE: Date Range Support for Analytics
 * Story 6.2-FE: Period Comparison Enhancement
 */
export function BrandPageContent() {
  const state = useMarginPageState({
    drillDownPath: '/analytics/sku',
    drillDownParam: 'brand',
  })

  const { data, isLoading, isError, error, refetch } = useMarginAnalyticsByBrand({
    weekStart: state.weekStart,
    weekEnd: state.weekEnd,
    includeCogs: true,
    ...state.comparisonParams,
  })

  const { data: cabinetExpenses } = useCabinetLevelExpenses({
    weekStart: state.weekStart,
    weekEnd: state.weekEnd,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Маржинальность по брендам
          </h1>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>{error instanceof Error ? error.message : 'Ошибка загрузки данных'}</span>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Повторить
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const stats = data?.data ? calculateMarginStats(data.data, cabinetExpenses) : null

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Маржинальность по брендам
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Агрегированная аналитика прибыли и маржинальности по брендам
          </p>
        </div>
        <Button variant="outline" onClick={() => state.setShowExportDialog(true)} className="gap-2">
          <Download className="h-4 w-4" />
          Экспорт
        </Button>
      </div>

      <ExportDialog
        open={state.showExportDialog}
        onOpenChange={state.setShowExportDialog}
        defaultType="by-brand"
        defaultWeekStart={state.weekStart}
        defaultWeekEnd={state.weekEnd}
      />

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Агрегация:</strong> Данные суммируются по всем товарам каждого бренда. Кликните на
          строку бренда для просмотра детализации по товарам (SKU).
        </AlertDescription>
      </Alert>

      {state.isRangeMode && (
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-lg">
          <CalendarRange className="h-4 w-4 text-blue-600" />
          <span>
            Период: <strong>{formatPeriodLabel(state.weekStart, state.weekEnd)}</strong>
          </span>
        </div>
      )}

      {state.comparisonEnabled && state.effectiveComparisonPeriod && (
        <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-100 px-4 py-2 rounded-lg">
          <GitCompare className="h-4 w-4" />
          <span>
            Сравнение: <strong>{formatPeriodLabel(state.weekStart, state.weekEnd)}</strong>
            {' vs '}
            <strong>
              {formatPeriodLabel(
                state.effectiveComparisonPeriod.start,
                state.effectiveComparisonPeriod.end
              )}
            </strong>
          </span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <MarginFilterSection
          weekStart={state.weekStart}
          weekEnd={state.weekEnd}
          onRangeChange={state.handleRangeChange}
          comparisonEnabled={state.comparisonEnabled}
          onComparisonEnabledChange={state.setComparisonEnabled}
          comparisonPreset={state.comparisonPreset}
          onPresetChange={state.setComparisonPreset}
          customCompareStart={state.customCompareStart}
          customCompareEnd={state.customCompareEnd}
          onCompareRangeChange={state.handleCompareRangeChange}
        />
        {stats && (
          <MarginSummaryCards
            stats={stats}
            entityNameDative="брендам"
            entityNameGenitive="брендов"
          />
        )}
      </div>

      {cabinetExpenses && <StorageComparisonCard data={cabinetExpenses} />}

      <Card>
        <CardHeader>
          <CardTitle>Маржинальность по брендам</CardTitle>
          <CardDescription>
            Кликните на строку для детализации по товарам бренда. Сортировка по клику на заголовок
            столбца.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data?.data ? (
            <MarginByBrandTable data={data.data} onBrandClick={state.handleDrillDown} />
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
              <p className="text-gray-600">Нет данных за выбранную неделю</p>
            </div>
          )}
        </CardContent>
      </Card>

      <BrandHelpSection />
    </div>
  )
}
