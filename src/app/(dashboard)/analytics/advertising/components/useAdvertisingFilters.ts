'use client'

import { useMemo } from 'react'
import type { AdvertisingAnalyticsResponse, GroupByMode } from '@/types/advertising-analytics'
import { features } from '@/config/features'
// Story 37.1: Real API integration (Request #88)
import { transformMergedGroups } from '@/lib/transformers/advertising-transformers'
// Story 73.6: Over-attribution filter utilities
import {
  countOverAttributionItems,
  filterOutOverAttribution,
  recomputeSummary,
} from '../utils/over-attribution-utils'

/**
 * Advertising filters/derivation hook.
 * Computes filtered data, summaries, loss/over-attribution counts,
 * and merged group data from raw query results.
 *
 * Story 33.4-fe, Story 73.6-FE, Epic 37
 */
export function useAdvertisingFilters(
  data: AdvertisingAnalyticsResponse | undefined,
  hideOverAttribution: boolean,
  groupBy: GroupByMode
) {
  // Check if data exists (for summary)
  const hasData = data?.data && data.data.length > 0

  // Count loss items for alert banner (Story 33.4-fe AC4)
  // IMPORTANT: Must be called before any early returns to comply with React hooks rules
  const lossCount = useMemo(() => {
    if (!data?.data) return 0
    return data.data.filter(item => item.efficiency_status === 'loss').length
  }, [data?.data])

  // Story 73.6: Count over-attribution items and compute filtered data
  const overAttributionCount = useMemo(() => {
    if (!data?.data) return 0
    return countOverAttributionItems(data.data)
  }, [data?.data])

  const filteredData = useMemo(() => {
    if (!hideOverAttribution || !data?.data) return data?.data ?? []
    return filterOutOverAttribution(data.data)
  }, [data?.data, hideOverAttribution])

  const filteredSummary = useMemo(() => {
    if (!hideOverAttribution || !data?.summary || !data?.data) return data?.summary
    return recomputeSummary(filteredData, data.summary)
  }, [data?.summary, data?.data, filteredData, hideOverAttribution])

  // Calculate total count for pagination (uses filteredData to account for client-side filters)
  const totalCount = filteredData.length

  // Epic 37: Get merged groups data
  // Story 37.1: Transform real API response to AdvertisingGroup[] (Request #88)
  // Story 73.6: Use filteredData when over-attribution filter is active
  const mergedGroupsData = useMemo(() => {
    if (!features.epic37MergedGroups.enabled || groupBy !== 'imtId') {
      return []
    }

    const sourceData = filteredData
    if (!sourceData || sourceData.length === 0) {
      return []
    }

    // Transform backend response to frontend AdvertisingGroup[] type
    const transformed = transformMergedGroups(sourceData)

    return transformed
  }, [groupBy, filteredData])

  return {
    hasData,
    lossCount,
    overAttributionCount,
    filteredData,
    filteredSummary,
    totalCount,
    mergedGroupsData,
  }
}

/** Return type of useAdvertisingFilters for consumer typing */
export type AdvertisingFiltersResult = ReturnType<typeof useAdvertisingFilters>
