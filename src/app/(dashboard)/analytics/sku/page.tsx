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

import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { ExportDialog } from '@/components/custom/ExportDialog'
import { RequireWbToken } from '@/components/custom/RequireWbToken'
import { useSkuPageState } from './components/useSkuPageState'
import { SkuPageLoading, SkuPageWeeksError, SkuPageDataError } from './components/SkuPageStates'
import { calculateSkuPageStats } from './components/sku-page-stats'
import { OperatingProfitInfoBanner, NmIdFilterAlert, PeriodLabel } from './components/SkuPageAlerts'
import { SkuFilterSection } from './components/SkuFilterSection'
import { SkuCashflowSection } from './components/SkuCashflowSection'
import { SkuTableSection } from './components/SkuTableSection'

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
  return (
    <Suspense fallback={<SkuPageLoading />}>
      <MarginAnalysisBySkuPageContent />
    </Suspense>
  )
}

function MarginAnalysisBySkuPageContent() {
  const state = useSkuPageState()

  // Loading skeleton - show while loading weeks or SKU financials
  if (
    state.isLoadingWeeks ||
    (!state.isInitialized && !state.isErrorWeeks) ||
    state.isLoadingSkuFinancials
  ) {
    return <SkuPageLoading />
  }

  // Error state - weeks loading failed (likely auth issue)
  if (state.isErrorWeeks) {
    return <SkuPageWeeksError error={state.errorWeeks as Error | null} router={state.router} />
  }

  // Error state - SKU financials failed
  if (state.isErrorSkuFinancials) {
    return (
      <SkuPageDataError
        error={state.errorSkuFinancials as Error | null}
        onRetry={() => state.refetch()}
      />
    )
  }

  // Calculate summary statistics from Epic 31 data
  const skuData = state.skuFinancialsData?.data ?? []
  const stats = calculateSkuPageStats(skuData, state.cabinetExpenses)

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
            onClick={() => state.setShowExportDialog(true)}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Экспорт
          </Button>
        </div>

        {/* Story 6.5-FE: Export Dialog */}
        <ExportDialog
          open={state.showExportDialog}
          onOpenChange={state.setShowExportDialog}
          defaultType="by-sku"
          defaultWeekStart={state.weekStart}
          defaultWeekEnd={state.weekEnd}
        />

        {/* Info Banner - Operating profit formula explanation */}
        <OperatingProfitInfoBanner />

        {/* Story 4.9: Filter Alert - shown when nm_id filter is active */}
        {state.nmIdFilter && (
          <NmIdFilterAlert
            nmIdFilter={state.nmIdFilter}
            filteredProductName={state.filteredProductName}
            onClear={state.handleClearFilter}
          />
        )}

        {/* Period Label (multi-week mode) */}
        {state.isRangeMode && <PeriodLabel weekStart={state.weekStart} weekEnd={state.weekEnd} />}

        {/* Date Range Selection & Summary */}
        <SkuFilterSection
          weekStart={state.weekStart}
          weekEnd={state.weekEnd}
          onRangeChange={state.handleRangeChange}
          stats={stats}
        />

        {/* Full Cashflow Card */}
        <SkuCashflowSection
          cabinetExpenses={state.cabinetExpenses}
          isLoading={state.isLoadingCabinetExpenses}
        />

        {/* SKU Financials Table + Help */}
        <SkuTableSection skuData={skuData} />
      </div>
    </RequireWbToken>
  )
}
