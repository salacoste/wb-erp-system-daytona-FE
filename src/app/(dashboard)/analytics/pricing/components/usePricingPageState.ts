'use client'

/**
 * Pricing page state hook — manages filters, sort, and data fetching
 * Epic 121 Phase 1: Per-SKU price recommendation engine
 */

import { useState, useCallback } from 'react'
import { usePriceRecommendations, usePriceRefresh } from '@/hooks/usePriceRecommendations'

const DEFAULT_TARGET_MARGIN = 15
const DEFAULT_LIMIT = 50

export type GapFilter = '' | 'above_target' | 'below_target' | 'at_target'
export type SortOption = '' | 'gap_pct' | 'margin_at_current_pct' | 'recommended_price'

export function usePricingPageState() {
  const [targetMargin, setTargetMargin] = useState(DEFAULT_TARGET_MARGIN)
  const [gapFilter, setGapFilter] = useState<GapFilter>('')
  const [sort, setSort] = useState<SortOption>('')

  const queryResult = usePriceRecommendations({
    limit: DEFAULT_LIMIT,
    target_margin_pct: targetMargin,
    gap_filter: gapFilter || undefined,
    sort: sort || undefined,
  })

  const refreshMutation = usePriceRefresh()

  const handleTargetMarginChange = useCallback((value: number) => {
    setTargetMargin(value)
  }, [])

  const handleGapFilterChange = useCallback((value: GapFilter) => {
    setGapFilter(value)
  }, [])

  const handleSortChange = useCallback((value: SortOption) => {
    setSort(value)
  }, [])

  const handleRefresh = useCallback(() => {
    refreshMutation.mutate()
  }, [refreshMutation])

  return {
    items: queryResult.data?.items ?? [],
    total: queryResult.data?.total ?? 0,
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    error: queryResult.error,
    targetMargin,
    gapFilter,
    sort,
    isRefreshing: refreshMutation.isPending,
    handleTargetMarginChange,
    handleGapFilterChange,
    handleSortChange,
    handleRefresh,
  }
}
