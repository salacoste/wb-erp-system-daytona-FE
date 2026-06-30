'use client'

import { logger } from '@/lib/logger'

/**
 * Hook for margin analytics by SKU
 * Story 4.5: Margin Analysis by SKU
 * Epic 74: Extracted from useMarginAnalytics.ts for file size compliance
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { MarginAnalyticsSkuResponse } from '@/types/api'
import type { MarginAnalyticsFilters } from './margin-analytics-query-keys'
import {
  MARGIN_ANALYTICS_QUERY_CONFIG,
  buildMarginAnalyticsParams,
  extractItems,
  type RawMarginAnalyticsResponse,
} from './margin-analytics-query-keys'
import { mapSkuItem } from './margin-analytics-sku-mapper'

/**
 * Hook to fetch margin analytics by SKU
 * Story 6.1-FE: Supports weekStart/weekEnd for date range queries
 *
 * @returns Query result with margin data for each SKU
 */
export function useMarginAnalyticsBySku(filters: MarginAnalyticsFilters, enabled = true) {
  const {
    week,
    weekStart,
    weekEnd,
    compareTo,
    compareToStart,
    compareToEnd,
    includeCogs = true,
    includeAds = true,
    includeStock = true,
    cursor,
    limit = 50,
    nmId,
  } = filters

  const isRangeQuery = weekStart && weekEnd
  const effectiveWeek = week || weekStart || ''
  const isComparisonMode = !!(compareTo || (compareToStart && compareToEnd))

  return useQuery({
    queryKey: [
      'analytics',
      'margin',
      'by-sku',
      {
        week: effectiveWeek,
        weekStart,
        weekEnd,
        compareTo,
        compareToStart,
        compareToEnd,
        includeCogs,
        includeAds,
        includeStock,
        cursor,
        limit,
        nmId,
      },
    ],
    queryFn: async (): Promise<MarginAnalyticsSkuResponse> => {
      try {
        const params = buildMarginAnalyticsParams(filters)

        logger.debug('[Margin Analytics] Fetching SKU analytics:', {
          week: isRangeQuery ? `${weekStart} — ${weekEnd}` : week,
          isRangeQuery,
          isComparisonMode,
          includeCogs,
          includeAds,
          includeStock,
          cursor,
          limit,
          nmId: nmId ?? 'all',
        })

        const response = await apiClient.get<unknown[] | RawMarginAnalyticsResponse>(
          `/v1/analytics/weekly/by-sku?${params.toString()}`
        )

        const { items, meta } = extractItems(response)

        // Transform response — Request #60: Include operational costs per SKU
        let transformedData = items.map(item => mapSkuItem(item))

        // Story 4.9: Client-side filtering by nm_id
        if (nmId) {
          transformedData = transformedData.filter(item => String(item.nm_id) === String(nmId))
          logger.debug('[Margin Analytics] Filtered by nm_id:', {
            nmId,
            matchCount: transformedData.length,
          })
        }

        const transformed: MarginAnalyticsSkuResponse = {
          data: transformedData,
          meta: meta as MarginAnalyticsSkuResponse['meta'],
        }

        logger.debug('[Margin Analytics] SKU analytics received:', {
          count: transformed.data.length,
          has_cogs_data: transformed.data.some(item => item.cogs !== undefined),
        })

        return transformed
      } catch (error) {
        logger.error('[Margin Analytics] Failed to fetch SKU analytics:', error)
        throw error
      }
    },
    ...MARGIN_ANALYTICS_QUERY_CONFIG,
    enabled: enabled && !!(week || (weekStart && weekEnd)),
  })
}
