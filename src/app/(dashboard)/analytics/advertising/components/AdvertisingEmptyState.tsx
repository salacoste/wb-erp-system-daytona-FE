'use client'

import { Megaphone } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ViewByMode } from '@/types/advertising-analytics'
import type { SyncStatusResponse } from '@/types/advertising-analytics'
import type { EfficiencyFilter } from './EfficiencyFilterDropdown'
import { AdvertisingPageHeader } from './AdvertisingPageHeader'
import { AdvertisingFilters } from './AdvertisingFilters'
import { CampaignSelector } from './CampaignSelector'
import { EfficiencyFilterDropdown } from './EfficiencyFilterDropdown'
import { SyncGapsTimeline } from './SyncGapsTimeline'

/** Helper: viewBy label for table title */
function viewByLabel(viewBy: ViewByMode): string {
  if (viewBy === 'sku') return 'товарам'
  if (viewBy === 'campaign') return 'кампаниям'
  if (viewBy === 'brand') return 'брендам'
  return 'категориям'
}

interface AdvertisingEmptyStateProps {
  dateRange: { from: string; to: string }
  viewBy: ViewByMode
  efficiencyFilter: EfficiencyFilter
  selectedCampaigns: number[]
  isLoading: boolean
  syncStatus: SyncStatusResponse | undefined
  onDateRangeChange: (from: string, to: string) => void
  onViewByChange: (view: ViewByMode) => void
  onCampaignFilterChange: (ids: number[]) => void
  onEfficiencyFilterChange: (filter: EfficiencyFilter) => void
}

/**
 * Empty state view for the advertising analytics page.
 * Shown when no data is available for the selected period.
 */
export function AdvertisingEmptyState({
  dateRange,
  viewBy,
  efficiencyFilter,
  selectedCampaigns,
  isLoading,
  syncStatus,
  onDateRangeChange,
  onViewByChange,
  onCampaignFilterChange,
  onEfficiencyFilterChange,
}: AdvertisingEmptyStateProps) {
  return (
    <div className="space-y-6">
      <AdvertisingPageHeader />

      {/* Still show filters for changing period */}
      <AdvertisingFilters
        dateRange={dateRange}
        onDateRangeChange={onDateRangeChange}
        viewBy={viewBy}
        onViewByChange={onViewByChange}
        dataAvailableFrom={syncStatus?.dataAvailableFrom}
        dataAvailableTo={syncStatus?.dataAvailableTo}
      />

      {/* Sync Gaps Timeline -- also in empty state to explain missing data */}
      <SyncGapsTimeline from={dateRange.from} to={dateRange.to} syncStatus={syncStatus} />

      <Card>
        {/* Show Campaign + Efficiency filters even in empty state */}
        <CardHeader className="flex flex-row items-end justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold pb-2">
            Детализация по {viewByLabel(viewBy)}
          </CardTitle>
          <div className="flex items-end gap-3">
            <CampaignSelector
              selectedIds={selectedCampaigns}
              onSelectionChange={onCampaignFilterChange}
              disabled={isLoading}
            />
            <EfficiencyFilterDropdown
              value={efficiencyFilter}
              onChange={onEfficiencyFilterChange}
              disabled={isLoading}
            />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold text-muted-foreground mb-2">
            Нет данных за выбранный период
          </h2>
          <p className="text-muted-foreground mb-4 max-w-md">
            Попробуйте выбрать другой период или проверьте, есть ли рекламные кампании
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
