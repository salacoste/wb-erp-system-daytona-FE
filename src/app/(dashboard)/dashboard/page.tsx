'use client'

import { useDashboardMetrics } from '@/hooks/useDashboard'
import { useProcessingStatus } from '@/hooks/useProcessingStatus'
import { MetricCard } from '@/components/custom/MetricCard'
import { InitialDataSummary } from '@/components/custom/InitialDataSummary'
import { ExpenseChart } from '@/components/custom/ExpenseChart'
import { TrendGraph } from '@/components/custom/TrendGraph'
import { AdvertisingDashboardWidget } from '@/components/custom/AdvertisingDashboardWidget'
import { RequireWbToken } from '@/components/custom/RequireWbToken'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, Info } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

/**
 * Main dashboard page
 * Story 3.1: Main Dashboard Layout & Navigation
 * Story 3.2: Key Metric Cards Display
 * Story 3.3: Expense Breakdown Visualization
 * Story 3.4: Trend Graphs for Key Metrics
 * Story 2.4: Initial Data Display After Processing (component reused here)
 *
 * Uses RequireWbToken to redirect to /wb-token if no WB API token is configured
 */
export default function DashboardPage() {
  const queryClient = useQueryClient()
  const { data: metrics, isLoading, error, refetch } = useDashboardMetrics()
  const { data: processingStatus } = useProcessingStatus()

  // Debug: Log metrics received in component
  if (metrics) {
    console.info('[Dashboard Page] Metrics received in component:', {
      totalPayable: metrics.totalPayable,
      revenue: metrics.revenue,
      metrics_full: metrics,
    })
  }

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'metrics'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'expenses'] })
    refetch()
  }

  // Check if financial data is available through metrics
  // If metrics are loaded (even if values are 0), it means data is processed
  // This fixes the issue where processing window shows even when data is already available
  // (e.g., when finances_weekly_ingest task doesn't exist in tasks table but data is processed)
  const hasFinancialData =
    metrics !== undefined &&
    (metrics.totalPayable !== undefined || metrics.revenue !== undefined)

  // Show processing window only if:
  // 1. No data available (metrics not loaded or undefined) AND
  // 2. Processing is in progress or pending
  // This prevents showing processing window when data is already available
  const isFinancialDataProcessing =
    !hasFinancialData &&
    (processingStatus?.reportLoading?.status === 'in_progress' ||
      processingStatus?.reportLoading?.status === 'pending')

  const isFinancialDataFailed =
    processingStatus?.reportLoading?.status === 'failed'

  return (
    <RequireWbToken>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Главная страница</h2>
          <p className="text-muted-foreground">
            Обзор ваших данных и ключевых метрик
          </p>
        </div>

        {/* Financial Data Processing Status */}
        {isFinancialDataProcessing && (
          <Alert className="border-blue-500 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <p className="font-semibold mb-1">Обработка финансовых данных</p>
              <p>
                Финансовые отчеты обрабатываются. Метрики и разбивка расходов
                появятся после завершения обработки.
                {processingStatus?.reportLoading?.progress !== undefined && (
                  <span className="ml-2">
                    Прогресс: {processingStatus.reportLoading.progress}%
                  </span>
                )}
              </p>
            </AlertDescription>
          </Alert>
        )}

        {isFinancialDataFailed && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-1">
                Ошибка обработки финансовых данных
              </p>
              <p>
                Не удалось обработать финансовые отчеты. Пожалуйста, проверьте
                настройки кабинета и попробуйте еще раз.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Error State */}
        {error && !isFinancialDataProcessing && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                Не удалось загрузить метрики. Пожалуйста, попробуйте еще раз.
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="ml-4"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Повторить
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Key Metric Cards - Story 3.2 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          <MetricCard
            title="К перечислению за товар"
            value={metrics?.totalPayable}
            isLoading={isLoading}
            error={error ? 'Ошибка загрузки' : null}
          />
          <MetricCard
            title="Вайлдберриз реализовал Товар"
            value={metrics?.revenue}
            isLoading={isLoading}
            error={error ? 'Ошибка загрузки' : null}
          />
        </div>

        {/* Advertising Widget - Story 33.7-fe */}
        <AdvertisingDashboardWidget />

        {/* Expense Breakdown Chart - Story 3.3 */}
        <ExpenseChart />

        {/* Trend Graphs - Story 3.4 */}
        <TrendGraph />

        {/* Initial Data Summary - Story 2.4 (reused from Story 3.1) */}
        <InitialDataSummary />
      </div>
    </RequireWbToken>
  )
}
