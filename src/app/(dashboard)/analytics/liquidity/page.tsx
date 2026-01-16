'use client'

import { useState, useCallback } from 'react'
import { RefreshCw, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useLiquidity } from '@/hooks/useLiquidity'
import type { LiquidityCategory, LiquidityQueryParams } from '@/types/liquidity'
import { LiquidityHeader } from './components/LiquidityHeader'
import { LiquidityDistributionCards } from './components/LiquidityDistributionCards'
import { LiquiditySummaryBar } from './components/LiquiditySummaryBar'
import { LiquidityBenchmarks } from './components/LiquidityBenchmarks'
import { LiquidityEmpty } from './components/LiquidityEmpty'
import { LiquidityLoading } from './components/LiquidityLoading'
import { LiquidityTable } from './components/LiquidityTable'

/**
 * Liquidity Analysis Page
 * Story 7.2: Liquidity Page Structure
 * Epic 7: Liquidity Analysis (Ликвидность товаров)
 *
 * Displays liquidity distribution dashboard with 4 category cards,
 * summary metrics bar, benchmarks comparison, and filtered SKU table (Story 7.3).
 */
export default function LiquidityPage() {
  // Filter state
  const [activeFilter, setActiveFilter] = useState<LiquidityCategory | null>(null)
  const [sortBy, setSortBy] = useState<'turnover_days' | 'stock_value' | 'velocity_per_day'>('turnover_days')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Build query params
  const queryParams: LiquidityQueryParams = {
    category_filter: activeFilter || 'all',
    sort_by: sortBy,
    sort_order: sortOrder,
    include_liquidation_scenarios: activeFilter === 'illiquid' || activeFilter === null,
    limit: 200,
  }

  // Fetch data
  const {
    data,
    isLoading,
    error,
    refetch,
    dataUpdatedAt,
  } = useLiquidity(queryParams, {
    staleTime: 300000, // 5 minutes
    refetchInterval: 600000, // 10 minutes auto-refresh
  })

  // Handle card click - toggle filter
  const handleCardClick = useCallback((category: LiquidityCategory) => {
    setActiveFilter(prev => prev === category ? null : category)
  }, [])

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refetch()
  }, [refetch])

  // Handle sort change
  const handleSortChange = useCallback((
    field: 'turnover_days' | 'stock_value' | 'velocity_per_day',
    order: 'asc' | 'desc'
  ) => {
    setSortBy(field)
    setSortOrder(order)
  }, [])

  // Error state
  if (error) {
    console.error('Liquidity analysis error:', error)
    return (
      <div className="space-y-6">
        <LiquidityHeader
          onRefresh={handleRefresh}
          isRefreshing={isLoading}
        />
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Не удалось загрузить данные о ликвидности. Попробуйте ещё раз.</span>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Повторить
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Loading state
  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <LiquidityHeader
          onRefresh={handleRefresh}
          isRefreshing={true}
        />
        <LiquidityLoading />
      </div>
    )
  }

  // Empty state - no data
  if (!data || !data.summary || data.summary.total_sku_count === 0) {
    return (
      <div className="space-y-6">
        <LiquidityHeader
          onRefresh={handleRefresh}
          isRefreshing={isLoading}
        />
        <LiquidityEmpty />
      </div>
    )
  }

  // Filter data by active category
  const filteredData = activeFilter
    ? data.data.filter(item => item.liquidity_category === activeFilter)
    : data.data

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <LiquidityHeader
        onRefresh={handleRefresh}
        isRefreshing={isLoading}
        lastUpdated={dataUpdatedAt ? new Date(dataUpdatedAt) : undefined}
      />

      {/* Distribution Cards (4 categories) */}
      <LiquidityDistributionCards
        distribution={data.summary.distribution}
        activeFilter={activeFilter}
        onCardClick={handleCardClick}
      />

      {/* Summary Metrics Bar */}
      <LiquiditySummaryBar summary={data.summary} />

      {/* Benchmarks Comparison */}
      <LiquidityBenchmarks benchmarks={data.summary.benchmarks} />

      {/* Table Section - Story 7.3 */}
      <LiquidityTable
        data={filteredData}
        activeFilter={activeFilter}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        onClearFilter={() => setActiveFilter(null)}
      />
    </div>
  )
}
