'use client'

import { useMarginAnalyticsByCategory, useCabinetLevelExpenses } from '@/hooks/useMarginAnalytics'
import { MarginByCategoryTable } from '@/components/custom/MarginByCategoryTable'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Info, Download } from 'lucide-react'
import { ExportDialog } from '@/components/custom/ExportDialog'
import { useMarginPageState } from '@/app/(dashboard)/analytics/shared/useMarginPageState'
import { StorageComparisonCard } from '@/app/(dashboard)/analytics/shared/StorageComparisonCard'
import { MarginFilterSection } from '@/app/(dashboard)/analytics/shared/MarginFilterSection'
import { MarginSummaryCards } from '@/app/(dashboard)/analytics/shared/MarginSummaryCards'
import { calculateMarginStats } from '@/app/(dashboard)/analytics/shared/calculate-margin-stats'
import {
  MarginPageLoading,
  MarginPageError,
  MarginPeriodIndicator,
  MarginComparisonIndicator,
} from '@/app/(dashboard)/analytics/shared/MarginPageStates'
import { CategoryHelpSection } from './components/CategoryHelpSection'

/**
 * Margin Analysis by Category Page
 * Story 4.6: Margin Analysis by Brand & Category
 * Story 6.1-FE: Date Range Support for Analytics
 * Story 6.2-FE: Period Comparison Enhancement
 */
export default function MarginAnalysisByCategoryPage() {
  const state = useMarginPageState({
    drillDownPath: '/analytics/sku',
    drillDownParam: 'category',
  })

  // Story 6.1-FE & 6.2-FE: Fetch margin analytics data with date range and optional comparison
  const { data, isLoading, isError, error, refetch } = useMarginAnalyticsByCategory({
    weekStart: state.weekStart,
    weekEnd: state.weekEnd,
    includeCogs: true,
    ...state.comparisonParams,
  })

  // Request #67: Fetch cabinet-level expenses for storage comparison
  const { data: cabinetExpenses } = useCabinetLevelExpenses({
    weekStart: state.weekStart,
    weekEnd: state.weekEnd,
  })

  if (isLoading) {
    return <MarginPageLoading />
  }

  if (isError) {
    return (
      <MarginPageError
        title="Маржинальность по категориям"
        error={error}
        onRetry={() => refetch()}
      />
    )
  }

  // Calculate summary statistics (shared utility — Request #65)
  const stats = data?.data ? calculateMarginStats(data.data, cabinetExpenses) : null

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Маржинальность по категориям
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Агрегированная аналитика прибыли и маржинальности по категориям товаров
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
        defaultType="by-category"
        defaultWeekStart={state.weekStart}
        defaultWeekEnd={state.weekEnd}
      />

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Агрегация:</strong> Данные суммируются по всем товарам каждой категории. Кликните
          на строку категории для просмотра детализации по товарам (SKU).
        </AlertDescription>
      </Alert>

      <MarginPeriodIndicator
        weekStart={state.weekStart}
        weekEnd={state.weekEnd}
        isRangeMode={state.isRangeMode}
      />

      {state.comparisonEnabled && state.effectiveComparisonPeriod && (
        <MarginComparisonIndicator
          weekStart={state.weekStart}
          weekEnd={state.weekEnd}
          compareStart={state.effectiveComparisonPeriod.start}
          compareEnd={state.effectiveComparisonPeriod.end}
        />
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
            entityNameDative="категориям"
            entityNameGenitive="категорий"
          />
        )}
      </div>

      {cabinetExpenses && <StorageComparisonCard data={cabinetExpenses} />}

      <Card>
        <CardHeader>
          <CardTitle>Маржинальность по категориям</CardTitle>
          <CardDescription>
            Кликните на строку для детализации по товарам категории. Сортировка по клику на
            заголовок столбца.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data?.data ? (
            <MarginByCategoryTable data={data.data} onCategoryClick={state.handleDrillDown} />
          ) : (
            <div className="rounded-lg border border-border bg-muted p-12 text-center">
              <p className="text-muted-foreground">Нет данных за выбранную неделю</p>
            </div>
          )}
        </CardContent>
      </Card>

      <CategoryHelpSection />
    </div>
  )
}
