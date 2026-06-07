'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { format, subDays, differenceInDays, parse } from 'date-fns'
import { useAdvertisingAnalytics, useAdvertisingSyncStatus } from '@/hooks/useAdvertisingAnalytics'
import type { ViewByMode, GroupByMode } from '@/types/advertising-analytics'
import type { SortField, SortOrder } from './PerformanceMetricsTable'
import type { EfficiencyFilter } from './EfficiencyFilterDropdown'
import { trackAdvertisingPageView } from '@/lib/analytics-events'
import { buildAdvertisingHandlers } from './useAdvertisingHandlers'
import { useAdvertisingComparison } from './useAdvertisingComparison'
import {
  MAX_RANGE_DAYS,
  validViews,
  validGroupBys,
  validSortFields,
  validSortOrders,
  validEfficiencyFilters,
  parseCampaignIds,
  validateParam,
} from './advertising-page-state-helpers'

/** Page size for table pagination (AC5) */
export const PAGE_SIZE = 25

/** Advertising page state hook. Story 33.2-FE, Story 33.3-FE, Epic 33 (Frontend) */
export function useAdvertisingPageState() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Default date range: last 14 days (PO decision)
  const defaultFromDate = useMemo(() => format(subDays(new Date(), 14), 'yyyy-MM-dd'), [])
  const defaultToDate = useMemo(() => format(subDays(new Date(), 1), 'yyyy-MM-dd'), [])

  // Initialize state from URL params or defaults with auto-correction
  const [dateRange, setDateRange] = useState(() => {
    const fromParam = searchParams.get('from') || defaultFromDate
    const toParam = searchParams.get('to') || defaultToDate
    const fromDate = parse(fromParam, 'yyyy-MM-dd', new Date())
    const toDate = parse(toParam, 'yyyy-MM-dd', new Date())
    if (differenceInDays(toDate, fromDate) > MAX_RANGE_DAYS) {
      return { from: format(subDays(toDate, MAX_RANGE_DAYS), 'yyyy-MM-dd'), to: toParam }
    }
    return { from: fromParam, to: toParam }
  })

  const [viewBy, setViewBy] = useState<ViewByMode>(() =>
    validateParam(searchParams.get('view'), validViews, 'sku')
  )
  const [groupBy, setGroupBy] = useState<GroupByMode>(() =>
    validateParam(searchParams.get('group_by'), validGroupBys, 'sku')
  )
  const [sortBy, setSortBy] = useState<SortField>(() =>
    validateParam(searchParams.get('sort'), validSortFields, 'spend')
  )
  const [sortOrder, setSortOrder] = useState<SortOrder>(() =>
    validateParam(searchParams.get('order'), validSortOrders, 'desc')
  )
  const [efficiencyFilter, setEfficiencyFilter] = useState<EfficiencyFilter>(() =>
    validateParam(searchParams.get('status'), validEfficiencyFilters, 'all')
  )
  const [page, setPage] = useState(() => {
    const p = searchParams.get('page')
    return p ? parseInt(p, 10) : 1
  })
  const [selectedCampaigns, setSelectedCampaigns] = useState<number[]>(() =>
    parseCampaignIds(searchParams.get('campaigns'))
  )
  const [hideOverAttribution, setHideOverAttribution] = useState(false)
  const [comparisonEnabled, setComparisonEnabled] = useState(false)

  // Data fetching
  const { data: syncStatus } = useAdvertisingSyncStatus({ refetchInterval: 0 })
  const { data, isLoading, error, refetch } = useAdvertisingAnalytics({
    from: dateRange.from,
    to: dateRange.to,
    view_by: viewBy,
    group_by: groupBy,
    sort_by: sortBy,
    sort_order: sortOrder,
    efficiency_filter: efficiencyFilter === 'all' ? undefined : efficiencyFilter,
    campaign_ids: selectedCampaigns.length > 0 ? selectedCampaigns : undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
    include_daily: true,
  })

  // Comparison period — Story 127.3-FE (extracted to useAdvertisingComparison)
  const comparison = useAdvertisingComparison(
    comparisonEnabled,
    dateRange.from,
    dateRange.to,
    viewBy,
    groupBy,
    data?.summary
  )

  // Sync state to URL params
  const updateUrlParams = useCallback(() => {
    const p = new URLSearchParams()
    p.set('from', dateRange.from)
    p.set('to', dateRange.to)
    p.set('view', viewBy)
    p.set('group_by', groupBy)
    p.set('sort', sortBy)
    p.set('order', sortOrder)
    if (efficiencyFilter !== 'all') p.set('status', efficiencyFilter)
    if (page > 1) p.set('page', page.toString())
    if (selectedCampaigns.length > 0) p.set('campaigns', selectedCampaigns.join(','))
    router.replace(`?${p.toString()}`, { scroll: false })
  }, [
    router,
    dateRange,
    viewBy,
    groupBy,
    sortBy,
    sortOrder,
    efficiencyFilter,
    page,
    selectedCampaigns,
  ])

  useEffect(() => {
    updateUrlParams()
  }, [updateUrlParams])
  useEffect(() => {
    trackAdvertisingPageView(groupBy)
  }, [groupBy])

  // Build handlers from setters (extracted to useAdvertisingHandlers.ts)
  const handlers = buildAdvertisingHandlers({
    setDateRange,
    setViewBy,
    setGroupBy,
    setSortBy,
    setSortOrder,
    setEfficiencyFilter,
    setPage,
    setSelectedCampaigns,
    sortBy,
    sortOrder,
    groupBy,
  })

  return {
    dateRange,
    viewBy,
    groupBy,
    sortBy,
    sortOrder,
    efficiencyFilter,
    page,
    selectedCampaigns,
    hideOverAttribution,
    setHideOverAttribution,
    comparisonEnabled,
    setComparisonEnabled,
    ...comparison,
    data,
    isLoading,
    error,
    refetch,
    syncStatus,
    ...handlers,
  }
}

/** Return type of useAdvertisingPageState for consumer typing */
export type AdvertisingPageState = ReturnType<typeof useAdvertisingPageState>
