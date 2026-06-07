'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { AdvertisingPageHeader } from './components/AdvertisingPageHeader'
import { AdvertisingFilters } from './components/AdvertisingFilters'
import { SyncGapsTimeline } from './components/SyncGapsTimeline'
import { EfficiencyAlertBanner } from './components/EfficiencyAlertBanner'
import { AdvertisingEmptyState } from './components/AdvertisingEmptyState'
import { ComparisonPeriodSelector } from '@/components/custom/ComparisonPeriodSelector'
import { AdvertisingMainContent } from './components/AdvertisingMainContent'
import { useAdvertisingPageState } from './components/useAdvertisingPageState'
import { useAdvertisingFilters } from './components/useAdvertisingFilters'
import { logger } from '@/lib/logger'

/**
 * Advertising Analytics Page
 * Story 33.2-FE: Advertising Analytics Page Layout
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
      <AdvertisingMainContent state={state} filters={filters} />
    </div>
  )
}
