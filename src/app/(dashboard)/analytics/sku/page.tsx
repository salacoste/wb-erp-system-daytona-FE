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
import { useRouter, useSearchParams } from 'next/navigation'
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
import { SkuGroupByToggle, type SkuGroupByMode } from './components/SkuGroupByToggle'
import { SkuVariantSection } from './components/SkuVariantSection'

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
  const router = useRouter()
  const searchParams = useSearchParams()
  const state = useSkuPageState()

  // FR-7 Phase 2: group_by URL param ('sku' default, 'variant' alt).
  // Read on init; router.replace on change (no extra history entries).
  const groupBy: SkuGroupByMode = searchParams.get('group_by') === 'variant' ? 'variant' : 'sku'

  const handleGroupByChange = (mode: SkuGroupByMode) => {
    const params = new URLSearchParams(searchParams.toString())
    if (mode === 'sku') {
      params.delete('group_by')
    } else {
      params.set('group_by', 'variant')
    }
    router.replace(`/analytics/sku?${params.toString()}`, { scroll: false })
  }

  // Loading skeleton - show while loading weeks or SKU financials.
  // In sku-mode we wait on sku-financials; variant-mode renders its own loading state.
  const waitSkuFinancials = groupBy === 'sku' && state.isLoadingSkuFinancials
  if (state.isLoadingWeeks || (!state.isInitialized && !state.isErrorWeeks) || waitSkuFinancials) {
    return <SkuPageLoading />
  }

  // Error state - weeks loading failed (likely auth issue)
  if (state.isErrorWeeks) {
    return <SkuPageWeeksError error={state.errorWeeks as Error | null} router={state.router} />
  }

  // Error state - SKU financials failed (sku-mode only — variant-mode owns its error branch)
  if (groupBy === 'sku' && state.isErrorSkuFinancials) {
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

  // FR-7 Phase 2: variant endpoint is single-week only (400 on range). If the user
  // is on variant mode and switches to a range, fall back to sku to avoid a 400.
  // Defensive: if URL still says variant while in range mode, treat as sku here.
  const effectiveGroupBy: SkuGroupByMode =
    groupBy === 'variant' && !state.isRangeMode ? 'variant' : 'sku'

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
          {/* Story 6.5-FE: Export Button — sku-mode only. The export dialog defaults to
              by-sku and has no variant type yet; hide it in variant mode to avoid silently
              exporting by-SKU data while the user views variants (Defensive FE). */}
          {effectiveGroupBy === 'sku' ? (
            <Button
              variant="outline"
              onClick={() => state.setShowExportDialog(true)}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Экспорт
            </Button>
          ) : (
            <span className="text-xs text-gray-400">Экспорт по цветомоделям скоро</span>
          )}
        </div>

        {/* Story 6.5-FE: Export Dialog — rendered only in sku mode (button is hidden otherwise). */}
        {effectiveGroupBy === 'sku' && (
          <ExportDialog
            open={state.showExportDialog}
            onOpenChange={state.setShowExportDialog}
            defaultType="by-sku"
            defaultWeekStart={state.weekStart}
            defaultWeekEnd={state.weekEnd}
          />
        )}

        {/* Info Banner - Operating profit formula explanation */}
        <OperatingProfitInfoBanner />

        {/* Story 4.9: Filter Alert — sku-mode only (nm_id filter is sku-financials-scoped;
            the by-variant endpoint ignores nm_id, so the alert is meaningless there). */}
        {effectiveGroupBy === 'sku' && state.nmIdFilter && (
          <NmIdFilterAlert
            nmIdFilter={state.nmIdFilter}
            filteredProductName={state.filteredProductName}
            onClear={state.handleClearFilter}
          />
        )}

        {/* Period Label (multi-week mode) */}
        {state.isRangeMode && <PeriodLabel weekStart={state.weekStart} weekEnd={state.weekEnd} />}

        {/* FR-7 Phase 2: group-by toggle. Variant button disabled in range mode
            (by-variant endpoint is single-week only — title explains why). */}
        <SkuGroupByToggle
          groupBy={effectiveGroupBy}
          onGroupByChange={handleGroupByChange}
          isRangeMode={state.isRangeMode}
        />

        {/* Date Range Selection & Summary */}
        <SkuFilterSection
          weekStart={state.weekStart}
          weekEnd={state.weekEnd}
          onRangeChange={state.handleRangeChange}
          stats={stats}
        />

        {effectiveGroupBy === 'variant' ? (
          // Variant mode: render the single-week variant table. SKU-financials-scoped
          // sections (Cashflow) are hidden — they belong to the by-SKU flow.
          <SkuVariantSection week={state.weekEnd} />
        ) : (
          <>
            {/* Full Cashflow Card */}
            <SkuCashflowSection
              cabinetExpenses={state.cabinetExpenses}
              isLoading={state.isLoadingCabinetExpenses}
            />

            {/* SKU Financials Table + Help */}
            <SkuTableSection skuData={skuData} />
          </>
        )}
      </div>
    </RequireWbToken>
  )
}
