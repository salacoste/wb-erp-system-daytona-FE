'use client'

/**
 * Margin Analysis by SKU Page
 * Epic 31: Complete Per-SKU Financial Analytics
 *
 * Uses /v1/analytics/sku-financials endpoint with:
 * - Storage from paid_storage_daily (Epic 24)
 * - Commission/acquiring as visibility fields
 * - Profitability classification badges
 */

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCabinetLevelExpenses } from '@/hooks/useMarginAnalytics'
import { useSkuFinancials } from '@/hooks/useSkuFinancials'
import { useAvailableWeeks } from '@/hooks/useFinancialSummary'
import { SkuFinancialsTable } from '@/components/custom/SkuFinancialsTable'
import { DateRangePicker, formatPeriodLabel } from '@/components/custom/DateRangePicker'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Info, AlertCircle, TrendingUp, X, CalendarRange, Download, Building2 } from 'lucide-react'
import { ExportDialog } from '@/components/custom/ExportDialog'
import { RequireWbToken } from '@/components/custom/RequireWbToken'

/**
 * SKU Financial Analytics Page
 * Epic 31: Complete Per-SKU Financial Analytics
 *
 * Features:
 * - Per-SKU profitability with correct storage from paid_storage_daily
 * - Commission/acquiring visibility fields (already in net_for_pay)
 * - Profitability status badges (excellent/good/warning/critical/loss/unknown)
 * - Sortable table with expense breakdown tooltips
 */
export default function MarginAnalysisBySkuPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Fetch available weeks from API (latest with actual data)
  const { data: availableWeeks, isLoading: isLoadingWeeks, isError: isErrorWeeks, error: errorWeeks } = useAvailableWeeks()

  // Week state - Epic 31 uses single week (weekEnd)
  const [weekStart, setWeekStart] = useState<string>('')
  const [weekEnd, setWeekEnd] = useState<string>('')
  const [isInitialized, setIsInitialized] = useState(false)

  // Story 4.9: Read nm_id filter from URL query params
  const nmIdFilter = searchParams.get('nm_id')

  // Story 6.5-FE: Export dialog state
  const [showExportDialog, setShowExportDialog] = useState(false)

  // Initialize week selection from URL params or first available week
  useEffect(() => {
    if (isInitialized) return

    const weekStartParam = searchParams.get('weekStart')
    const weekEndParam = searchParams.get('weekEnd')
    const weekParam = searchParams.get('week')

    if (weekStartParam && weekEndParam) {
      setWeekStart(weekStartParam)
      setWeekEnd(weekEndParam)
      setIsInitialized(true)
    } else if (weekParam) {
      setWeekStart(weekParam)
      setWeekEnd(weekParam)
      setIsInitialized(true)
    } else if (availableWeeks && availableWeeks.length > 0 && !isLoadingWeeks) {
      const latestWeek = availableWeeks[0].week
      setWeekStart(latestWeek)
      setWeekEnd(latestWeek)
      setIsInitialized(true)
    }
  }, [searchParams, availableWeeks, isLoadingWeeks, isInitialized])

  // Fetch cabinet-level expenses for Cashflow section
  const { data: cabinetExpenses, isLoading: isLoadingCabinetExpenses } = useCabinetLevelExpenses({
    weekStart,
    weekEnd,
  })

  // Epic 31: Fetch SKU financials from new endpoint with correct storage and visibility
  const {
    data: skuFinancialsData,
    isLoading: isLoadingSkuFinancials,
    isError: isErrorSkuFinancials,
    error: errorSkuFinancials,
    refetch,
  } = useSkuFinancials(
    {
      week: weekEnd, // Use single week for Epic 31
      nm_ids: nmIdFilter ?? undefined,
      sortBy: 'operating_profit',
      order: 'desc',
      limit: 500,
    },
    isInitialized && !!weekEnd
  )

  // Handle week change
  const handleRangeChange = (newStart: string, newEnd: string) => {
    setWeekStart(newStart)
    setWeekEnd(newEnd)
    const params = new URLSearchParams()
    params.set('weekStart', newStart)
    params.set('weekEnd', newEnd)
    if (nmIdFilter) {
      params.set('nm_id', nmIdFilter)
    }
    router.push(`/analytics/sku?${params.toString()}`)
  }

  // Story 4.9: Clear nm_id filter
  const handleClearFilter = () => {
    router.push(`/analytics/sku?weekStart=${weekStart}&weekEnd=${weekEnd}`)
  }

  // Check if using date range (multiple weeks)
  const isRangeMode = weekStart !== weekEnd

  // Get filtered product name for display
  const filteredProductName = nmIdFilter && skuFinancialsData?.data?.[0]?.productName

  // Loading skeleton - show while loading weeks or SKU financials
  if (isLoadingWeeks || (!isInitialized && !isErrorWeeks) || isLoadingSkuFinancials) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  // Error state - weeks loading failed (likely auth issue)
  if (isErrorWeeks) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Маржинальность по товарам
          </h1>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>
                {errorWeeks instanceof Error ? errorWeeks.message : 'Ошибка загрузки данных. Возможно, требуется авторизация.'}
              </span>
              <Button variant="outline" size="sm" onClick={() => router.push('/login')}>
                Войти
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Error state - SKU financials failed
  if (isErrorSkuFinancials) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Маржинальность по товарам
          </h1>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>
                {errorSkuFinancials instanceof Error ? errorSkuFinancials.message : 'Ошибка загрузки данных'}
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

  // Calculate summary statistics from Epic 31 data
  const skuData = skuFinancialsData?.data ?? []
  const stats = skuData.length > 0
    ? {
        total: skuData.length,
        withCogs: skuData.filter((item) => !item.missingCogs).length,
        withoutCogs: skuData.filter((item) => item.missingCogs).length,
        // Calculate average margin: operating_profit / sales_gross (from cabinet expenses)
        // This matches Cashflow section where sales_gross is 100% base
        // Formula: 33k / 224k = ~15% (NOT 33k / 153k = 21.6%)
        avgMargin: (() => {
          const withCogs = skuData.filter((item) => !item.missingCogs)
          if (withCogs.length === 0) return null
          const totalProfit = withCogs.reduce((sum, item) => sum + item.profit.operating, 0)
          // Use sales_gross from cabinet expenses as the base (NOT sum of SKU revenue.gross)
          // This ensures consistency with Cashflow section
          const salesGross = cabinetExpenses?.sales_gross ?? 0
          const returnsGross = cabinetExpenses?.returns_gross ?? 0
          const netSalesGross = salesGross - returnsGross
          return netSalesGross !== 0 ? (totalProfit / Math.abs(netSalesGross)) * 100 : null
        })(),
        // Use cabinet-level sales_gross for consistency
        totalRevenue: cabinetExpenses ? (cabinetExpenses.sales_gross - (cabinetExpenses.returns_gross ?? 0)) : skuData.reduce((sum, item) => sum + item.revenue.gross, 0),
        totalProfit: skuData.filter(item => !item.missingCogs).reduce((sum, item) => sum + item.profit.operating, 0),
      }
    : null

  return (
    <RequireWbToken>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Маржинальность по товарам
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Анализ прибыли и маржинальности по каждому SKU
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
        defaultType="by-sku"
        defaultWeekStart={weekStart}
        defaultWeekEnd={weekEnd}
      />

      {/* Info Banner - Operating profit formula explanation */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="space-y-2">
          <div>
            <strong className="text-blue-800">ℹ️ Расчёт операционной прибыли</strong>
          </div>
          <div className="text-blue-700 text-sm">
            <strong>Прибыль</strong> = Выручка − COGS − Все расходы (логистика, хранение, комиссия WB, эквайринг, штрафы и др.)
          </div>
          <div className="text-blue-600 text-xs">
            💡 Наведите на колонку «Прибыль» для деталей. См. docs/request-backend/63-operating-profit-formula-clarification.md
          </div>
        </AlertDescription>
      </Alert>

      {/* Story 4.9: Filter Alert - shown when nm_id filter is active */}
      {nmIdFilter && (
        <Alert className="border-blue-200 bg-blue-50" role="alert">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm text-blue-800">
              <strong>Фильтр по товару:</strong> {nmIdFilter}
              {filteredProductName && ` (${filteredProductName})`}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilter}
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
            >
              <X className="h-4 w-4 mr-1" />
              Показать все
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Period Label (multi-week mode) */}
      {isRangeMode && (
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-lg">
          <CalendarRange className="h-4 w-4 text-blue-600" />
          <span>Период: <strong>{formatPeriodLabel(weekStart, weekEnd)}</strong></span>
        </div>
      )}

      {/* Date Range Selection & Summary */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Week Picker */}
        <Card>
          <CardHeader>
            <CardTitle>Период анализа</CardTitle>
            <CardDescription>Выберите неделю для анализа</CardDescription>
          </CardHeader>
          <CardContent>
            <DateRangePicker
              weekStart={weekStart}
              weekEnd={weekEnd}
              onRangeChange={handleRangeChange}
              maxWeeks={52}
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
              <CardContent className="space-y-3">
                {/* Margin - uses full expense formula from API */}
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {stats.avgMargin !== null ? `${stats.avgMargin.toFixed(1)}%` : '—'}
                    </span>
                    <span className="text-sm text-gray-500">операционная маржа</span>
                  </div>
                  <p className="text-xs text-gray-500">Выручка − COGS − Все расходы</p>
                  <p className="text-xs text-gray-400">(логистика, хранение, комиссия, эквайринг и др.)</p>
                </div>
                <p className="pt-2 text-sm text-gray-600 border-t">
                  По {stats.withCogs} товарам с себестоимостью
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
                    <span className="text-gray-600">Всего товаров:</span>
                    <span className="font-semibold text-gray-900">{stats.total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">С себестоимостью:</span>
                    <span className="font-semibold text-green-600">{stats.withCogs}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Без себестоимости:</span>
                    <span className="font-semibold text-yellow-600">
                      {stats.withoutCogs}
                    </span>
                  </div>
                  <div className="mt-2 pt-2 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Охват:</span>
                      <span className="font-semibold text-blue-600">
                        {((stats.withCogs / stats.total) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Full Cashflow Card */}
      {(cabinetExpenses || isLoadingCabinetExpenses) && (
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Building2 className="h-5 w-5" />
              Полный Cashflow
            </CardTitle>
            <CardDescription className="text-blue-700">
              Движение денежных средств за период
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingCabinetExpenses ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : cabinetExpenses ? (
              (() => {
                // Calculate percentages relative to sales_gross (100% baseline)
                const salesGross = cabinetExpenses.sales_gross || 1; // Avoid division by zero
                const returnsGross = cabinetExpenses.returns_gross ?? 0;
                const netSales = salesGross - returnsGross;
                const netProfit = cabinetExpenses.gross_profit_sku - cabinetExpenses.total;

                // Helper to calculate % of sales
                const pct = (value: number) => ((value / salesGross) * 100).toFixed(1);
                // Helper to format percentage badge
                const PctBadge = ({ value, isRemaining = false, colorClass = '' }: { value: number; isRemaining?: boolean; colorClass?: string }) => (
                  <span className={`ml-2 px-1.5 py-0.5 text-xs font-medium rounded ${colorClass || (isRemaining ? 'bg-gray-200 text-gray-600' : 'bg-red-200 text-red-700')}`}>
                    {isRemaining ? '' : '−'}{pct(value)}%
                  </span>
                );

                return (
                  <div className="space-y-3">
                    {/* Row 1: Sales Gross - 100% baseline */}
                    <div className="flex items-center justify-between p-3 bg-green-100 rounded-lg border border-green-300">
                      <div className="flex items-center gap-2">
                        <span className="text-green-600 font-bold text-lg">+</span>
                        <span className="text-sm font-medium text-green-800">Продажи (gross)</span>
                        <span className="ml-1 px-1.5 py-0.5 text-xs font-medium rounded bg-green-200 text-green-700">100%</span>
                      </div>
                      <span className="text-lg font-bold text-green-700">
                        {cabinetExpenses.sales_gross.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽
                      </span>
                    </div>

                    {/* Row 2: Returns Gross */}
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center gap-2">
                        <span className="text-red-500 font-bold text-lg">−</span>
                        <span className="text-sm font-medium text-red-700">Возвраты (gross)</span>
                        <PctBadge value={returnsGross} />
                      </div>
                      <span className="text-lg font-bold text-red-600">
                        {returnsGross.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽
                      </span>
                    </div>

                    {/* Row 3: Net Sales (sales - returns) */}
                    <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg border border-gray-300">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 font-bold text-lg">=</span>
                        <span className="text-sm font-medium text-gray-800">Чистые продажи (gross)</span>
                        <span className="ml-1 px-1.5 py-0.5 text-xs font-medium rounded bg-gray-200 text-gray-600">{pct(netSales)}%</span>
                      </div>
                      <span className="text-lg font-bold text-gray-700">
                        {netSales.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽
                      </span>
                    </div>

                    {/* Row 4: Marketplace Commission */}
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center gap-2">
                        <span className="text-red-500 font-bold text-lg">−</span>
                        <span className="text-sm font-medium text-red-700">Комиссия МП</span>
                        <PctBadge value={cabinetExpenses.marketplace_commission} />
                      </div>
                      <span className="text-lg font-bold text-red-600">
                        {cabinetExpenses.marketplace_commission.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽
                      </span>
                    </div>

                    {/* Row 5: Acquiring Fee (эквайринг) */}
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center gap-2">
                        <span className="text-red-500 font-bold text-lg">−</span>
                        <span className="text-sm font-medium text-red-700">Эквайринг</span>
                        <PctBadge value={cabinetExpenses.acquiring_fee ?? 0} />
                      </div>
                      <span className="text-lg font-bold text-red-600">
                        {(cabinetExpenses.acquiring_fee ?? 0).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽
                      </span>
                    </div>

                    {/* Row 6: COGS */}
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center gap-2">
                        <span className="text-red-500 font-bold text-lg">−</span>
                        <span className="text-sm font-medium text-red-700">Себестоимость (COGS)</span>
                        <PctBadge value={cabinetExpenses.cogs_total} />
                      </div>
                      <span className="text-lg font-bold text-red-600">
                        {cabinetExpenses.cogs_total.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽
                      </span>
                    </div>

                    {/* Subtotal: Gross Profit by SKU (calculated: to_pay_goods - COGS) */}
                    {/* FIX (2025-12-19): Now uses to_pay_goods (after all commission+acquiring) instead of sales - commission */}
                    <div className="flex items-center justify-between p-3 bg-blue-100 rounded-lg border-2 border-blue-400">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600 font-bold text-lg">=</span>
                        <span className="text-sm font-medium text-blue-800">Валовая прибыль по SKU</span>
                        <span className={`ml-1 px-1.5 py-0.5 text-xs font-medium rounded ${
                          cabinetExpenses.gross_profit_sku >= 0 ? 'bg-blue-200 text-blue-700' : 'bg-red-200 text-red-700'
                        }`}>{pct(cabinetExpenses.gross_profit_sku)}%</span>
                      </div>
                      <span className={`text-xl font-bold ${cabinetExpenses.gross_profit_sku >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                        {cabinetExpenses.gross_profit_sku.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽
                      </span>
                    </div>

                    {/* Divider */}
                    <div className="border-t-2 border-amber-300 my-2" />

                    {/* Cabinet-Level Expenses Header */}
                    <div className="text-sm font-medium text-amber-800 px-2">Удержания из выплаты (общекабинетные расходы):</div>

                    {/* Cabinet expenses grid - 6 items with percentages */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                      <div className="text-center p-2 bg-amber-50 rounded border border-amber-200">
                        <div className="text-xs text-amber-600">Логистика</div>
                        <div className="text-sm font-bold text-amber-800">
                          {(cabinetExpenses.logistics ?? 0).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                        </div>
                        <div className="text-xs text-amber-500">{pct(cabinetExpenses.logistics ?? 0)}%</div>
                      </div>
                      <div className={`text-center p-2 rounded border ${
                        Math.abs(cabinetExpenses.storage_difference ?? 0) > 1
                          ? 'bg-yellow-100 border-yellow-400'
                          : 'bg-amber-50 border-amber-200'
                      }`}>
                        <div className="text-xs text-amber-600">Хранение (API)</div>
                        <div className="text-sm font-bold text-amber-800">
                          {cabinetExpenses.storage.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                        </div>
                        <div className="text-xs text-amber-500">{pct(cabinetExpenses.storage)}%</div>
                        {/* Request #67: Show weekly report storage for comparison */}
                        <div className="text-[10px] text-gray-500 mt-1 border-t border-gray-200 pt-1">
                          Отчёт: {(cabinetExpenses.storage_weekly_report ?? 0).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                          {Math.abs(cabinetExpenses.storage_difference ?? 0) > 1 && (
                            <span className={`ml-1 font-medium ${
                              (cabinetExpenses.storage_difference ?? 0) > 0 ? 'text-red-600' : 'text-green-600'
                            }`}>
                              ({(cabinetExpenses.storage_difference ?? 0) > 0 ? '+' : ''}
                              {(cabinetExpenses.storage_difference ?? 0).toLocaleString('ru-RU', { maximumFractionDigits: 0 })})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-center p-2 bg-amber-50 rounded border border-amber-200">
                        <div className="text-xs text-amber-600">Прочие удерж.</div>
                        <div className="text-sm font-bold text-amber-800">
                          {cabinetExpenses.other_adjustments.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                        </div>
                        <div className="text-xs text-amber-500">{pct(cabinetExpenses.other_adjustments)}%</div>
                      </div>
                      <div className="text-center p-2 bg-amber-50 rounded border border-amber-200">
                        <div className="text-xs text-amber-600">Коррект. ВВ</div>
                        <div className="text-sm font-bold text-amber-800">
                          {cabinetExpenses.wb_commission_adj.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                        </div>
                        <div className="text-xs text-amber-500">{pct(cabinetExpenses.wb_commission_adj)}%</div>
                      </div>
                      <div className="text-center p-2 bg-amber-50 rounded border border-amber-200">
                        <div className="text-xs text-amber-600">Штрафы</div>
                        <div className="text-sm font-bold text-amber-800">
                          {cabinetExpenses.penalties.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                        </div>
                        <div className="text-xs text-amber-500">{pct(cabinetExpenses.penalties)}%</div>
                      </div>
                      <div className="text-center p-2 bg-amber-50 rounded border border-amber-200">
                        <div className="text-xs text-amber-600">Платн. приёмка</div>
                        <div className="text-sm font-bold text-amber-800">
                          {cabinetExpenses.paid_acceptance.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                        </div>
                        <div className="text-xs text-amber-500">{pct(cabinetExpenses.paid_acceptance)}%</div>
                      </div>
                    </div>

                    {/* Row: Total Cabinet Expenses */}
                    <div className="flex items-center justify-between p-3 bg-amber-100 rounded-lg border border-amber-300">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-600 font-bold text-lg">−</span>
                        <span className="text-sm font-medium text-amber-800">ИТОГО общекабинетные расходы</span>
                        <span className="ml-1 px-1.5 py-0.5 text-xs font-medium rounded bg-amber-200 text-amber-700">−{pct(cabinetExpenses.total)}%</span>
                      </div>
                      <span className="text-lg font-bold text-amber-700">
                        {cabinetExpenses.total.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽
                      </span>
                    </div>

                    {/* Final: Net Profit with margin percentage */}
                    <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                      netProfit >= 0 ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-xl ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>=</span>
                        <span className={`text-base font-semibold ${netProfit >= 0 ? 'text-green-800' : 'text-red-800'}`}>ЧИСТАЯ ПРИБЫЛЬ</span>
                        <span className={`ml-1 px-2 py-0.5 text-sm font-bold rounded ${
                          netProfit >= 0 ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'
                        }`}>{pct(netProfit)}%</span>
                      </div>
                      <span className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                        {netProfit.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽
                      </span>
                    </div>
                  </div>
                );
              })()

            ) : null}
          </CardContent>
        </Card>
      )}

      {/* SKU Financials Table - Epic 31 */}
      <Card>
        <CardHeader>
          <CardTitle>Маржинальность по товарам</CardTitle>
          <CardDescription>
            Сортировка по клику на заголовок столбца.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {skuData.length > 0 ? (
            <SkuFinancialsTable
              data={skuData}
              showVisibility={true}
              showExpenseBreakdown={true}
            />
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
            <strong>1. Выбор недели</strong>
            <p className="mt-1 text-blue-800">
              Используйте селектор недели для просмотра данных за разные периоды. По
              умолчанию показана текущая неделя.
            </p>
          </div>
          <div>
            <strong>2. Сортировка</strong>
            <p className="mt-1 text-blue-800">
              Кликните на заголовок столбца для сортировки. Повторный клик меняет порядок
              сортировки (возрастание/убывание). По умолчанию данные отсортированы по марже.
            </p>
          </div>
          <div>
            <strong>3. Цветовая индикация</strong>
            <p className="mt-1 text-blue-800">
              Зелёный цвет — прибыльные товары (положительная маржа). Красный цвет — убыточные
              товары (отрицательная маржа). Жёлтый фон — нет данных о себестоимости.
            </p>
          </div>
          <div>
            <strong>4. Назначение себестоимости</strong>
            <p className="mt-1 text-blue-800">
              Если у товара нет себестоимости, кликните на строку для перехода к назначению
              COGS. После назначения маржа будет рассчитана автоматически.
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
    </RequireWbToken>
  )
}
