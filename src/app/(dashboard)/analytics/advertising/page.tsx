'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { format, subDays, differenceInDays, parse } from 'date-fns'
import { Megaphone } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAdvertisingAnalytics } from '@/hooks/useAdvertisingAnalytics'
import type { ViewByMode, GroupByMode } from '@/types/advertising-analytics'
import { AdvertisingPageHeader } from './components/AdvertisingPageHeader'
import { AdvertisingFilters } from './components/AdvertisingFilters'
import { GroupByToggle } from './components/GroupByToggle'
import { AdvertisingSummaryCards } from './components/AdvertisingSummaryCards'
import {
  PerformanceMetricsTable,
  type SortField,
  type SortOrder,
} from './components/PerformanceMetricsTable'
import {
  EfficiencyFilterDropdown,
  type EfficiencyFilter,
} from './components/EfficiencyFilterDropdown'
import { EfficiencyAlertBanner } from './components/EfficiencyAlertBanner'
import { CampaignSelector } from './components/CampaignSelector'
import { MergedGroupTable } from './components/MergedGroupTable'
import { features } from '@/config/features'
// Story 37.1: Real API integration (Request #88)
import { transformMergedGroups } from '@/lib/transformers/advertising-transformers'
// Story 37.5: Analytics tracking (Epic 37 QA Phase 2)
import {
  trackAdvertisingPageView,
  trackToggleMode,
  trackTableSort,
  trackRowClick,
} from '@/lib/analytics-events'

/** Page size for table pagination (AC5) */
const PAGE_SIZE = 25

/** Max allowed date range in days */
const MAX_RANGE_DAYS = 90

/**
 * Advertising Analytics Page
 * Story 33.2-FE: Advertising Analytics Page Layout
 * Story 33.3-FE: Performance Metrics Table
 * Epic 33: Advertising Analytics (Frontend)
 *
 * Main page for analyzing advertising performance metrics.
 * Default period: 14 days (PO decision).
 * Default view: SKU.
 * Default sort: Spend desc (highest spenders first).
 */
