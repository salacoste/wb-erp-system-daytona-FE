'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { SortField } from './components/PerformanceMetricsTable'
import { AdvertisingPageHeader } from './components/AdvertisingPageHeader'
import { AdvertisingFilters } from './components/AdvertisingFilters'
import { GroupByToggle } from './components/GroupByToggle'
import { AdvertisingSummaryCards } from './components/AdvertisingSummaryCards'
import { PerformanceMetricsTable } from './components/PerformanceMetricsTable'
import { EfficiencyFilterDropdown } from './components/EfficiencyFilterDropdown'
import { EfficiencyAlertBanner } from './components/EfficiencyAlertBanner'
import { CampaignSelector } from './components/CampaignSelector'
import { MergedGroupTable } from './components/MergedGroupTable'
import { DailyTrendChart } from './components/DailyTrendChart'
import { MultiCampaignWarningBanner } from './components/MultiCampaignWarningBanner'
import { SyncGapsTimeline } from './components/SyncGapsTimeline'
import { OverAttributionBanner } from './components/OverAttributionBanner'
import { AdCostDiscrepancySection } from './components/AdCostDiscrepancySection'
import { AdvertisingEmptyState } from './components/AdvertisingEmptyState'
import { ComparisonPeriodSelector } from '@/components/custom/ComparisonPeriodSelector'
import { features } from '@/config/features'
import { useAdvertisingPageState, PAGE_SIZE } from './components/useAdvertisingPageState'
import { useAdvertisingFilters } from './components/useAdvertisingFilters'
import { logger } from '@/lib/logger'

/** Helper: viewBy label for table title */
function viewByLabel(viewBy: string): string {
  if (viewBy === 'sku') return 'товарам'
  if (viewBy === 'campaign') return 'кампаниям'
  if (viewBy === 'brand') return 'брендам'
  return 'категориям'
}

/**
 * Advertising Analytics Page
 * Story 33.2-FE: Advertising Analytics Page Layout
 * Story 33.3-FE: Performance Metrics Table
 * Epic 33: Advertising Analytics (Frontend)
 *
 * Main page for analyzing advertising performance metrics.
 * Default period: 14 days (PO decision).
 * Default view: SKU. Default sort: Spend desc.
 */
export default function AdvertisingAnalyticsPage() {
  const state = useAdvertisingPageState()
  const filters = useAdvertisingFilters(state.data, state.hideOverAttribution, state.groupBy)

  if (state.error) {
    logger.error('Advertising analytics error:', state.error)
    return (
      <div className="space-y-6">
        <AdvertisingPageHeader />
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>Не удалось загрузить данные рекламной аналитики. Попробуйте позже.</span>
            <button
              onClick={() => state.refetch()}
              className="text-sm underline hover:no-underline ml-4"
            >
              Повторить
            </button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (
    !filters.hasData &&
    !state.isLoading &&
    state.page === 1 &&
    state.efficiencyFilter === 'all'
  ) {
    return (
      <AdvertisingEmptyState
        dateRange={state.dateRange}
        viewBy={state.viewBy}
        efficiencyFilter={state.efficiencyFilter}
        selectedCampaigns={state.selectedCampaigns}
        isLoading={state.isLoading}
        syncStatus={state.syncStatus}
        onDateRangeChange={state.handleDateRangeChange}
        onViewByChange={state.handleViewByChange}
        onCampaignFilterChange={state.handleCampaignFilterChange}
        onEfficiencyFilterChange={state.handleEfficiencyFilterChange}
      />
    )
  }

  return (
    <div className="space-y-6">
      <AdvertisingPageHeader />
      <AdvertisingFilters
        dateRange={state.dateRange}
        onDateRangeChange={state.handleDateRangeChange}
        viewBy={state.viewBy}
        onViewByChange={state.handleViewByChange}
      />
      <SyncGapsTimeline
        from={state.dateRange.from}
        to={state.dateRange.to}
        syncStatus={state.syncStatus}
      />
      <EfficiencyAlertBanner
        lossCount={filters.lossCount}
        currentParams={{
          from: state.dateRange.from,
          to: state.dateRange.to,
          view: state.viewBy,
          sort: state.sortBy,
          order: state.sortOrder,
        }}
      />
      <ComparisonPeriodSelector
        enabled={state.comparisonEnabled}
        onEnabledChange={state.setComparisonEnabled}
        preset={state.comparisonPreset}
        onPresetChange={state.setComparisonPreset}
        compareStart={state.compareStart}
        compareEnd={state.compareEnd}
        onCompareRangeChange={state.handleCompareRangeChange}
        currentPeriodStart={state.dateRange.from}
        currentPeriodEnd={state.dateRange.to}
      />
      <AdvertisingSummaryCards
        summary={filters.filteredSummary}
        isLoading={state.isLoading}
        deltas={state.deltas}
      />
      <DailyTrendChart data={state.data?.daily ?? []} isLoading={state.isLoading} />
      <AdCostDiscrepancySection
        platformSpend={filters.filteredSummary?.total_spend ?? null}
        isLoading={state.isLoading}
      />
      <OverAttributionBanner
        count={filters.overAttributionCount}
        filterActive={state.hideOverAttribution}
        onFilterChange={state.setHideOverAttribution}
      />
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Группировка</h3>
        <GroupByToggle groupBy={state.groupBy} onGroupByChange={state.handleGroupByChange} />
      </div>
      <Card>
        <CardHeader className="flex flex-row items-end justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold pb-2">
            Детализация по {viewByLabel(state.viewBy)}
          </CardTitle>
          <div className="flex items-end gap-3">
            <CampaignSelector
              selectedIds={state.selectedCampaigns}
              onSelectionChange={state.handleCampaignFilterChange}
              disabled={state.isLoading}
            />
            <EfficiencyFilterDropdown
              value={state.efficiencyFilter}
              onChange={state.handleEfficiencyFilterChange}
              disabled={state.isLoading}
            />
          </div>
        </CardHeader>
        <CardContent>
          {features.epic37MergedGroups.enabled && state.groupBy === 'imtId' ? (
            <MergedGroupTable
              groups={filters.mergedGroupsData}
              sortConfig={{
                field: state.sortBy as
                  | 'totalSales'
                  | 'totalRevenue'
                  | 'organicSales'
                  | 'totalSpend'
                  | 'roas',
                direction: state.sortOrder,
              }}
              onSort={field => state.handleSortChange(field as SortField)}
              onProductClick={state.handleProductClick}
            />
          ) : (
            <div className="space-y-3">
              <MultiCampaignWarningBanner
                warningCount={state.data?.multiCampaignSkuWarnings?.length ?? 0}
              />
              <PerformanceMetricsTable
                data={filters.filteredData}
                viewBy={state.viewBy}
                isLoading={state.isLoading}
                sortBy={state.sortBy}
                sortOrder={state.sortOrder}
                onSortChange={state.handleSortChange}
                page={state.page}
                pageSize={PAGE_SIZE}
                totalCount={filters.totalCount}
                onPageChange={state.handlePageChange}
                multiCampaignSkuWarnings={state.data?.multiCampaignSkuWarnings}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
