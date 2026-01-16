'use client'

import { useRouter } from 'next/navigation'
import { useProductsCount } from '@/hooks/useProducts'
import { useDashboardMetrics } from '@/hooks/useDashboard'
import { useDataImportNotification } from '@/hooks/useDataImportNotification'
import { formatCurrency } from '@/lib/utils'
import { checkWbTokenError } from '@/lib/error-utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ROUTES } from '@/lib/routes'
import { CheckCircle2, Package, TrendingUp, ArrowRight, X } from 'lucide-react'

/**
 * Initial data summary component for onboarding completion
 * Story 2.4: Initial Data Display After Processing
 * Enhanced with dismissible notification (Story 3.2 follow-up)
 */
export function InitialDataSummary() {
  const router = useRouter()
  const { data: productCount, isLoading: productsLoading, error: productsError } = useProductsCount()
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics()

  const isLoading = productsLoading || metricsLoading

  const isWbTokenMissing = checkWbTokenError(productsError)

  const hasData =
    (productCount !== undefined && productCount > 0) ||
    (metrics && (metrics.totalPayable !== undefined || metrics.revenue !== undefined))

  const {
    isNotificationVisible,
    handleDismissNotification,
  } = useDataImportNotification(!!hasData, isLoading)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Загрузка данных...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-4 w-full bg-muted rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show message if WB API token is missing
  if (isWbTokenMissing) {
    return (
      <Alert className="border-yellow-500 bg-yellow-50">
        <AlertDescription className="text-yellow-900">
          <p className="font-semibold mb-2">WB API токен не настроен</p>
          <p className="mb-4">
            Для получения данных о товарах необходимо настроить WB API токен.
            Перейдите в настройки кабинета для ввода токена.
          </p>
          <Button
            onClick={() => router.push(ROUTES.SETTINGS.ROOT)}
            variant="outline"
            size="sm"
          >
            Перейти в настройки
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (!hasData) {
    return (
      <Alert>
        <AlertDescription>
          Данные еще не загружены. Пожалуйста, подождите завершения обработки
          данных.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Success Message - Dismissible */}
      {isNotificationVisible && (
        <Alert className="border-green-500 bg-green-50 flex items-start gap-3 [&>svg]:relative [&>svg]:left-0 [&>svg]:top-0 [&>svg+div]:translate-y-0 [&>svg~*]:pl-0">
          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
          <AlertDescription className="text-green-900 m-0 flex-1 flex items-center justify-between gap-4">
            <span>
              Данные успешно загружены! Вы можете начать работу с системой.
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismissNotification}
              className="h-6 w-6 flex-shrink-0 text-green-700 hover:text-green-900 hover:bg-green-100"
              aria-label="Закрыть уведомление"
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Data Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Product Count Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <CardTitle>Товары</CardTitle>
            </div>
            <CardDescription>Количество обработанных товаров</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-600">
              {productCount?.toLocaleString('ru-RU') || 0}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              товаров загружено из Wildberries
            </p>
          </CardContent>
        </Card>

        {/* Financial Metrics Card */}
        {metrics && (metrics.totalPayable || metrics.revenue) && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <CardTitle>Финансовые показатели</CardTitle>
              </div>
              <CardDescription>Ключевые метрики</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {metrics.totalPayable !== undefined && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    К перечислению за товар
                  </p>
                  <p className="text-2xl font-semibold text-blue-600">
                    {formatCurrency(metrics.totalPayable)}
                  </p>
                </div>
              )}
              {metrics.revenue !== undefined && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Вайлдберриз реализовал Товар
                  </p>
                  <p className="text-2xl font-semibold text-blue-600">
                    {formatCurrency(metrics.revenue)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Call to Action */}
      <Card>
        <CardHeader>
          <CardTitle>Следующий шаг</CardTitle>
          <CardDescription>
            Для анализа маржинальности необходимо назначить себестоимость
            товаров (COGS)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => router.push(ROUTES.COGS.ROOT)}
              className="flex items-center gap-2"
            >
              Назначить COGS
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(ROUTES.DASHBOARD)}
            >
              Перейти на главную
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            После назначения COGS вы сможете видеть анализ маржинальности по
            товарам, брендам и категориям.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
