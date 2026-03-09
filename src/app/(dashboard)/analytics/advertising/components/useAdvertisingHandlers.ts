'use client'

import type { Dispatch, SetStateAction } from 'react'
import type { ViewByMode, GroupByMode } from '@/types/advertising-analytics'
import type { SortField, SortOrder } from './PerformanceMetricsTable'
import type { EfficiencyFilter } from './EfficiencyFilterDropdown'
import { trackToggleMode, trackTableSort, trackRowClick } from '@/lib/analytics-events'

/** Setters bag passed from useAdvertisingPageState to build handlers */
export interface AdvertisingStateSetters {
  setDateRange: Dispatch<SetStateAction<{ from: string; to: string }>>
  setViewBy: Dispatch<SetStateAction<ViewByMode>>
  setGroupBy: Dispatch<SetStateAction<GroupByMode>>
  setSortBy: Dispatch<SetStateAction<SortField>>
  setSortOrder: Dispatch<SetStateAction<SortOrder>>
  setEfficiencyFilter: Dispatch<SetStateAction<EfficiencyFilter>>
  setPage: Dispatch<SetStateAction<number>>
  setSelectedCampaigns: Dispatch<SetStateAction<number[]>>
  /** Current values needed for toggle logic */
  sortBy: SortField
  sortOrder: SortOrder
  groupBy: GroupByMode
}

/**
 * Builds all handler functions for the advertising page.
 * Pure function (not a hook) — deterministic, no hook calls.
 *
 * Story 33.2-FE, Epic 36, Story 37.5
 */
export function buildAdvertisingHandlers(s: AdvertisingStateSetters) {
  const handleDateRangeChange = (from: string, to: string) => {
    s.setDateRange({ from, to })
    s.setPage(1)
  }

  const handleViewByChange = (view: ViewByMode) => {
    s.setViewBy(view)
    s.setPage(1)
  }

  // Handle sort change (AC3)
  const handleSortChange = (field: SortField) => {
    const newOrder = s.sortBy === field ? (s.sortOrder === 'asc' ? 'desc' : 'asc') : 'desc'
    trackTableSort({ column: field, direction: newOrder, viewMode: s.groupBy })
    if (s.sortBy === field) {
      s.setSortOrder(newOrder)
    } else {
      s.setSortBy(field)
      s.setSortOrder('desc')
    }
    s.setPage(1)
  }

  const handleEfficiencyFilterChange = (filter: EfficiencyFilter) => {
    s.setEfficiencyFilter(filter)
    s.setPage(1)
  }

  const handleCampaignFilterChange = (campaignIds: number[]) => {
    s.setSelectedCampaigns(campaignIds)
    s.setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    s.setPage(newPage)
  }

  // Epic 37: Handle product click in merged group table
  const handleProductClick = (nmId: number, groupId?: number | null, isMainProduct?: boolean) => {
    trackRowClick({
      nmId,
      groupId: groupId ?? null,
      isMainProduct: isMainProduct ?? false,
      viewMode: s.groupBy,
    })
  }

  // Story 37.5: Handle groupBy change with analytics tracking
  const handleGroupByChange = (newMode: GroupByMode) => {
    trackToggleMode({ mode: newMode, previousMode: s.groupBy })
    s.setGroupBy(newMode)
  }

  return {
    handleDateRangeChange,
    handleViewByChange,
    handleSortChange,
    handleEfficiencyFilterChange,
    handleCampaignFilterChange,
    handlePageChange,
    handleProductClick,
    handleGroupByChange,
  }
}

/** Return type of buildAdvertisingHandlers */
export type AdvertisingHandlers = ReturnType<typeof buildAdvertisingHandlers>
