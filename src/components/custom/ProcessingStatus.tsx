'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useProcessingStatus } from '@/hooks/useProcessingStatus'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/routes'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

/**
 * Processing status component for onboarding flow
 * Story 2.3: Data Processing Status Indicators
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
            <div className="space-y-4">
              <div className="h-2 w-full bg-muted rounded animate-pulse" />
              <div className="h-2 w-full bg-muted rounded animate-pulse" />
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
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
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

  const getStatusIcon = (taskStatus: string) => {
    if (taskStatus === 'completed') {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />
    }
    if (taskStatus === 'failed') {
      return <AlertCircle className="h-5 w-5 text-destructive" />
    }
    return <Loader2 className="h-5 w-5 text-primary animate-spin" />
  }

  const getStatusText = (taskStatus: string, taskName: string) => {
    if (taskStatus === 'completed') {
      return `${taskName} завершено`
    }
    if (taskStatus === 'failed') {
      return `${taskName} завершилось с ошибкой`
    }
    if (taskStatus === 'in_progress') {
      return `${taskName} выполняется...`
    }
    return `${taskName} ожидает начала...`
  }

  return (
    <div className="space-y-6">
      {status.status === 'completed' && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
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
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Повторить попытку
            </Button>
            <Button
              variant="outline"
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
            Система обрабатывает ваши данные Wildberries. Это может занять
            несколько минут.
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
                {status.productParsing.progress}%
              </span>
            </div>
            <Progress value={status.productParsing.progress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {getStatusText(
                status.productParsing.status,
                'Парсинг исторических данных за 3 месяца',
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
                {status.reportLoading.progress}%
              </span>
            </div>
            <Progress value={status.reportLoading.progress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {getStatusText(
                status.reportLoading.status,
                'Загрузка финансовых отчетов за 3 месяца',
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

