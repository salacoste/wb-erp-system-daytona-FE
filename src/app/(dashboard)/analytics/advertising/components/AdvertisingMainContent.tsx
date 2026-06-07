'use client'

/**
 * AdvertisingMainContent — renders the full advertising analytics layout when data is present.
 * Extracted from page.tsx for file-size compliance (203 → ~150 lines).
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { SortField } from './PerformanceMetricsTable'
import { GroupByToggle } from './GroupByToggle'
import { AdvertisingSummaryCards } from './AdvertisingSummaryCards'
import { PerformanceMetricsTable } from './PerformanceMetricsTable'
import { EfficiencyFilterDropdown } from './EfficiencyFilterDropdown'
import { CampaignSelector } from './CampaignSelector'
import { MergedGroupTable } from './MergedGroupTable'
import { DailyTrendChart } from './DailyTrendChart'
import { MultiCampaignWarningBanner } from './MultiCampaignWarningBanner'
import { AdCostDiscrepancySection } from './AdCostDiscrepancySection'
import { OverAttributionBanner } from './OverAttributionBanner'
import { features } from '@/config/features'
import { PAGE_SIZE } from './useAdvertisingPageState'
import type { useAdvertisingFilters } from './useAdvertisingFilters'

/** Helper: viewBy label for table title */
function viewByLabel(viewBy: string): string {
  if (viewBy === 'sku') return 'товарам'
  if (viewBy === 'campaign') return 'кампаниям'
  if (viewBy === 'brand') return 'брендам'
  return 'категориям'
}

interface AdvertisingMainContentProps {
  state: ReturnType<typeof import('./useAdvertisingPageState').useAdvertisingPageState>
  filters: ReturnType<typeof useAdvertisingFilters>
}

export function AdvertisingMainContent({ state, filters }: AdvertisingMainContentProps) {
  return (
    <>
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
    </>
  )
}
