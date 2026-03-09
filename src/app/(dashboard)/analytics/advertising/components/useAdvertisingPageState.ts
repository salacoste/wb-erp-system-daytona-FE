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

/** Page size for table pagination (AC5) */
export const PAGE_SIZE = 25

/** Max allowed date range in days */
const MAX_RANGE_DAYS = 90

/** Validated URL param arrays */
const validViews: ViewByMode[] = ['sku', 'campaign', 'brand', 'category']
const validGroupBys: GroupByMode[] = ['sku', 'imtId']
const validSortFields: SortField[] = [
  'spend',
  'revenue',
  'orders',
  'views',
  'clicks',
  'roas',
  'roi',
  'ctr',
  'cpc',
  'profit_after_ads',
]
const validSortOrders: SortOrder[] = ['asc', 'desc']
const validEfficiencyFilters: EfficiencyFilter[] = [
  'all',
  'excellent',
  'good',
  'moderate',
  'poor',
  'loss',
  'unknown',
]

/**
 * Advertising page state hook.
 * Manages all state, URL sync, data fetching, and handler wiring
 * for the advertising analytics page.
 *
 * Story 33.2-FE, Story 33.3-FE, Epic 33 (Frontend)
 */
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

  const [viewBy, setViewBy] = useState<ViewByMode>(() => {
    const p = searchParams.get('view')
    return validViews.includes(p as ViewByMode) ? (p as ViewByMode) : 'sku'
  })
  const [groupBy, setGroupBy] = useState<GroupByMode>(() => {
    const p = searchParams.get('group_by')
    return validGroupBys.includes(p as GroupByMode) ? (p as GroupByMode) : 'sku'
  })
  const [sortBy, setSortBy] = useState<SortField>(() => {
    const p = searchParams.get('sort')
    return validSortFields.includes(p as SortField) ? (p as SortField) : 'spend'
  })
  const [sortOrder, setSortOrder] = useState<SortOrder>(() => {
    const p = searchParams.get('order')
    return validSortOrders.includes(p as SortOrder) ? (p as SortOrder) : 'desc'
  })
  const [efficiencyFilter, setEfficiencyFilter] = useState<EfficiencyFilter>(() => {
    const p = searchParams.get('status')
    return validEfficiencyFilters.includes(p as EfficiencyFilter) ? (p as EfficiencyFilter) : 'all'
  })
  const [page, setPage] = useState(() => {
    const p = searchParams.get('page')
    return p ? parseInt(p, 10) : 1
  })
  const [selectedCampaigns, setSelectedCampaigns] = useState<number[]>(() => {
    const c = searchParams.get('campaigns')
    if (!c) return []
    return c
      .split(',')
      .map(Number)
      .filter(n => !isNaN(n))
  })
  const [hideOverAttribution, setHideOverAttribution] = useState(false)

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

  // Sync state to URL params
  const updateUrlParams = useCallback(() => {
    const params = new URLSearchParams()
    params.set('from', dateRange.from)
    params.set('to', dateRange.to)
    params.set('view', viewBy)
    params.set('group_by', groupBy)
    params.set('sort', sortBy)
    params.set('order', sortOrder)
    if (efficiencyFilter !== 'all') params.set('status', efficiencyFilter)
    if (page > 1) params.set('page', page.toString())
    if (selectedCampaigns.length > 0) params.set('campaigns', selectedCampaigns.join(','))
    router.replace(`?${params.toString()}`, { scroll: false })
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
