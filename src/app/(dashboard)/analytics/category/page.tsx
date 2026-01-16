'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useMarginAnalyticsByCategory, useCabinetLevelExpenses } from '@/hooks/useMarginAnalytics'
import { getLastCompletedWeek } from '@/lib/margin-helpers'
import { MarginByCategoryTable } from '@/components/custom/MarginByCategoryTable'
import { DateRangePicker, formatPeriodLabel } from '@/components/custom/DateRangePicker'
import {
  ComparisonPeriodSelector,
  ComparisonPreset,
  getEffectiveComparisonPeriod,
} from '@/components/custom/ComparisonPeriodSelector'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Info, AlertCircle, TrendingUp, CalendarRange, GitCompare, Download } from 'lucide-react'
import { ExportDialog } from '@/components/custom/ExportDialog'

/**
 * Margin Analysis by Category Page
 * Story 4.6: Margin Analysis by Brand & Category
 * Story 6.1-FE: Date Range Support for Analytics
 * Story 6.2-FE: Period Comparison Enhancement
 *
 * Features:
 * - View aggregated margin analysis by category
 * - Sortable table (margin, revenue, profit, category)
 * - Color-coded margin values
 * - Date range selection (Story 6.1-FE)
 * - Period comparison with delta indicators (Story 6.2-FE)
 * - Drill down to SKU level
 * - Summary statistics
 */
