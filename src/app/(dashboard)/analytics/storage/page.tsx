'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { TrendingUp, Trophy, List } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getLastCompletedWeek } from '@/lib/margin-helpers'
import { formatIsoWeek } from '@/lib/utils'
import { fillMissingWeeks } from '@/lib/analytics-utils'
import {
  useStorageBySku,
  useStorageTopConsumers,
  useStorageTrends,
} from '@/hooks/useStorageAnalytics'
import { StoragePageHeader } from './components/StoragePageHeader'
import { StorageFilters } from './components/StorageFilters'
import { StorageSummaryCards } from './components/StorageSummaryCards'
import { StorageBySkuTable } from './components/StorageBySkuTable'
import { TopConsumersWidget } from './components/TopConsumersWidget'
import { StorageTrendsChart } from './components/StorageTrendsChart'
import { StorageAlertBanner } from './components/StorageAlertBanner'
import { WeekFilterBadge } from './components/WeekFilterBadge'

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
  const router = useRouter()
  const searchParams = useSearchParams()

  // Calculate default week range (last 4 weeks)
  const lastCompletedWeek = getLastCompletedWeek()
  const defaultFourWeeksAgo = useMemo(() => {
    const date = new Date()
    date.setDate(date.getDate() - 28)
    return formatIsoWeek(date)
  }, [])

  // Initialize state from URL params or defaults - Story 24.9-FE AC3
  const [weekStart, setWeekStart] = useState(() =>
    searchParams.get('weekStart') || defaultFourWeeksAgo
  )
  const [weekEnd, setWeekEnd] = useState(() =>
    searchParams.get('weekEnd') || lastCompletedWeek
  )
  const [selectedBrands, setSelectedBrands] = useState<string[]>(() => {
    const brands = searchParams.get('brands')
    return brands ? brands.split(',').filter(Boolean) : []
  })
  const [selectedWarehouses, setSelectedWarehouses] = useState<string[]>(() => {
    const warehouses = searchParams.get('warehouses')
    return warehouses ? warehouses.split(',').filter(Boolean) : []
  })

  // Story 24.10: Selected week for click-to-filter interaction
  const [selectedWeek, setSelectedWeek] = useState<string | null>(() => {
    return searchParams.get('week') || null
  })

  // Story 24.10: Compute effective week range for filtered hooks
  // When a specific week is selected from the chart, use that week for table/widget filtering
  const effectiveWeekStart = selectedWeek || weekStart
  const effectiveWeekEnd = selectedWeek || weekEnd

  // Fetch unfiltered data to get available filter options
  // This ensures we always have the full list of brands/warehouses
  // Note: Backend max limit is 200 (SEC-001). For large catalogs, consider dedicated /filter-options endpoint
  const {
    data: unfilteredData,
    isLoading: isLoadingUnfiltered,
  } = useStorageBySku(weekStart, weekEnd, {
    limit: 200, // Backend max limit is 200
  })

  // Fetch filtered storage data for display
  // Story 24.10: Use effectiveWeekStart/End to filter by selected week
  const {
    data: bySkuData,
    isLoading: isLoadingBySku,
    error: bySkuError,
  } = useStorageBySku(effectiveWeekStart, effectiveWeekEnd, {
    brand: selectedBrands.length > 0 ? selectedBrands.join(',') : undefined,
    warehouse: selectedWarehouses.length > 0 ? selectedWarehouses.join(',') : undefined,
    limit: 20,
  })

  // Story 24.9: Pass brand/warehouse filters to top consumers API
  // Story 24.10: Use effectiveWeekStart/End to filter by selected week
  const {
    data: topConsumersData,
    isLoading: isLoadingTopConsumers,
  } = useStorageTopConsumers(effectiveWeekStart, effectiveWeekEnd, {
    limit: 5,
    include_revenue: true,
    brand: selectedBrands.length > 0 ? selectedBrands.join(',') : undefined,
    warehouse: selectedWarehouses.length > 0 ? selectedWarehouses.join(',') : undefined,
  })

  // Story 24.9: Pass brand/warehouse filters to trends API
  const {
    data: trendsData,
    isLoading: isLoadingTrends,
  } = useStorageTrends(weekStart, weekEnd, {
    metrics: ['storage_cost'],
    brand: selectedBrands.length > 0 ? selectedBrands.join(',') : undefined,
    warehouse: selectedWarehouses.length > 0 ? selectedWarehouses.join(',') : undefined,
  })

  // Extract unique brands and warehouses from unfiltered data - Story 24.9-FE
  const availableBrands = useMemo(() => {
    if (!unfilteredData?.data) return []
    const brands = unfilteredData.data
      .map(item => item.brand)
      .filter((brand): brand is string => brand !== null && brand !== undefined)
    return [...new Set(brands)].sort()
  }, [unfilteredData])

  const availableWarehouses = useMemo(() => {
    if (!unfilteredData?.data) return []
    const warehouses = unfilteredData.data
      .flatMap(item => item.warehouses || [])
      .filter(Boolean)
    return [...new Set(warehouses)].sort()
  }, [unfilteredData])

  // Fill missing weeks in trends data to show complete range on chart
  // This ensures the chart displays all weeks in the selected range,
  // even if backend returns data only for weeks with actual storage costs
  const filledTrendsData = useMemo(() => {
    // Story 24.9: Debug logging for filter troubleshooting
    console.log('[Storage Page] trendsData:', {
      hasData: trendsData?.has_data,
      dataLength: trendsData?.data?.length,
      data: trendsData?.data,
      period: trendsData?.period,
    })

    if (!trendsData?.data || trendsData.data.length === 0) return []
    return fillMissingWeeks(trendsData.data, weekStart, weekEnd)
  }, [trendsData?.data, weekStart, weekEnd])

  // Sync state to URL params - Story 24.9-FE AC3, Story 24.10-FE
  const updateUrlParams = useCallback((
    newWeekStart: string,
    newWeekEnd: string,
    newBrands: string[],
    newWarehouses: string[],
    newSelectedWeek: string | null
  ) => {
    const params = new URLSearchParams()
    params.set('weekStart', newWeekStart)
    params.set('weekEnd', newWeekEnd)
    if (newBrands.length > 0) {
      params.set('brands', newBrands.join(','))
    }
    if (newWarehouses.length > 0) {
      params.set('warehouses', newWarehouses.join(','))
    }
    // Story 24.10: Add selected week to URL
    if (newSelectedWeek) {
      params.set('week', newSelectedWeek)
    }
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [router])

  // Update URL when filters change
  useEffect(() => {
    updateUrlParams(weekStart, weekEnd, selectedBrands, selectedWarehouses, selectedWeek)
  }, [weekStart, weekEnd, selectedBrands, selectedWarehouses, selectedWeek, updateUrlParams])

  // Handle filter changes
  const handleWeekRangeChange = (start: string, end: string) => {
    setWeekStart(start)
    setWeekEnd(end)
    // Story 24.10 AC4: Clear week filter when week range changes
    setSelectedWeek(null)
    // Note: brand/warehouse reset happens in StorageFilters component
  }

  // Story 24.10: Handle week click in trends chart
  const handleWeekClick = (week: string) => {
    // Toggle selection: click same week to deselect (AC4)
    setSelectedWeek(prev => prev === week ? null : week)
  }

  // Story 24.10: Clear week filter
  const handleClearWeekFilter = () => {
    setSelectedWeek(null)
  }

  const handleBrandsChange = (brands: string[]) => {
    setSelectedBrands(brands)
  }

  const handleWarehousesChange = (warehouses: string[]) => {
    setSelectedWarehouses(warehouses)
  }

  // Error state
  if (bySkuError) {
    console.error('Storage analytics error:', bySkuError)
    return (
      <div className="space-y-6">
        <StoragePageHeader />
        <Alert variant="destructive">
          <AlertDescription>
            Не удалось загрузить данные по расходам на хранение. Попробуйте выбрать другой период времени.
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

        {/* Filters Section - still show filters even when no data */}
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

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              Нет данных за выбранный период
            </h3>
            <p className="text-muted-foreground mb-4">
              По периоду с {weekStart} по {weekEnd} отсутствуют данные о расходах на хранение.
            </p>
            <p className="text-sm text-muted-foreground">
              Попробуйте выбрать другой период времени или загрузите данные через импорт WB API.
            </p>
          </CardContent>
        </Card>
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
          <StorageTrendsChart
            data={filledTrendsData}
            summary={trendsData?.summary?.storage_cost}
            isLoading={isLoadingTrends}
            selectedWeek={selectedWeek}
            onWeekClick={handleWeekClick}
          />
        </CardContent>
      </Card>

      {/* Top Consumers Section - Story 24.4-fe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-muted-foreground" />
            Топ-5 по расходам на хранение
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TopConsumersWidget
            data={topConsumersData?.top_consumers ?? []}
            isLoading={isLoadingTopConsumers}
          />
        </CardContent>
      </Card>

      {/* Storage by SKU Table - Story 24.3-fe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <List className="h-5 w-5 text-muted-foreground" />
            Все товары
            {bySkuData?.pagination?.total && (
              <span className="text-sm font-normal text-muted-foreground">
                ({bySkuData.pagination.total})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StorageBySkuTable
            data={bySkuData?.data ?? []}
            isLoading={isLoadingBySku}
          />
        </CardContent>
      </Card>
    </div>
  )
}
