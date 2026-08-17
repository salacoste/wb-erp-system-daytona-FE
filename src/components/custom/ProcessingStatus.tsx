'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useProcessingStatus } from '@/hooks/useProcessingStatus'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ROUTES } from '@/lib/routes'
import { formatPercentageInt } from '@/lib/utils'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { ProcessingNoData } from './ProcessingNoData'
import { getStatusIcon, getStatusText } from './processing-status/StatusHelpers'

/**
 * Processing status component for onboarding flow
 * Story 2.3: Data Processing Status Indicators
 * Story 167.6: shadcn migration — semantic success tokens, shared Skeleton,
 * progressbar semantics, restrained live regions; behavior/copy unchanged.
 */
export function ProcessingStatus() {
  const router = useRouter()
  const { data: status, isLoading, error } = useProcessingStatus()

  // Auto-redirect to dashboard when processing completes
  useEffect(() => {
    if (status?.status === 'completed') {
      const timer = setTimeout(() => {
        router.push(ROUTES.DASHBOARD)
      }, 2000) // Wait 2 seconds to show completion message
      return () => clearTimeout(timer)
    }
  }, [status?.status, router])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Проверка статуса обработки...</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              aria-busy="true"
              aria-label="Загрузка статуса обработки"
              role="status"
              className="space-y-4"
            >
              <Skeleton className="h-2 w-full motion-reduce:animate-none" />
              <Skeleton className="h-2 w-full motion-reduce:animate-none" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Ошибка загрузки статуса</AlertTitle>
        <AlertDescription>
          Не удалось загрузить статус обработки. Пожалуйста, обновите страницу.
        </AlertDescription>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Обновить страницу
        </Button>
      </Alert>
    )
  }

  if (!status) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Статус не найден</AlertTitle>
        <AlertDescription>
          Статус обработки не найден. Возможно, обработка еще не началась.
        </AlertDescription>
      </Alert>
    )
  }

  // Terminal "nothing to import" state — no batches enqueued within the poll cap.
  // Manual CTA only (no auto-redirect); see ProcessingNoData for copy rationale.
  if (status.status === 'no_data') {
    return <ProcessingNoData />
  }

  return (
    <div className="space-y-6">
      {status.status === 'completed' && (
        <Alert className="border-status-success/50 bg-status-success/10">
          <CheckCircle2 className="h-4 w-4 text-status-success" />
          <AlertTitle>Обработка завершена!</AlertTitle>
          <AlertDescription>
            Все данные успешно обработаны. Перенаправление на главную страницу...
          </AlertDescription>
        </Alert>
      )}

      {status.status === 'failed' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка обработки</AlertTitle>
          <AlertDescription>
            {status.error ||
              'Произошла ошибка при обработке данных. Пожалуйста, попробуйте позже или обратитесь в поддержку.'}
          </AlertDescription>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" className="min-h-11" onClick={() => window.location.reload()}>
              Повторить попытку
            </Button>
            <Button
              variant="outline"
              className="min-h-11"
              onClick={() => router.push(ROUTES.DASHBOARD)}
            >
              Перейти на главную
            </Button>
          </div>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Статус обработки данных</CardTitle>
          <CardDescription>
            Система обрабатывает ваши данные Wildberries. Это может занять несколько минут.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Product Parsing Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(status.productParsing.status)}
                <span className="font-medium">Парсинг продуктов</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatPercentageInt(status.productParsing.progress)}
              </span>
            </div>
            <Progress
              value={status.productParsing.progress}
              className="h-2"
              aria-label="Прогресс парсинга продуктов"
            />
            <p className="text-sm text-muted-foreground">
              {getStatusText(
                status.productParsing.status,
                'Парсинг исторических данных за 3 месяца'
              )}
            </p>
          </div>

          {/* Financial Report Loading Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(status.reportLoading.status)}
                <span className="font-medium">Загрузка финансовых отчетов</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatPercentageInt(status.reportLoading.progress)}
              </span>
            </div>
            <Progress
              value={status.reportLoading.progress}
              className="h-2"
              aria-label="Прогресс загрузки финансовых отчетов"
            />
            <p className="text-sm text-muted-foreground">
              {getStatusText(
                status.reportLoading.status,
                'Загрузка финансовых отчетов за 3 месяца'
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
