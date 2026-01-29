'use client'

/**
 * OrdersAnalyticsDashboard Component
 * Story 40.6-FE: Orders Analytics Dashboard
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Main dashboard container orchestrating SLA, velocity, and at-risk widgets.
 * Reference: docs/stories/epic-40/story-40.6-fe-orders-analytics-dashboard.md
 */

import { useState, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useSlaMetrics, useVelocityMetrics } from '@/hooks/useOrdersAnalytics'
import { useOrdersSyncStatus, useOrdersSync } from '@/hooks/useOrders'
import { SlaComplianceWidget } from './SlaComplianceWidget'
import { VelocityMetricsWidget } from './VelocityMetricsWidget'
import { AtRiskOrdersCard } from './AtRiskOrdersCard'
import { OrderSyncStatus } from './OrderSyncStatus'

const PAGE_SIZE = 10

/** Calculate date range for velocity metrics (last 30 days) */
function getDefaultDateRange() {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 30)

  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  }
}

interface OrdersAnalyticsDashboardProps {
  /** Callback when order is clicked in at-risk list */
  onOrderClick?: (orderId: string) => void
}

/**
 * OrdersAnalyticsDashboard - Main analytics container with polling
 */
export function OrdersAnalyticsDashboard({ onOrderClick }: OrdersAnalyticsDashboardProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const dateRange = getDefaultDateRange()

  // SLA metrics with 60s polling
  const slaQuery = useSlaMetrics({
    atRiskLimit: PAGE_SIZE,
    atRiskOffset: currentPage * PAGE_SIZE,
    refetchInterval: 60000,
  })

  // Velocity metrics with 5min polling
  const velocityQuery = useVelocityMetrics(dateRange.from, dateRange.to, {
    enabled: true,
  })

  // Sync status
  const syncStatusQuery = useOrdersSyncStatus()

  // Sync mutation
  const syncMutation = useOrdersSync({
    onSuccess: () => {
      toast.success('Синхронизация запущена')
    },
    onError: error => {
      toast.error(`Ошибка синхронизации: ${error.message}`)
    },
  })

  // Handle manual sync
  const handleSync = useCallback(() => {
    syncMutation.mutate()
  }, [syncMutation])

  // Handle page change for at-risk orders
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  // Handle order click
  const handleOrderClick = useCallback(
    (orderId: string) => {
      onOrderClick?.(orderId)
    },
    [onOrderClick]
  )

  // Refetch handlers
  const handleSlaRetry = useCallback(() => {
    slaQuery.refetch()
  }, [slaQuery])

  const handleVelocityRetry = useCallback(() => {
    velocityQuery.refetch()
  }, [velocityQuery])

  return (
    <div className="space-y-6">
      {/* Header with sync status */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Заказы FBS</h1>
          <OrderSyncStatus
            status={syncStatusQuery.data}
            isLoading={syncStatusQuery.isLoading}
            data-testid="order-sync-status"
          />
        </div>
        <Button
          variant="outline"
          onClick={handleSync}
          disabled={syncMutation.isPending}
          aria-label="Обновить данные"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          {syncMutation.isPending ? 'Синхронизация...' : 'Обновить'}
          {syncMutation.isPending && (
            <span data-testid="sync-spinner" className="sr-only">
              Загрузка
            </span>
          )}
        </Button>
      </div>

      {/* Main widgets grid */}
      <div
        className="grid grid-cols-1 gap-6 md:grid-cols-2"
        data-testid="analytics-grid"
        aria-busy={slaQuery.isLoading || velocityQuery.isLoading}
      >
        <SlaComplianceWidget
          data={slaQuery.data}
          isLoading={slaQuery.isLoading}
          error={slaQuery.error}
          onRetry={handleSlaRetry}
        />
        <VelocityMetricsWidget
          data={velocityQuery.data}
          isLoading={velocityQuery.isLoading}
          error={velocityQuery.error}
          onRetry={handleVelocityRetry}
        />
      </div>

      {/* At-risk orders card (full width) */}
      <AtRiskOrdersCard
        orders={slaQuery.data?.atRiskOrders}
        total={slaQuery.data?.atRiskTotal}
        page={currentPage}
        isLoading={slaQuery.isLoading}
        error={slaQuery.error}
        onPageChange={handlePageChange}
        onOrderClick={handleOrderClick}
        onRetry={handleSlaRetry}
      />
    </div>
  )
}
