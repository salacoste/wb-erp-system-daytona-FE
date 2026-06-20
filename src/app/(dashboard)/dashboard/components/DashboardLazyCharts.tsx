'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Clock } from 'lucide-react'
import { useDelayedLoadingState } from '@/hooks/useDelayedLoadingState'

/**
 * Lazy-loaded chart components for the main dashboard.
 * Recharts heavyweight components loaded below-the-fold.
 * Extracted from DashboardContent.tsx for file size compliance.
 */

function DashboardChartLazyFallback({
  title = 'График',
  description = 'Компонент графика подготавливается',
}: {
  title?: string
  description?: string
}) {
  const showSlowLoading = useDelayedLoadingState(true)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {showSlowLoading ? (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              График загружается дольше обычного. Остальная часть страницы доступна.
            </AlertDescription>
          </Alert>
        ) : (
          <Skeleton className="h-64 w-full" />
        )}
      </CardContent>
    </Card>
  )
}

export const ExpenseChart = dynamic(
  () => import('@/components/custom/ExpenseChart').then(m => ({ default: m.ExpenseChart })),
  {
    ssr: false,
    loading: () => <DashboardChartLazyFallback title="Расходы" />,
  }
)

export const ExpenseStructurePieChart = dynamic(
  () =>
    import('@/components/custom/dashboard/ExpenseStructurePieChart').then(m => ({
      default: m.ExpenseStructurePieChart,
    })),
  {
    ssr: false,
    loading: () => <DashboardChartLazyFallback title="Структура расходов" />,
  }
)

export const TrendGraph = dynamic(
  () => import('@/components/custom/TrendGraph').then(m => ({ default: m.TrendGraph })),
  {
    ssr: false,
    loading: () => (
      <DashboardChartLazyFallback
        title="Тренды ключевых метрик"
        description="Изменение метрик по неделям"
      />
    ),
  }
)

export const OrdersSeasonalPatterns = dynamic(
  () =>
    import('@/components/custom/dashboard/OrdersSeasonalPatterns').then(m => ({
      default: m.OrdersSeasonalPatterns,
    })),
  {
    ssr: false,
    loading: () => <DashboardChartLazyFallback title="Сезонные паттерны заказов" />,
  }
)

export const HistoricalTrendsSection = dynamic(
  () =>
    import('@/components/custom/dashboard/HistoricalTrendsSection').then(m => ({
      default: m.HistoricalTrendsSection,
    })),
  {
    ssr: false,
    loading: () => <DashboardChartLazyFallback title="Исторические тренды" />,
  }
)
