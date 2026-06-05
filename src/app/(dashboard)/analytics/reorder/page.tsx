'use client'

import { List } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useReorderPageState } from './components/useReorderPageState'
import { ReorderPageHeader } from './components/ReorderPageHeader'
import { ReorderSummaryCards } from './components/ReorderSummaryCards'
import { ReorderFilters } from './components/ReorderFilters'
import { ReorderTable } from './components/ReorderTable'

/**
 * Reorder Dashboard Page
 * Warehouse replenishment recommendations with fulfillment metrics.
 */
export default function ReorderDashboardPage() {
  const {
    statusFilter,
    handleStatusFilterChange,
    recommendations,
    isLoadingRecommendations,
    recommendationsError,
    metrics,
    isLoadingMetrics,
    isRefreshing,
    handleRefresh,
    handleMarkOrdered,
    handleMarkReceived,
    isUpdating,
  } = useReorderPageState()

  if (recommendationsError) {
    return (
      <div className="space-y-6">
        <ReorderPageHeader isRefreshing={false} onRefresh={handleRefresh} />
        <Alert variant="destructive">
          <AlertDescription>
            Не удалось загрузить рекомендации по пополнению. Попробуйте позже.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ReorderPageHeader isRefreshing={isRefreshing} onRefresh={handleRefresh} />

      <ReorderSummaryCards metrics={metrics} isLoading={isLoadingMetrics} />

      <ReorderFilters value={statusFilter} onChange={handleStatusFilterChange} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <List className="h-5 w-5 text-muted-foreground" />
            Рекомендации
            {!isLoadingRecommendations && (
              <span className="text-sm font-normal text-muted-foreground">
                ({recommendations.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ReorderTable
            data={recommendations}
            isLoading={isLoadingRecommendations}
            onMarkOrdered={handleMarkOrdered}
            onMarkReceived={handleMarkReceived}
            isUpdating={isUpdating}
          />
        </CardContent>
      </Card>
    </div>
  )
}