export default function MarginAnalysisByCategoryPage() {
  const router = useRouter()

  // Story 6.1-FE: Date range state
  const lastCompletedWeek = getLastCompletedWeek()
  const [weekStart, setWeekStart] = useState(lastCompletedWeek)
  const [weekEnd, setWeekEnd] = useState(lastCompletedWeek)

  // Story 6.2-FE: Comparison mode state
  const [comparisonEnabled, setComparisonEnabled] = useState(false)
  const [comparisonPreset, setComparisonPreset] = useState<ComparisonPreset>('previous')
  const [customCompareStart, setCustomCompareStart] = useState(lastCompletedWeek)
  const [customCompareEnd, setCustomCompareEnd] = useState(lastCompletedWeek)

  // Story 6.5-FE: Export dialog state
  const [showExportDialog, setShowExportDialog] = useState(false)

  // Story 6.2-FE: Calculate effective comparison period based on preset
  const effectiveComparisonPeriod = useMemo(() => {
    if (!comparisonEnabled) return null
    return getEffectiveComparisonPeriod(
      comparisonPreset,
      weekStart,
      weekEnd,
      customCompareStart,
      customCompareEnd
    )
  }, [comparisonEnabled, comparisonPreset, weekStart, weekEnd, customCompareStart, customCompareEnd])

  // Story 6.1-FE & 6.2-FE: Fetch margin analytics data with date range and optional comparison
  const { data, isLoading, isError, error, refetch } = useMarginAnalyticsByCategory({
    weekStart,
    weekEnd,
    includeCogs: true,
    // Story 6.2-FE: Pass comparison period if enabled
    compareTo: effectiveComparisonPeriod?.start === effectiveComparisonPeriod?.end
      ? effectiveComparisonPeriod?.start
      : undefined,
    compareToStart: effectiveComparisonPeriod?.start !== effectiveComparisonPeriod?.end
      ? effectiveComparisonPeriod?.start
      : undefined,
    compareToEnd: effectiveComparisonPeriod?.start !== effectiveComparisonPeriod?.end
      ? effectiveComparisonPeriod?.end
      : undefined,
  })

  // Request #67: Fetch cabinet-level expenses for storage comparison
  const { data: cabinetExpenses } = useCabinetLevelExpenses({
    weekStart,
    weekEnd,
  })

  // Story 6.2-FE: Handle custom comparison range change
  const handleCompareRangeChange = (start: string, end: string) => {
    setCustomCompareStart(start)
    setCustomCompareEnd(end)
  }

  // Handle category click - drill down to SKU level
  const handleCategoryClick = (category: string) => {
    // Navigate to SKU analytics with category filter and date range
    router.push(`/analytics/sku?weekStart=${weekStart}&weekEnd=${weekEnd}&category=${encodeURIComponent(category)}`)
  }

  // Story 6.1-FE: Handle date range change
  const handleRangeChange = (newStart: string, newEnd: string) => {
    setWeekStart(newStart)
    setWeekEnd(newEnd)
  }

  // Story 6.1-FE: Check if using date range (multiple weeks)
  const isRangeMode = weekStart !== weekEnd

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Маржинальность по категориям
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
                Повторить
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Calculate summary statistics
  // Request #65: Use operating_profit (after ALL expenses) instead of profit (gross)
  // Use cabinet-level sales_gross as base for margin (consistent with SKU page and Cashflow)
  const stats = data?.data
    ? {
        total: data.data.length,
        // Use cabinet-level sales_gross for consistency with SKU page and Cashflow
        totalRevenue: cabinetExpenses ? (cabinetExpenses.sales_gross - (cabinetExpenses.returns_gross ?? 0)) : data.data.reduce((sum, item) => sum + (item.revenue_gross || item.revenue_net), 0),
        totalProfit: data.data.reduce((sum, item) => sum + (item.operating_profit || 0), 0),
        avgMargin: (() => {
          // Use cabinet-level data for margin calculation (consistent with SKU page)
          // Formula: operating_profit / (sales_gross - returns_gross)
          const totalProfit = data.data.reduce(
            (sum, item) => sum + (item.operating_profit || 0),
            0
          )
          // Use sales_gross from cabinet expenses as the base
          const salesGross = cabinetExpenses?.sales_gross ?? 0
          const returnsGross = cabinetExpenses?.returns_gross ?? 0
          const netSalesGross = salesGross - returnsGross

          return netSalesGross !== 0
            ? (totalProfit / Math.abs(netSalesGross)) * 100
            : null
        })(),
        totalMissingCogs: data.data.reduce(
          (sum, item) => sum + (item.missing_cogs_count || 0),
          0
        ),
      }
    : null

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Маржинальность по категориям
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Агрегированная аналитика прибыли и маржинальности по категориям товаров
          </p>
        </div>
        {/* Story 6.5-FE: Export Button */}
        <Button
          variant="outline"
          onClick={() => setShowExportDialog(true)}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Экспорт
        </Button>
      </div>

      {/* Story 6.5-FE: Export Dialog */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        defaultType="by-category"
        defaultWeekStart={weekStart}
        defaultWeekEnd={weekEnd}
      />

      {/* Info Banner */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Агрегация:</strong> Данные суммируются по всем товарам каждой категории. Кликните
          на строку категории для просмотра детализации по товарам (SKU).
        </AlertDescription>
      </Alert>

      {/* Story 6.1-FE: Period Label */}
      {isRangeMode && (
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-lg">
          <CalendarRange className="h-4 w-4 text-blue-600" />
          <span>Период: <strong>{formatPeriodLabel(weekStart, weekEnd)}</strong></span>
        </div>
      )}

      {/* Story 6.2-FE: Comparison Mode Indicator */}
      {comparisonEnabled && effectiveComparisonPeriod && (
        <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-100 px-4 py-2 rounded-lg">
          <GitCompare className="h-4 w-4" />
          <span>
            Сравнение: <strong>{formatPeriodLabel(weekStart, weekEnd)}</strong>
            {' vs '}
            <strong>{formatPeriodLabel(effectiveComparisonPeriod.start, effectiveComparisonPeriod.end)}</strong>
          </span>
        </div>
      )}

      {/* Date Range Selection & Summary */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Story 6.1-FE: Date Range Picker */}
        <Card>
          <CardHeader>
            <CardTitle>Период анализа</CardTitle>
            <CardDescription>Выберите диапазон недель для анализа</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DateRangePicker
              weekStart={weekStart}
              weekEnd={weekEnd}
              onRangeChange={handleRangeChange}
              maxWeeks={52}
            />
            {/* Story 6.2-FE: Comparison Period Selector */}
            <ComparisonPeriodSelector
              enabled={comparisonEnabled}
              onEnabledChange={setComparisonEnabled}
              preset={comparisonPreset}
              onPresetChange={setComparisonPreset}
              compareStart={customCompareStart}
              compareEnd={customCompareEnd}
              onCompareRangeChange={handleCompareRangeChange}
              currentPeriodStart={weekStart}
              currentPeriodEnd={weekEnd}
            />
          </CardContent>
        </Card>

        {/* Summary Statistics */}
        {stats && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Средняя маржа
                </CardTitle>
                <CardDescription>За выбранный период</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {stats.avgMargin !== null ? `${stats.avgMargin.toFixed(2)}%` : '—'}
                  </span>
                  <span className="text-sm text-gray-500">операционная маржа</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Выручка − COGS − Все расходы
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  По {stats.total} категориям
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Охват</CardTitle>
                <CardDescription>Статистика по себестоимости</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Всего категорий:</span>
                    <span className="font-semibold text-gray-900">{stats.total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Общая выручка:</span>
                    <span className="font-semibold text-gray-900">
                      {new Intl.NumberFormat('ru-RU', {
                        style: 'currency',
                        currency: 'RUB',
                        maximumFractionDigits: 0,
                      }).format(stats.totalRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Общая прибыль:</span>
                    <span className="font-semibold text-green-600">
                      {new Intl.NumberFormat('ru-RU', {
                        style: 'currency',
                        currency: 'RUB',
                        maximumFractionDigits: 0,
                      }).format(stats.totalProfit)}
                    </span>
                  </div>
                  <div className="mt-2 pt-2 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Товаров без COGS:</span>
                      <span className="font-semibold text-yellow-600">
                        {stats.totalMissingCogs}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Request #67: Storage Source Comparison Card */}
      {cabinetExpenses && (
        <Card className={`${
          Math.abs(cabinetExpenses.storage_difference ?? 0) > 1
            ? 'border-yellow-400 bg-yellow-50'
            : 'border-gray-200'
        }`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              📦 Сравнение источников хранения
              {Math.abs(cabinetExpenses.storage_difference ?? 0) > 1 && (
                <span className="px-2 py-0.5 text-xs bg-yellow-200 text-yellow-800 rounded">Расхождение</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Storage API (paid_storage)</div>
                <div className="text-lg font-bold text-gray-900">
                  {cabinetExpenses.storage.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                </div>
              </div>
              <div>
                <div className="text-gray-500">Еженедельный отчёт</div>
                <div className="text-lg font-bold text-gray-600">
                  {(cabinetExpenses.storage_weekly_report ?? 0).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                </div>
              </div>
              <div>
                <div className="text-gray-500">Разница</div>
                <div className={`text-lg font-bold ${
                  Math.abs(cabinetExpenses.storage_difference ?? 0) <= 1
                    ? 'text-green-600'
                    : (cabinetExpenses.storage_difference ?? 0) > 0
                      ? 'text-red-600'
                      : 'text-orange-600'
                }`}>
                  {(cabinetExpenses.storage_difference ?? 0) > 0 ? '+' : ''}
                  {(cabinetExpenses.storage_difference ?? 0).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Margin Table */}
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
            <MarginByCategoryTable data={data.data} onCategoryClick={handleCategoryClick} />
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
              <p className="text-gray-600">Нет данных за выбранную неделю</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">Как использовать анализ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-blue-900">
          <div>
            <strong>1. Агрегация данных</strong>
            <p className="mt-1 text-blue-800">
              Все показатели суммируются по товарам каждой категории. Средняя маржа
              рассчитывается как средневзвешенное значение.
            </p>
          </div>
          <div>
            <strong>2. Детализация</strong>
            <p className="mt-1 text-blue-800">
              Кликните на категорию для просмотра детализации по товарам (SKU). Это позволяет
              выявить наиболее и наименее прибыльные товары внутри категории.
            </p>
          </div>
          <div>
            <strong>3. Столбец "Без COGS"</strong>
            <p className="mt-1 text-blue-800">
              Показывает количество товаров категории без назначенной себестоимости. Эти товары
              не учитываются при расчёте маржи.
            </p>
          </div>
          <div>
            <strong>4. Цветовая индикация</strong>
            <p className="mt-1 text-blue-800">
              Зелёный — прибыльные категории. Красный — убыточные категории. Жёлтый фон — есть
              товары без себестоимости.
            </p>
          </div>
          <div>
            <strong>5. Стратегическое планирование</strong>
            <p className="mt-1 text-blue-800">
              Используйте этот анализ для принятия стратегических решений: фокус на прибыльных
              категориях, оптимизация ассортимента, корректировка ценообразования.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
