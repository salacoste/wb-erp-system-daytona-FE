'use client'

/**
 * Storage Analytics Page
 * Story 24.2-FE: Storage Analytics Page Layout
 * Story 24.9-FE: Multi-select Brand & Warehouse Filters
 * Story 24.10-FE: Chart Click-to-Filter Interaction
 * Epic 24: Paid Storage Analytics (Frontend)
 *
 * Sub-components: StoragePageTableSection (top consumers + SKU table)
 */

import { TrendingUp } from 'lucide-react'
import { StorageNoDataContent } from './components/StoragePageContent'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useStoragePageState } from './components/useStoragePageState'
import { StoragePageHeader } from './components/StoragePageHeader'
import { StorageFilters } from './components/StorageFilters'
import { StorageSummaryCards } from './components/StorageSummaryCards'
import { StorageTrendsChart } from './components/StorageTrendsChart'
import { StorageAlertBanner } from './components/StorageAlertBanner'
import { WeekFilterBadge } from './components/WeekFilterBadge'
import { StoragePageTableSection } from './components/StoragePageTableSection'
import { logger } from '@/lib/logger'

/**
 * Storage Analytics Page
 * Story 24.2-FE: Storage Analytics Page Layout
 * Story 24.9-FE: Multi-select Brand & Warehouse Filters
 * Story 24.10-FE: Chart Click-to-Filter Interaction
 * Epic 24: Paid Storage Analytics (Frontend)
 *
 * Main page for analyzing paid storage costs by SKU.
 * Click on chart week to filter tables to that week's data (Story 24.10).
 */
export default function StorageAnalyticsPage() {
  const {
    weekStart,
    weekEnd,
    selectedBrands,
    selectedWarehouses,
    selectedWeek,
    bySkuData,
    isLoadingBySku,
    bySkuError,
    topConsumersData,
    isLoadingTopConsumers,
    topConsumersError,
    filledTrendsData,
    trendsData,
    isLoadingTrends,
    trendsError,
    isLoadingUnfiltered,
    availableBrands,
    availableWarehouses,
    handleWeekRangeChange,
    handleWeekClick,
    handleClearWeekFilter,
    handleBrandsChange,
    handleWarehousesChange,
  } = useStoragePageState()

  // Error state
  if (bySkuError) {
    logger.error('Storage analytics error:', bySkuError)
    return (
      <div className="space-y-6">
        <StoragePageHeader />
        <Alert variant="destructive">
          <AlertDescription>
            Не удалось загрузить данные по расходам на хранение. Попробуйте выбрать другой период
            времени.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Check if data exists using the backend's has_data flag
  const hasData = bySkuData?.has_data ?? false

  // Show no data message for empty periods
  if (!hasData && !isLoadingBySku) {
    return (
      <div className="space-y-6">
        <StoragePageHeader />
        <StorageNoDataContent
          weekStart={weekStart}
          weekEnd={weekEnd}
          selectedBrands={selectedBrands}
          selectedWarehouses={selectedWarehouses}
          availableBrands={availableBrands}
          availableWarehouses={availableWarehouses}
          isLoadingOptions={isLoadingUnfiltered}
          onWeekRangeChange={handleWeekRangeChange}
          onBrandsChange={handleBrandsChange}
          onWarehousesChange={handleWarehousesChange}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header with Breadcrumbs */}
      <StoragePageHeader />

      {/* Filters Section - Story 24.9-FE */}
      <StorageFilters
        weekStart={weekStart}
        weekEnd={weekEnd}
        selectedBrands={selectedBrands}
        selectedWarehouses={selectedWarehouses}
        availableBrands={availableBrands}
        availableWarehouses={availableWarehouses}
        isLoadingOptions={isLoadingUnfiltered}
        onWeekRangeChange={handleWeekRangeChange}
        onBrandsChange={handleBrandsChange}
        onWarehousesChange={handleWarehousesChange}
      />

      {/* Summary Cards */}
      <StorageSummaryCards
        summary={bySkuData?.summary}
        period={bySkuData?.period}
        isLoading={isLoadingBySku}
      />

      {/* High Ratio Alert - Story 24.8-fe */}
      {topConsumersData?.top_consumers && (
        <StorageAlertBanner topConsumers={topConsumersData.top_consumers} />
      )}

      {/* Trends Chart Section - Story 24.5-fe, Story 24.10-fe */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              Динамика расходов на хранение
            </CardTitle>
            {/* Story 24.10: Show week filter badge when a week is selected */}
            {selectedWeek && (
              <WeekFilterBadge week={selectedWeek} onClear={handleClearWeekFilter} />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Story 169.12 (AC-2): recoverable per-section error — the trends
              section shows an Alert while all other sections retain their data. */}
          {trendsError ? (
            <Alert variant="destructive">
              <AlertDescription>
                Не удалось загрузить динамику расходов на хранение. Другие разделы страницы
                отображаются с актуальными данными.
              </AlertDescription>
            </Alert>
          ) : (
            <StorageTrendsChart
              data={filledTrendsData}
              summary={trendsData?.summary?.storage_cost}
              isLoading={isLoadingTrends}
              selectedWeek={selectedWeek}
              onWeekClick={handleWeekClick}
            />
          )}
        </CardContent>
      </Card>

      {/* Top Consumers + Storage by SKU Tables */}
      <StoragePageTableSection
        bySkuData={bySkuData}
        topConsumers={topConsumersData?.top_consumers}
        isLoadingBySku={isLoadingBySku}
        isLoadingTopConsumers={isLoadingTopConsumers}
        topConsumersError={topConsumersError}
      />
    </div>
  )
}
