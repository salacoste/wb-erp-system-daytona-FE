'use client'

import { useState, useCallback } from 'react'
import { RefreshCw, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useSupplyPlanning } from '@/hooks/useSupplyPlanning'
import type { StockoutRisk, SupplyPlanningQueryParams } from '@/types/supply-planning'
import { SupplyPlanningHeader } from './components/SupplyPlanningHeader'
import { SupplyRiskCards } from './components/SupplyRiskCards'
import { SupplyMetricsBar } from './components/SupplyMetricsBar'
import { SupplyPlanningEmpty } from './components/SupplyPlanningEmpty'
import { SupplyPlanningLoading } from './components/SupplyPlanningLoading'
import { SupplyPlanningTable } from './components/SupplyPlanningTable'

/**
 * Supply Planning Analytics Page
 * Story 6.2: Supply Planning Page Structure & Risk Dashboard
 * Epic 6: Supply Planning & Stockout Prevention
 *
 * Displays stockout risk dashboard with 5 status cards,
 * total metrics bar, and filtered SKU table (Story 6.3).
 */
export default function SupplyPlanningPage() {
  // Filter state
  const [safetyStockDays, setSafetyStockDays] = useState(14)
  const [velocityWeeks, setVelocityWeeks] = useState(4)
  const [activeFilter, setActiveFilter] = useState<StockoutRisk | null>(null)

  // Build query params
  const queryParams: SupplyPlanningQueryParams = {
    safety_stock_days: safetyStockDays,
    velocity_weeks: velocityWeeks,
    show_only: activeFilter ? 'stockout_risk' : 'all',
    sort_by: 'days_until_stockout',
    sort_order: 'asc',
    limit: 200,
  }

  // Fetch data
  const {
    data,
    isLoading,
    error,
    refetch,
    dataUpdatedAt,
  } = useSupplyPlanning(queryParams, {
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // 5 minutes auto-refresh
  })

  // Handle card click - toggle filter
  const handleCardClick = useCallback((status: StockoutRisk) => {
    setActiveFilter(prev => prev === status ? null : status)
  }, [])

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refetch()
  }, [refetch])

  // Handle safety stock days change
  const handleSafetyStockChange = useCallback((days: number) => {
    setSafetyStockDays(days)
  }, [])

  // Handle velocity weeks change
  const handleVelocityWeeksChange = useCallback((weeks: number) => {
    setVelocityWeeks(weeks)
  }, [])

  // Error state
  if (error) {
    console.error('Supply planning error:', error)
    return (
      <div className="space-y-6">
        <SupplyPlanningHeader
          safetyStockDays={safetyStockDays}
          velocityWeeks={velocityWeeks}
          onSafetyStockChange={handleSafetyStockChange}
          onVelocityWeeksChange={handleVelocityWeeksChange}
          onRefresh={handleRefresh}
          isRefreshing={isLoading}
        />
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Не удалось загрузить данные о поставках. Попробуйте ещё раз.</span>
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
        <SupplyPlanningHeader
          safetyStockDays={safetyStockDays}
          velocityWeeks={velocityWeeks}
          onSafetyStockChange={handleSafetyStockChange}
          onVelocityWeeksChange={handleVelocityWeeksChange}
          onRefresh={handleRefresh}
          isRefreshing={true}
        />
        <SupplyPlanningLoading />
      </div>
    )
  }

  // Empty state - no data
  if (!data || !data.summary || data.summary.total_skus === 0) {
    return (
      <div className="space-y-6">
        <SupplyPlanningHeader
          safetyStockDays={safetyStockDays}
          velocityWeeks={velocityWeeks}
          onSafetyStockChange={handleSafetyStockChange}
          onVelocityWeeksChange={handleVelocityWeeksChange}
          onRefresh={handleRefresh}
          isRefreshing={isLoading}
        />
        <SupplyPlanningEmpty />
      </div>
    )
  }

  // Filter data by active status
  const filteredData = activeFilter
    ? data.data.filter(item => item.stockout_risk === activeFilter)
    : data.data

  return (
    <div className="space-y-6">
      {/* Page Header with Controls */}
      <SupplyPlanningHeader
        safetyStockDays={safetyStockDays}
        velocityWeeks={velocityWeeks}
        onSafetyStockChange={handleSafetyStockChange}
        onVelocityWeeksChange={handleVelocityWeeksChange}
        onRefresh={handleRefresh}
        isRefreshing={isLoading}
        lastUpdated={dataUpdatedAt ? new Date(dataUpdatedAt) : undefined}
      />

      {/* Risk Summary Cards (5 cards) */}
      <SupplyRiskCards
        summary={data.summary}
        activeFilter={activeFilter}
        onCardClick={handleCardClick}
      />

      {/* Total Metrics Bar */}
      <SupplyMetricsBar summary={data.summary} />

      {/* Table Section - Story 6.3 */}
      <SupplyPlanningTable
        data={filteredData}
        activeFilter={activeFilter}
        onClearFilter={() => setActiveFilter(null)}
      />
    </div>
  )
}