export default function AdvertisingAnalyticsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Default date range: last 14 days (PO decision)
  const defaultFromDate = useMemo(() => {
    return format(subDays(new Date(), 14), 'yyyy-MM-dd')
  }, [])

  const defaultToDate = useMemo(() => {
    // Yesterday (to account for sync delay)
    return format(subDays(new Date(), 1), 'yyyy-MM-dd')
  }, [])

  // Initialize state from URL params or defaults with auto-correction
  const [dateRange, setDateRange] = useState(() => {
    const fromParam = searchParams.get('from') || defaultFromDate
    const toParam = searchParams.get('to') || defaultToDate

    // Auto-correct if range exceeds 90 days (keep most recent 90 days from 'to')
    const fromDate = parse(fromParam, 'yyyy-MM-dd', new Date())
    const toDate = parse(toParam, 'yyyy-MM-dd', new Date())
    const daysDiff = differenceInDays(toDate, fromDate)

    if (daysDiff > MAX_RANGE_DAYS) {
      // Keep the most recent 90 days from 'to' date
      const correctedFrom = format(subDays(toDate, MAX_RANGE_DAYS), 'yyyy-MM-dd')
      return { from: correctedFrom, to: toParam }
    }

    return { from: fromParam, to: toParam }
  })

  const [viewBy, setViewBy] = useState<ViewByMode>(() =>
    (searchParams.get('view') as ViewByMode) || 'sku'
  )

  // Epic 36: Product Card Linking - groupBy state
  const [groupBy, setGroupBy] = useState<GroupByMode>(() =>
    (searchParams.get('group_by') as GroupByMode) || 'sku'
  )

  // Sorting state (AC3: default Spend desc)
  const [sortBy, setSortBy] = useState<SortField>(() =>
    (searchParams.get('sort') as SortField) || 'spend'
  )
  const [sortOrder, setSortOrder] = useState<SortOrder>(() =>
    (searchParams.get('order') as SortOrder) || 'desc'
  )

  // Filter state (AC4)
  const [efficiencyFilter, setEfficiencyFilter] = useState<EfficiencyFilter>(() =>
    (searchParams.get('status') as EfficiencyFilter) || 'all'
  )

  // Pagination state (AC5)
  const [page, setPage] = useState(() => {
    const pageParam = searchParams.get('page')
    return pageParam ? parseInt(pageParam, 10) : 1
  })

  // Campaign filter state (Story 33.5-fe AC4)
  const [selectedCampaigns, setSelectedCampaigns] = useState<number[]>(() => {
    const campaignsParam = searchParams.get('campaigns')
    if (!campaignsParam) return []
    return campaignsParam.split(',').map(Number).filter((n) => !isNaN(n))
  })

  // Fetch advertising analytics data
  const { data, isLoading, error, refetch } = useAdvertisingAnalytics({
    from: dateRange.from,
    to: dateRange.to,
    view_by: viewBy,
    group_by: groupBy, // Epic 36: Add grouping mode
    sort_by: sortBy,
    sort_order: sortOrder,
    efficiency_filter: efficiencyFilter === 'all' ? undefined : efficiencyFilter,
    campaign_ids: selectedCampaigns.length > 0 ? selectedCampaigns : undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  })

  // Sync state to URL params
  const updateUrlParams = useCallback(() => {
    const params = new URLSearchParams()
    params.set('from', dateRange.from)
    params.set('to', dateRange.to)
    params.set('view', viewBy)
    params.set('group_by', groupBy) // Epic 36: Add grouping mode to URL
    params.set('sort', sortBy)
    params.set('order', sortOrder)
    if (efficiencyFilter !== 'all') {
      params.set('status', efficiencyFilter)
    }
    if (page > 1) {
      params.set('page', page.toString())
    }
    // Note: Keep URL param as 'campaigns' (singular, comma-separated) for readability
    // API uses 'campaign_ids' (array) internally - conversion happens in useAdvertisingAnalytics
    if (selectedCampaigns.length > 0) {
      params.set('campaigns', selectedCampaigns.join(','))
    }
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [router, dateRange, viewBy, groupBy, sortBy, sortOrder, efficiencyFilter, page, selectedCampaigns])

  // Update URL when state changes
  useEffect(() => {
    updateUrlParams()
  }, [updateUrlParams])

  // Story 37.5: Track page view on initial load and groupBy changes
  useEffect(() => {
    trackAdvertisingPageView(groupBy)
  }, [groupBy])

  // Handle filter changes
  const handleDateRangeChange = (from: string, to: string) => {
    setDateRange({ from, to })
    setPage(1) // Reset to first page
  }

  const handleViewByChange = (view: ViewByMode) => {
    setViewBy(view)
    setPage(1) // Reset to first page
  }

  // Handle sort change (AC3)
  const handleSortChange = (field: SortField) => {
    const newOrder = sortBy === field ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'desc'

    // Story 37.5: Track table sort
    trackTableSort({
      column: field,
      direction: newOrder,
      viewMode: groupBy,
    })

    if (sortBy === field) {
      // Toggle order
      setSortOrder(newOrder)
    } else {
      // New field, default to descending
      setSortBy(field)
      setSortOrder('desc')
    }
    setPage(1) // Reset to first page
  }

  // Handle filter change (AC4)
  const handleEfficiencyFilterChange = (filter: EfficiencyFilter) => {
    setEfficiencyFilter(filter)
    setPage(1) // Reset to first page
  }

  // Handle campaign filter change (Story 33.5-fe AC4)
  const handleCampaignFilterChange = (campaignIds: number[]) => {
    console.log('[AdvertisingPage] handleCampaignFilterChange called:', {
      oldCampaigns: selectedCampaigns,
      newCampaigns: campaignIds,
      stackTrace: new Error().stack
    })
    setSelectedCampaigns(campaignIds)
    setPage(1) // Reset to first page
  }

  // Handle pagination (AC5)
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  // Epic 37: Handle product click in merged group table
  const handleProductClick = (nmId: number, groupId?: number | null, isMainProduct?: boolean) => {
    // Story 37.5: Track row click
    trackRowClick({
      nmId,
      groupId: groupId ?? null,
      isMainProduct: isMainProduct ?? false,
      viewMode: groupBy,
    })

    if (features.epic37MergedGroups.debug) {
      console.log('[Epic 37] Product clicked:', nmId)
    }
    // TODO: Implement product detail view or action
  }

  // Story 37.5: Handle groupBy change with analytics tracking
  const handleGroupByChange = (newMode: GroupByMode) => {
    trackToggleMode({
      mode: newMode,
      previousMode: groupBy,
    })
    setGroupBy(newMode)
  }

  // Epic 37: Get merged groups data (mock or real API)
  // Story 37.1: Transform real API response to AdvertisingGroup[] (Request #88)
  const mergedGroupsData = useMemo(() => {
    if (!features.epic37MergedGroups.enabled || groupBy !== 'imtId') {
      return []
    }

    // Story 37.1: Use real API data from backend (Request #88)
    if (!data?.data) {
      return []
    }

    // Transform backend response to frontend AdvertisingGroup[] type
    const transformed = transformMergedGroups(data.data)

    if (features.epic37MergedGroups.debug) {
      console.log('[Epic 37] Loaded from API:', transformed.length, 'groups')
    }

    return transformed
  }, [groupBy, data])

  // Check if data exists (for summary)
  const hasData = data?.data && data.data.length > 0

  // Calculate total count for pagination
  // Note: Backend should return total_count in response, using data length as fallback
  const totalCount = data?.data?.length ?? 0

  // Count loss items for alert banner (Story 33.4-fe AC4)
  // IMPORTANT: Must be called before any early returns to comply with React hooks rules
  const lossCount = useMemo(() => {
    if (!data?.data) return 0
    return data.data.filter((item) => item.efficiency_status === 'loss').length
  }, [data?.data])

  // Error state
  if (error) {
    console.error('Advertising analytics error:', error)
    return (
      <div className="space-y-6">
        <AdvertisingPageHeader />
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>Не удалось загрузить данные рекламной аналитики. Попробуйте позже.</span>
            <button
              onClick={() => refetch()}
              className="text-sm underline hover:no-underline ml-4"
            >
              Повторить
            </button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Empty state (only show when not loading and no data at all)
  if (!hasData && !isLoading && page === 1 && efficiencyFilter === 'all') {
    return (
      <div className="space-y-6">
        <AdvertisingPageHeader />

        {/* Still show filters for changing period */}
        <AdvertisingFilters
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
          viewBy={viewBy}
          onViewByChange={handleViewByChange}
        />

        <Card>
          {/* Show Campaign + Efficiency filters even in empty state */}
          <CardHeader className="flex flex-row items-end justify-between space-y-0 pb-4">
            <CardTitle className="text-lg font-semibold pb-2">
              Детализация по {viewBy === 'sku' ? 'товарам' : viewBy === 'campaign' ? 'кампаниям' : viewBy === 'brand' ? 'брендам' : 'категориям'}
            </CardTitle>
            <div className="flex items-end gap-3">
              <CampaignSelector
                selectedIds={selectedCampaigns}
                onSelectionChange={handleCampaignFilterChange}
                disabled={isLoading}
              />
              <EfficiencyFilterDropdown
                value={efficiencyFilter}
                onChange={handleEfficiencyFilterChange}
                disabled={isLoading}
              />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              Нет данных за выбранный период
            </h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              Попробуйте выбрать другой период или проверьте, есть ли рекламные кампании
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header with Breadcrumbs */}
      <AdvertisingPageHeader />

      {/* Filters: Date Range + View Mode Toggle */}
      <AdvertisingFilters
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        viewBy={viewBy}
        onViewByChange={handleViewByChange}
      />

      {/* Loss Alert Banner (Story 33.4-fe AC4) */}
      <EfficiencyAlertBanner
        lossCount={lossCount}
        currentParams={{
          from: dateRange.from,
          to: dateRange.to,
          view: viewBy,
          sort: sortBy,
          order: sortOrder,
        }}
      />

      {/* Summary Cards: Spend, ROAS, ROI, Active Campaigns */}
      <AdvertisingSummaryCards
        summary={data?.summary}
        isLoading={isLoading}
      />

      {/* Epic 36: Group By Toggle (separate row above table per PO decision) */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Группировка
        </h3>
        <GroupByToggle
          groupBy={groupBy}
          onGroupByChange={handleGroupByChange}
        />
      </div>

      {/* Performance Metrics Table (Story 33.3-fe) */}
      <Card>
        <CardHeader className="flex flex-row items-end justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold pb-2">
            Детализация по {viewBy === 'sku' ? 'товарам' : viewBy === 'campaign' ? 'кампаниям' : viewBy === 'brand' ? 'брендам' : 'категориям'}
          </CardTitle>
          {/* Filters: Campaign + Efficiency (Story 33.5-fe) */}
          <div className="flex items-end gap-3">
            <CampaignSelector
              selectedIds={selectedCampaigns}
              onSelectionChange={handleCampaignFilterChange}
              disabled={isLoading}
            />
            <EfficiencyFilterDropdown
              value={efficiencyFilter}
              onChange={handleEfficiencyFilterChange}
              disabled={isLoading}
            />
          </div>
        </CardHeader>
        <CardContent>
          {/* Epic 37: Conditional rendering based on groupBy mode */}
          {features.epic37MergedGroups.enabled && groupBy === 'imtId' ? (
            <MergedGroupTable
              groups={mergedGroupsData}
              sortConfig={{ field: sortBy as 'totalSales' | 'totalRevenue' | 'organicSales' | 'totalSpend' | 'roas', direction: sortOrder }}
              onSort={(field) => handleSortChange(field as SortField)}
              onProductClick={handleProductClick}
            />
          ) : (
            <PerformanceMetricsTable
              data={data?.data ?? []}
              viewBy={viewBy}
              isLoading={isLoading}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={handleSortChange}
              page={page}
              pageSize={PAGE_SIZE}
              totalCount={totalCount}
              onPageChange={handlePageChange}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
